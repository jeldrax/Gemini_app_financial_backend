import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { BasicPromptDto } from '../dtos/basic-prompt.dto';
import { basicPromptUseCase } from './use-cases/basic-prompt.use-case';
import {
  ExtractedTransaction,
  extractTransactionFromMediaUseCase,
  extractTransactionFromTextUseCase,
} from './use-cases/extract-transaction.use-case';

// puente de controllers/módulos hacia los casos de uso gemini
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI | null; // Cliente oficial de Gemini  | null si no hay
  private readonly preferredModel?: string; // Modelo principal configurado en .env

  // Inyecta ConfigService para leer variables del .env de forma segura
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();
    this.preferredModel = this.configService.get<string>('GEMINI_MODEL')?.trim();

    // si no hay app lo registra y no rompe el proceso
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY no está configurada en el .env.');
      this.ai = null;
      return;
    }

    this.ai = new GoogleGenAI({ apiKey }); //crea la instancia lista para hacer peticiones
  }

  // aqui se ejecuta el prompt
  async basicPrompt(basicPromptDto: BasicPromptDto) {
    if (!this.ai) throw new Error('GEMINI_API_KEY no configurada.');
    return basicPromptUseCase(this.ai, basicPromptDto);
  }

  // Extrae un movimiento desde texto del usuario
  async extractFromText(rawText: string): Promise<ExtractedTransaction | null> {
    if (!this.ai) return null;
    return extractTransactionFromTextUseCase(
      this.ai,
      rawText,
      this.preferredModel,
    );
  }

  // Extrae un movimiento desde una nota de voz en Buffer
  async extractFromMedia(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedTransaction | null> {
    if (!this.ai) return null;
    return extractTransactionFromMediaUseCase(
      this.ai,
      buffer,
      mimeType,
      this.preferredModel,
    );
  }
}