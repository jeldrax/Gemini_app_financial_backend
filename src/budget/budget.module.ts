// src/budget/budget.module.ts
import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

// modulo de configuracion de presupuesto mensual y regla porcentual
@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
