import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';

// Módulo de IA que agrupa el controlador y servicio de Gemini
@Module({
  controllers: [GeminiController], // utas http de /api/gemini/*
  providers: [GeminiService], // Instancia del servicio interno
  // Expone GeminiService para puedan inyectarlo otros modulos
  exports: [GeminiService],
})
export class GeminiModule {}