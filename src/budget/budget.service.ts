// src/budget/budget.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

// estructura de respuesta para el presupuesto del usuario
export interface BudgetResponse {
  monthly_income: number;
  needs_percent: number;
  wants_percent: number;
  savings_percent: number;
  currency_code: string;
}

@Injectable()
export class BudgetService {
  constructor(private readonly database: DatabaseService) {}

  // busca el presupuesto del usuario o devuelve los valores iniciales por defecto
  getBudget(userId: string): BudgetResponse {
    const row = this.database.db
      .prepare(
        `SELECT monthly_income, needs_percent, wants_percent, savings_percent, currency_code
         FROM budget_config
         WHERE user_id = ?`,
      )
      .get(userId) as BudgetResponse | undefined;

    if (row) return row; // si ya guardo configuracion antes, la devuelve directo

    // valores base para cuentas nuevas
    return {
      monthly_income: 2400,
      needs_percent: 50,
      wants_percent: 30,
      savings_percent: 20,
      currency_code: 'MXN',
    };
  }

  // valida que los porcentajes sumen 100 y guarda o actualiza el presupuesto en sqlite
  updateBudget(userId: string, dto: UpdateBudgetDto): BudgetResponse {
    const totalPercent =
      dto.needs_percent + dto.wants_percent + dto.savings_percent;

    if (totalPercent !== 100) {
      throw new BadRequestException(
        `Los porcentajes deben sumar 100% (actual: ${totalPercent}%).`,
      );
    }

    const cleanIncome = Number(dto.monthly_income.toFixed(2)); // redondea a 2 decimales

    // inserta la fila nueva o actualiza la existente si el user_id ya estaba guardado
    this.database.db
      .prepare(
        `INSERT INTO budget_config (
           user_id, monthly_income, needs_percent, wants_percent, savings_percent, currency_code, updated_at
         )
         VALUES (?, ?, ?, ?, ?, 'MXN', datetime('now', 'localtime'))
         ON CONFLICT(user_id) DO UPDATE SET
           monthly_income = excluded.monthly_income,
           needs_percent = excluded.needs_percent,
           wants_percent = excluded.wants_percent,
           savings_percent = excluded.savings_percent,
           updated_at = datetime('now', 'localtime')`,
      )
      .run(
        userId,
        cleanIncome,
        dto.needs_percent,
        dto.wants_percent,
        dto.savings_percent,
      );

    return this.getBudget(userId); // devuelve el registro ya persistido
  }
}
