import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types/worldBoss';
import { getBearerToken } from '@/lib/apiUtils';

function timingSafeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function isCronAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return false;

  const bearerToken = getBearerToken(request);
  if (bearerToken && timingSafeCompare(bearerToken, expectedSecret)) {
    return true;
  }

  const headerSecret = request.headers.get('x-cron-secret');
  if (headerSecret && timingSafeCompare(headerSecret, expectedSecret)) {
    return true;
  }

  return false;
}

export function cronUnauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Cron authorization is required.',
      },
    } satisfies ApiErrorResponse,
    { status: 401 },
  );
}
