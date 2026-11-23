// src/auth/firebase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { IS_PUBLIC_KEY } from './public.decorator';

// protege las rutas validando el ID Token 
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector, // para leer si una ruta tiene @Public()
    private readonly configService: ConfigService, // para leer las credenciales del .env
  ) {
    this.ensureFirebaseAdminInitialized();
  }

  /// Inicializa Firebase Admin una sola vez
  private ensureFirebaseAdminInitialized(): void {
    if (getApps().length > 0) return; // evita inicializarlo dos veces

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n'); // Convierte "\n" en saltos de línea reales para la llave privada

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error(
        'Faltan variables de Firebase Admin en .env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).',
      );
      return;
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    this.logger.log(`Firebase Admin inicializado para proyecto: ${projectId}`);
  }

  /// Se ejecuta antes de entrar al controller: decide si deja pasar la petición o lanza 401
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Si el endpoint o controller tiene @Public(), pasa directo sin token
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (getApps().length === 0) {
      throw new UnauthorizedException('Firebase Admin no configurado en el servidor.');
    }

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;

    // Exige la cabecera "Authorization: Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token Bearer de autenticación.');
    }

    const idToken = authHeader.slice(7).trim(); // Quita el prefijo "Bearer "
    try {
      // Verifica firma y expiración del token con los servidores de Firebase
      const decoded = await getAuth().verifyIdToken(idToken);
      request.user = { uid: decoded.uid, email: decoded.email }; // Inyecta el usuario para @CurrentUser()
      return true;
    } catch {
      throw new UnauthorizedException('Token de Firebase inválido o expirado.');
    }
  }
}
