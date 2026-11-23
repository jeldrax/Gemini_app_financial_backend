// src/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/current-user.decorator';
import { DatabaseService } from '../database/database.service';

// fila devuelta por la consulta agrupada de sqlite
interface NetSpendRow {
  categoria: 'Necesidades' | 'Gustos' | 'Ahorro';
  total: number | null;
}

// controlador de metricas del dashboard bajo /api/dashboard/*
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly database: DatabaseService) {}

  @Get('net-spend') // calcula el gasto neto del mes actual por cada categoria
  getMonthlyNetSpend(@CurrentUser() user: AuthenticatedUser) {
    // suma los gastos y resta los ingresos solo del mes en curso y de este usuario
    const rows = this.database.db
      .prepare(
        `SELECT categoria,
                SUM(CASE WHEN tipo = 'Gasto' THEN monto ELSE -monto END) AS total
         FROM transactions
         WHERE user_id = ?
           AND strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now', 'localtime')
         GROUP BY categoria`,
      )
      .all(user.uid) as NetSpendRow[];

    // inicia las 3 categorias en 0 por si alguna no tiene movimientos este mes
    const result = { Necesidades: 0, Gustos: 0, Ahorro: 0 };

    for (const row of rows) {
      if (row.categoria in result && row.total !== null) {
        result[row.categoria] = Number(row.total.toFixed(2));
      }
    }

    return result;
  }
}
