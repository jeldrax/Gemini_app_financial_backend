import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); 

  app.setGlobalPrefix('api'); // antepone /api a todas las rutas

  //cabecera de seguridad para para no dejar datos en caché
  app.use(helmet());
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  //para el caso de la version web
  app.enableCors();

  // valida todos los dtos de entrada antes de llegar al controller
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos extra que no existan en el dto
      forbidNonWhitelisted: true, // lanza 400 si envian propiedades no permitidas
      transform: true, // convierte tipos automaticamente segun el dto
    }),
  );

  // realiza el cierre ordenado/seguro caundo se cierre el contenedor o se apague el servidor para evitar la corrupción de datos
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 8000); //puerto
  await app.listen(port, '0.0.0.0'); // escucha en todas las interfaces(necesario para docker y tailscale)
}
void bootstrap();
