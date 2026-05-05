import { NextResponse } from 'next/server';
import {
  announcementActiveResponse,
  confirmedCurrentResponse,
  currentApiFailedState,
  eventExpiredCheckingResponse,
  needsVerificationCurrentResponse,
  noActiveAnchorResponse,
  noFutureEventsResponse,
  staleCurrentResponse,
} from '@/data/worldBossMock';
import { getCurrentWorldBoss } from '@/lib/worldBossData';
import { apiErrorResponse } from '@/lib/apiUtils';
import type { CurrentEventResponse } from '@/types/worldBoss';

const variantMap: Record<string, CurrentEventResponse> = {
  'confirmed': confirmedCurrentResponse,
  'needs-verification': needsVerificationCurrentResponse,
  'no-active-anchor': noActiveAnchorResponse,
  'no-future-events': noFutureEventsResponse,
  'expired': eventExpiredCheckingResponse,
  'announcement': announcementActiveResponse,
  'stale': staleCurrentResponse,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant =
    process.env.NODE_ENV === 'production' ? null : searchParams.get('variant');

  if (variant === 'failed') {
    return NextResponse.json(currentApiFailedState, { status: 500 });
  }

  if (variant && variant in variantMap) {
    return NextResponse.json(variantMap[variant]);
  }

  try {
    return NextResponse.json(await getCurrentWorldBoss());
  } catch (error) {
    console.error('Failed to fetch current world boss', error);
    return apiErrorResponse('FETCH_FAILED', 'Unable to load the next World Boss.', 500);
  }
}
