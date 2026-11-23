// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { BudgetModule } from './budget/budget.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { GeminiModule } from './gemini/gemini.module';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // limite global anti-abuso: maximo 60 peticiones por minuto por ip
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    GeminiModule,
    HealthModule,
    BudgetModule,
    DashboardModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [
    // protege todas las rutas con token de firebase (salvo las marcadas con @Public)
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    // aplica el rate limiter global a todos los endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
