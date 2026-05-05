import { NextResponse } from 'next/server';
import { isDatabaseConfigured, query } from '@/lib/neonDb';

export async function GET() {
  const dbConfigured = isDatabaseConfigured();

  if (!dbConfigured) {
    return NextResponse.json(
      { status: 'ok', database: 'not_configured' },
      { status: 200 },
    );
  }

  try {
    await query('SELECT 1');
    return NextResponse.json(
      { status: 'ok', database: 'connected' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 503 },
    );
  }
}
