// src/transactions/dto/create-manual-transaction.dto.ts
import {
  IsIn,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_AMOUNT_ALLOWED } from '../../gemini/use-cases/extract-transaction.use-case';

// valida el formulario manual de ingreso o gasto (POST /api/transactions/manual)
export class CreateManualTransactionDto {
  @IsNumber()
  @Min(0.01)
  @Max(MAX_AMOUNT_ALLOWED)
  monto: number; // cantidad positiva dentro del limite permitido

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  concepto: string; // descripcion corta del movimiento

  @IsIn(['Necesidades', 'Gustos', 'Ahorro'])
  categoria: 'Necesidades' | 'Gustos' | 'Ahorro'; // solo acepta las 3 categorias validas

  @IsIn(['Gasto', 'Ingreso'])
  tipo: 'Gasto' | 'Ingreso'; // define si suma o resta al gasto neto

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  metodo_pago: string; // medio de pago usado
}
