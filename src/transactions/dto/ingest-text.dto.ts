// src/transactions/dto/ingest-text.dto.ts
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_TEXT_LENGTH } from '../../gemini/use-cases/extract-transaction.use-case';

// valida el texto libre antes de mandarlo a gemini (POST /api/transactions/ingest-text)
export class IngestTextDto {
  @IsString()
  @MinLength(2)
  @MaxLength(MAX_TEXT_LENGTH)
  texto: string; // descripcion natural del gasto o ingreso
}
