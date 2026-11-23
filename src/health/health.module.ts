// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// expone la ruta publica /api/health
@Module({
  controllers: [HealthController], // controlador de diagnostico y healthcheck
})
export class HealthModule {}
