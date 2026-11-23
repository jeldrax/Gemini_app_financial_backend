// src/transactions/transactions.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/current-user.decorator';
import {
  ALLOWED_AUDIO_MIMES,
  MAX_MULTIMODAL_BYTES,
} from '../gemini/use-cases/extract-transaction.use-case';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { IngestTextDto } from './dto/ingest-text.dto';
import { TransactionsService } from './transactions.service';

// rutas protegidas para listar, crear, borrar y procesar movimientos con ia
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get() // lista movimientos recientes del usuario con limite opcional
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limite') limite?: string,
  ) {
    const parsedLimit = Number(limite);
    return this.transactionsService.findRecent(
      user.uid,
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50,
    );
  }

  @Post('manual') // crea un movimiento manual directo (201 Created)
  @HttpCode(HttpStatus.CREATED)
  createManual(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateManualTransactionDto,
  ) {
    return this.transactionsService.createManual(user.uid, dto);
  }

  @Delete(':id') // borra una transaccion por su id numerico
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (id <= 0) {
      throw new BadRequestException('Identificador de transacción inválido.');
    }
    return this.transactionsService.remove(user.uid, id);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // limita a 20 peticiones de ia por minuto
  @Post('ingest-text')
  ingestText(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IngestTextDto,
  ) {
    return this.transactionsService.ingestText(user.uid, dto.texto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // limita a 20 notas de voz por minuto
  @Post('ingest-voice')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(), // guarda el audio solo en ram para no escribir basura en docker
      limits: { fileSize: MAX_MULTIMODAL_BYTES }, // tope de 5 mb anti-abuso
    }),
  )
  ingestVoice(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('mime_type') mimeType?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('El archivo de audio está vacío.');
    }

    // normaliza el mime type quitando parametros extra antes de validarlo
    const cleanMime = (mimeType || file.mimetype || 'audio/m4a')
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (!ALLOWED_AUDIO_MIMES.has(cleanMime)) {
      throw new UnsupportedMediaTypeException('Formato de audio no permitido.');
    }

    return this.transactionsService.ingestVoice(user.uid, file.buffer, cleanMime);
  }
}
