import { NextResponse } from 'next/server';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cronAuth';
import { apiErrorResponse, clampLimit, databaseNotConfiguredResponse } from '@/lib/apiUtils';
import {
  generateFutureWorldBossSchedule,
  isWorldBossDatabaseConfigured,
} from '@/lib/worldBossData';

async function handleGenerate(request: Request) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') ?? '20');
  const limit = clampLimit(requestedLimit, 1, 20);

  try {
    return NextResponse.json(await generateFutureWorldBossSchedule(limit));
  } catch (error) {
    console.error('World boss schedule generation failed', error);
    const message =
      error instanceof Error ? error.message : 'World boss schedule generation failed.';
    return apiErrorResponse('GENERATION_FAILED', message, 500);
  }
}

export async function GET(request: Request) {
  return handleGenerate(request);
}

export async function POST(request: Request) {
  return handleGenerate(request);
}
