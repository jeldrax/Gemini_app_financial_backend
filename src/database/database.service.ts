// src/database/database.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

/// Servicio global que administra la conexión única a SQLite en modo WAL
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  /// Instancia para consultas de la DB desde cualquier módulo
  public db!: Database.Database;

  constructor(private readonly configService: ConfigService) {}

  /// modulo inicial en el ciuclo de vida
  onModuleInit(): void {
    const configuredPath = //para decidir donde hacer la carpeta/archivo
      this.configService.get<string>('DB_PATH') ?? './data/gastos.db';
    const resolvedPath = path.resolve(configuredPath);

    // seguro de DB para verificar que este hecho antes de tocarlo
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

    // Timeout de 10s para esperar si hay otra escritura
    this.db = new Database(resolvedPath, { timeout: 10000 });
    // WAL
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initSchema();
    this.logger.log(`SQLite WAL listo en: ${resolvedPath}`);
  }

  /// Definicion de esquema inicial
  private initSchema(): void {
    this.db.exec(`
      -- Movimientos financieros (ingresos y egresos) aislados por usuario (user_id de Firebase)
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        fecha DATETIME DEFAULT (datetime('now', 'localtime')),
        monto REAL NOT NULL CHECK(monto > 0),
        concepto TEXT NOT NULL,
        categoria TEXT NOT NULL CHECK(categoria IN ('Necesidades', 'Gustos', 'Ahorro')),
        metodo_pago TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('Gasto', 'Ingreso')),
        source TEXT NOT NULL DEFAULT 'Manual'
      );

      -- Configuración del presupuesto mensual base y porcentajes 50/30/20 por usuario (siempre suman 100)
      CREATE TABLE IF NOT EXISTS budget_config (
        user_id TEXT PRIMARY KEY,
        monthly_income REAL NOT NULL CHECK(monthly_income > 0),
        needs_percent INTEGER NOT NULL DEFAULT 50 CHECK(needs_percent >= 0 AND needs_percent <= 100),
        wants_percent INTEGER NOT NULL DEFAULT 30 CHECK(wants_percent >= 0 AND wants_percent <= 100),
        savings_percent INTEGER NOT NULL DEFAULT 20 CHECK(savings_percent >= 0 AND savings_percent <= 100),
        currency_code TEXT NOT NULL DEFAULT 'MXN',
        updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
        CHECK(needs_percent + wants_percent + savings_percent = 100)
      );

      -- Índices para acelerar historial reciente, cálculo neto mensual y filtros por categoría/tipo
      CREATE INDEX IF NOT EXISTS idx_tx_user_fecha ON transactions(user_id, fecha DESC);
      CREATE INDEX IF NOT EXISTS idx_tx_user_cat ON transactions(user_id, categoria);
      CREATE INDEX IF NOT EXISTS idx_tx_user_tipo ON transactions(user_id, tipo);
    `);
  }

  ///modeulo que cuando se apaga la appa vuelca los datos del WAL a la base de datos
  onModuleDestroy(): void {
    if (this.db && this.db.open) {
      this.db.pragma('wal_checkpoint(TRUNCATE)');
      this.db.close();
      this.logger.log('Conexión SQLite cerrada limpiamente.');
    }
  }
}
