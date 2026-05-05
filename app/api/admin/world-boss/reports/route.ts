import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse } from '@/lib/apiUtils';
import { getAdminWorldBossReports, isWorldBossDatabaseConfigured } from '@/lib/worldBossData';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    const reports = await getAdminWorldBossReports();
    return NextResponse.json({ ok: true, reports });
  } catch (error) {
    console.error('Failed to fetch admin reports', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch reports.';
    return apiErrorResponse('FETCH_FAILED', message, 500);
  }
}
