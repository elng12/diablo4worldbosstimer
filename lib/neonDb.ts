import { Pool } from 'pg';

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    _pool.on('error', (err) => {
      console.error('Unexpected database pool error', err);
    });
  }
  return _pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function execute(text: string, params: unknown[] = []): Promise<number> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}
