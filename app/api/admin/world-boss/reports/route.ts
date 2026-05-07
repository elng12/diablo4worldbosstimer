import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse } from '@/lib/apiUtils';
import { getAdminWorldBossReports } from '@/lib/worldBossData';
import { isDatabaseConfigured } from '@/lib/neonDb';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    const reports = await getAdminWorldBossReports();
    return NextResponse.json({ ok: true, reports });
  } catch (error) {
    console.error('Failed to fetch admin reports', error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (error instanceof Error ? error.message : 'Failed to fetch reports.');
    return apiErrorResponse('FETCH_FAILED', message, 500);
  }
}
