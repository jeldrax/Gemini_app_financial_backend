// src/budget/budget.controller.ts
import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/current-user.decorator';
import { BudgetService } from './budget.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

// rutas protegidas para consultar y guardar el presupuesto en /api/budget
@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get() // obtiene el presupuesto actual del usuario logueado
  getBudget(@CurrentUser() user: AuthenticatedUser) {
    return this.budgetService.getBudget(user.uid);
  }

  @Put() // actualiza el monto mensual y los porcentajes del usuario
  updateBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(user.uid, dto);
  }
}
