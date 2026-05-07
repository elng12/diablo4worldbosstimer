import { NextResponse } from 'next/server';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cronAuth';
import { apiErrorResponse, clampLimit, databaseNotConfiguredResponse } from '@/lib/apiUtils';
import {
  generateFutureWorldBossSchedule,
} from '@/lib/worldBossData';
import { isDatabaseConfigured } from '@/lib/neonDb';

async function handleGenerate(request: Request) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') ?? '20');
  const limit = clampLimit(requestedLimit, 1, 20);

  try {
    return NextResponse.json(await generateFutureWorldBossSchedule(limit));
  } catch (error) {
    console.error('World boss schedule generation failed', error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (error instanceof Error ? error.message : 'World boss schedule generation failed.');
    return apiErrorResponse('GENERATION_FAILED', message, 500);
  }
}

export async function GET(request: Request) {
  return handleGenerate(request);
}

export async function POST(request: Request) {
  return handleGenerate(request);
}
