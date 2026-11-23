// src/budget/dto/update-budget.dto.ts
import { IsInt, IsNumber, Max, Min } from 'class-validator';

// valida los datos que llegan al actualizar el presupuesto
export class UpdateBudgetDto {
  @IsNumber()
  @Min(1)
  @Max(10_000_000)
  monthly_income: number;

  @IsInt()
  @Min(0)
  @Max(100)
  needs_percent: number;

  @IsInt()
  @Min(0)
  @Max(100)
  wants_percent: number

  @IsInt()
  @Min(0)
  @Max(100)
  savings_percent: number
}
