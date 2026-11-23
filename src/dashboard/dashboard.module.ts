// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';

// modulo que expone las metricas de resumen para el dashboard
@Module({
  controllers: [DashboardController],
})
export class DashboardModule {}
