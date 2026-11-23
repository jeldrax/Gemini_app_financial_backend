// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService], // registra la conexion unica a sqlite
  exports: [DatabaseService], // permite inyectar DatabaseService en otros modulos
})
export class DatabaseModule {}
