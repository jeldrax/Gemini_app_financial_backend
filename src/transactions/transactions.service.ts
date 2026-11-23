// src/transactions/transactions.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GeminiService } from '../gemini/gemini.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';

// formato estandar de una transaccion devuelta al frontend
export interface TransactionRow {
  id: number | null;
  fecha: string;
  monto: number;
  concepto: string;
  categoria: string;
  metodo_pago: string;
  tipo: string;
  source: string;
}

// caracteres peligrosos o de control a eliminar en entradas manuales
const DANGEROUS_CHARS = /[\x00-\x1f\x7f<>`$\[\]{}\\]/g;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly geminiService: GeminiService,
  ) {}

  // limpia simbolos peligrosos, espacios repetidos y recorta al maximo permitido
  private cleanText(value: string, maxLen: number): string {
    return value
      .replace(DANGEROUS_CHARS, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen);
  }

  // guarda el movimiento en sqlite y lo vuelve a leer con su id y fecha reales
  private insertTransaction(
    userId: string,
    data: {
      monto: number;
      concepto: string;
      categoria: 'Necesidades' | 'Gustos' | 'Ahorro';
      metodo_pago: string;
      tipo: 'Gasto' | 'Ingreso';
      source: string;
    },
  ): TransactionRow {
    const info = this.database.db
      .prepare(
        `INSERT INTO transactions (user_id, monto, concepto, categoria, metodo_pago, tipo, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        data.monto,
        data.concepto,
        data.categoria,
        data.metodo_pago,
        data.tipo,
        data.source,
      );

    return this.database.db
      .prepare(
        `SELECT id, fecha, monto, concepto, categoria, metodo_pago, tipo, source
         FROM transactions
         WHERE id = ?`,
      )
      .get(Number(info.lastInsertRowid)) as TransactionRow;
  }

  // obtiene los ultimos movimientos del usuario con limite seguro entre 1 y 200
  findRecent(userId: string, limit = 50): TransactionRow[] {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    return this.database.db
      .prepare(
        `SELECT id, fecha, monto, concepto, categoria, metodo_pago, tipo, source
         FROM transactions
         WHERE user_id = ?
         ORDER BY datetime(fecha) DESC, id DESC
         LIMIT ?`,
      )
      .all(userId, safeLimit) as TransactionRow[];
  }

  // registra un movimiento manual exacto sin usar ia
  createManual(userId: string, dto: CreateManualTransactionDto): TransactionRow {
    const concepto = this.cleanText(dto.concepto, 100);
    if (concepto.length < 2) {
      throw new BadRequestException('El concepto contiene caracteres inválidos.');
    }

    const metodo = this.cleanText(dto.metodo_pago, 50) || 'Efectivo';

    return this.insertTransaction(userId, {
      monto: Number(dto.monto.toFixed(2)),
      concepto,
      categoria: dto.categoria,
      metodo_pago: metodo,
      tipo: dto.tipo,
      source: 'Manual',
    });
  }

  // elimina un movimiento validando que pertenezca al usuario actual
  remove(userId: string, txId: number): { deleted: boolean; id: number } {
    const result = this.database.db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .run(txId, userId);

    // si changes es 0, no existia o era de otro usuario
    if (result.changes === 0) {
      throw new NotFoundException('La transacción solicitada no existe.');
    }

    return { deleted: true, id: txId };
  }

  // analiza texto libre con gemini y lo guarda solo si no cae en IGNORAR
  async ingestText(userId: string, rawText: string): Promise<TransactionRow> {
    const extracted = await this.geminiService.extractFromText(rawText);
    if (!extracted) {
      throw new UnprocessableEntityException(
        'No se detectó un movimiento válido o fue bloqueado por seguridad.',
      );
    }

    // si es pago de tarjeta o traspaso propio, responde sin guardarlo en sqlite
    if (extracted.categoria === 'IGNORAR') {
      return {
        id: null,
        fecha: new Date().toISOString(),
        monto: extracted.monto,
        concepto: extracted.concepto,
        categoria: 'IGNORAR',
        metodo_pago: extracted.metodo_pago,
        tipo: extracted.tipo,
        source: 'Texto IA',
      };
    }

    return this.insertTransaction(userId, {
      monto: extracted.monto,
      concepto: extracted.concepto,
      categoria: extracted.categoria,
      metodo_pago: extracted.metodo_pago,
      tipo: extracted.tipo,
      source: 'Texto IA',
    });
  }

  // analiza nota de voz en memoria con gemini y la guarda solo si no cae en IGNORAR
  async ingestVoice(
    userId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<TransactionRow> {
    const extracted = await this.geminiService.extractFromMedia(buffer, mimeType);
    if (!extracted) {
      throw new UnprocessableEntityException(
        'No se pudo extraer un movimiento válido del audio.',
      );
    }

    // si es movimiento interno omitido, responde con id null sin tocar la bd
    if (extracted.categoria === 'IGNORAR') {
      return {
        id: null,
        fecha: new Date().toISOString(),
        monto: extracted.monto,
        concepto: extracted.concepto,
        categoria: 'IGNORAR',
        metodo_pago: extracted.metodo_pago,
        tipo: extracted.tipo,
        source: 'Voz IA',
      };
    }

    return this.insertTransaction(userId, {
      monto: extracted.monto,
      concepto: extracted.concepto,
      categoria: extracted.categoria,
      metodo_pago: extracted.metodo_pago,
      tipo: extracted.tipo,
      source: 'Voz IA',
    });
  }
}
