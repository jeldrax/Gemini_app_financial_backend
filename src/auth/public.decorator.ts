// src/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

// llave interna para FirebaseAuthGuard para saber si una ruta es pública
export const IS_PUBLIC_KEY = 'isPublic';

// Decorador @Public() para saltar el token de Firebase (ej. en /api/health para Docker)
// para comprobar que mi servidor siga #VIVO#
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
