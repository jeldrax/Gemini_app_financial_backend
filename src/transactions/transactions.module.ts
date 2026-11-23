// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

// modulo que une el crud de movimientos con el servicio de gemini
@Module({
  imports: [GeminiModule], // importa GeminiModule para poder inyectar GeminiService
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
