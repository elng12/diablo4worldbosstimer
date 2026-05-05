import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse } from '@/lib/apiUtils';
import { getAdminWorldBossEvents, isWorldBossDatabaseConfigured } from '@/lib/worldBossData';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 20;

  try {
    const events = await getAdminWorldBossEvents(limit);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    console.error('Failed to fetch admin events', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch events.';
    return apiErrorResponse('FETCH_FAILED', message, 500);
  }
}
