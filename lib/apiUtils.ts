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

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }
  return JSON.parse(text) as T;
}

const ISO_8601_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z$/;

export function isIsoDate(value: string): boolean {
  const match = ISO_8601_REGEX.exec(value);
  if (!match) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  // Verify the parsed components match to reject rolled-over dates like Feb 30
  const [, year, month, day, hour, minute, second] = match;
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second)
  );
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
