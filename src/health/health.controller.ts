// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

// Controlador para la ruta /api/health (diagnóstico de red y estado del contenedor)
@Controller('health')
export class HealthController {
  @Public() // salta firebase por Public
  @Get() // Responde a GET /api/health
  check() {
    return {
      status: 'ok', // estado de la api
      service: 'gemini_financial_backend',
      timestamp: new Date().toISOString(), // hora de la consulta
    };
  }
}
