import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types/worldBoss';

export function apiErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    } satisfies ApiErrorResponse,
    { status },
  );
}

export function databaseNotConfiguredResponse() {
  return apiErrorResponse(
    'DATABASE_NOT_CONFIGURED',
    'Database environment variables are required.',
    503,
  );
}

export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function isIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export function clampLimit(value: number, min = 1, max = 20): number {
  const safeValue = Number.isFinite(value) ? value : min;
  return Math.min(Math.max(safeValue, min), max);
}

export function getBearerToken(request: Request) {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
