import { NextResponse } from 'next/server';
import {
  emptyScheduleResponse,
  scheduleApiFailedState,
} from '@/data/worldBossMock';
import { apiErrorResponse, clampLimit } from '@/lib/apiUtils';
import { getWorldBossSchedule } from '@/lib/worldBossData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant =
    process.env.NODE_ENV === 'production' ? null : searchParams.get('variant');
  const limit = Number(searchParams.get('limit') || '8');
  const safeLimit = clampLimit(limit);

  if (variant === 'failed') {
    return NextResponse.json(scheduleApiFailedState, { status: 500 });
  }

  if (variant === 'empty') {
    return NextResponse.json({
      ...emptyScheduleResponse,
      limit: safeLimit,
    });
  }

  try {
    return NextResponse.json(await getWorldBossSchedule(safeLimit));
  } catch (error) {
    console.error('Failed to fetch world boss schedule', error);
    return apiErrorResponse('SCHEDULE_FETCH_FAILED', 'Upcoming schedule could not load.', 500);
  }
}
