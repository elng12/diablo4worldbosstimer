'use client';

import {
  AlertTriangle,
  Bell,
  Check,
  ChevronDown,
  Loader2,
  Map,
  Megaphone,
  Menu,
  RefreshCw,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { disclaimer, faqItems, rewards, seoSections } from '@/content/worldBossContent';
import { trackAnalyticsEvent } from '@/lib/analytics';
import type {
  ApiErrorResponse,
  CurrentEventResponse,
  WorldBossScheduleResponse,
  WorldBossEventDto,
  WorldBossReportPayload,
} from '@/types/worldBoss';
import { REPORT_TYPES } from '@/types/worldBoss';
import {
  confidenceClass,
  formatCountdown,
  formatLocalDateTime,
  formatTimeOnly,
  getSecondsUntil,
  getTimezoneState,
  isResponseStale,
  waypointLabel,
} from '@/lib/worldBossFormat';
import type { AnalyticsEventName } from '@/lib/analytics';

type Props = {
  initialCurrent: CurrentEventResponse;
};

type FetchState = 'idle' | 'loading' | 'error';
type MapState = 'closed' | 'loading' | 'open' | 'error';
type ReminderState = 'idle' | 'checking' | 'unsupported' | 'denied' | 'saved';
type ReportStatus = 'idle' | 'submitting' | 'submitted' | 'error';

const showDevControls = process.env.NODE_ENV !== 'production';
const reminderAnalyticsEvents: Record<number, AnalyticsEventName> = {
  5: 'select_reminder_5min',
  15: 'select_reminder_15min',
  30: 'select_reminder_30min',
  60: 'select_reminder_60min',
};

export function WorldBossTimerPage({ initialCurrent }: Props) {
  const [current, setCurrent] = useState(initialCurrent);
  const [scheduleEvents, setScheduleEvents] = useState(initialCurrent.upcoming.slice(0, 8));
  const [currentStatus, setCurrentStatus] = useState<FetchState>('idle');
  const [scheduleStatus, setScheduleStatus] = useState<FetchState>('idle');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapState, setMapState] = useState<MapState>('closed');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState(15);
  const [reminderState, setReminderState] = useState<ReminderState>('idle');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] =
    useState<WorldBossReportPayload['report_type']>('Wrong time');
  const [reportNote, setReportNote] = useState('');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle');
  const [reportError, setReportError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    current.event ? getSecondsUntil(current.event.spawn_time_utc) : 0,
  );
  const [checkingNext, setCheckingNext] = useState(false);
  const [, setStaleTick] = useState(0);

  const event = current.event;
  const [timezoneOverride, setTimezoneOverride] = useState<{
    label: string;
    failed: boolean;
  } | null>(null);
  const timezoneState = timezoneOverride ?? getTimezoneState();
  const timezoneLabel = timezoneState.label;
  const stale = isResponseStale(current.generated_at, current.stale_after_seconds);

  useEffect(() => {
    if (!event) return undefined;

    const updateCountdown = () => {
      const nextSeconds = getSecondsUntil(event.spawn_time_utc);
      setSecondsLeft(nextSeconds);
      setCheckingNext(nextSeconds === 0);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateCountdown();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [event]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStaleTick((value) => value + 1);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const pollTimer = window.setInterval(() => {
      void refetchCurrent();
    }, 60000);
    return () => window.clearInterval(pollTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!checkingNext) return;
    const timer = window.setTimeout(() => {
      void refetchCurrent();
      setCheckingNext(false);
    }, 1200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingNext]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (eventArg: KeyboardEvent) => {
      if (eventArg.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    trackAnalyticsEvent('view_timer_page');
    try {
      const returnVisitKey = 'worldBossTimerVisited';
      if (window.localStorage.getItem(returnVisitKey)) {
        trackAnalyticsEvent('return_visit_timer_page');
      }
      window.localStorage.setItem(returnVisitKey, '1');
    } catch {
      // Storage can be blocked; analytics should never affect the timer.
    }
  }, []);

  const accuracyCopy = useMemo(() => {
    if (!event) return 'Schedule anchor needs verification.';
    if (event.confidence_status === 'Confirmed') {
      return event.is_overridden
        ? 'Manual override applied after review.'
        : 'This spawn time has been reviewed.';
    }
    if (event.confidence_status === 'Needs verification') {
      return 'This spawn needs timing or location review before you rely on it.';
    }
    return 'Predicted by rotation logic.';
  }, [event]);

  async function refetchCurrent(variant?: string) {
    setCurrentStatus('loading');
    try {
      const suffix = variant ? `?variant=${variant}` : '';
      const response = await fetch(`/api/world-boss/current${suffix}`);
      const body = (await response.json()) as CurrentEventResponse | ApiErrorResponse;
      if (!response.ok || 'ok' in body) {
        throw new Error('error' in body ? body.error.message : 'Unable to load.');
      }
      setCurrent(body);
      setScheduleEvents(body.upcoming.slice(0, 8));
      setSecondsLeft(
        body.event ? getSecondsUntil(body.event.spawn_time_utc) : 0,
      );
      setCurrentStatus('idle');
    } catch {
      setCurrentStatus('error');
    }
  }

  async function retrySchedule() {
    setScheduleStatus('loading');
    try {
      const response = await fetch('/api/world-boss/schedule?limit=8');
      const body = (await response.json()) as WorldBossScheduleResponse | ApiErrorResponse;
      if (!response.ok || 'ok' in body) {
        throw new Error('error' in body ? body.error.message : 'Unable to load schedule.');
      }
      setScheduleEvents(body.events.slice(0, 8));
      setScheduleStatus('idle');
    } catch {
      setScheduleStatus('error');
    }
  }

  function revealLocationSection() {
    window.requestAnimationFrame(() => {
      const locationSection = document.getElementById('locations');
      if (!locationSection) return;

      const top = Math.max(
        0,
        locationSection.getBoundingClientRect().top + window.scrollY - 72,
      );
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  function requestMap() {
    trackAnalyticsEvent('click_view_map', {
      boss: event?.boss_name,
      location: event?.location_name,
    });
    setMapState('loading');
    revealLocationSection();
    window.setTimeout(() => setMapState('open'), 650);
  }

  function saveReminder(lead: number) {
    const reminderAnalyticsEvent = reminderAnalyticsEvents[lead];
    if (reminderAnalyticsEvent) {
      trackAnalyticsEvent(reminderAnalyticsEvent, {
        boss: event?.boss_name,
        lead_minutes: lead,
      });
    }
    setReminderLead(lead);
    setReminderState('checking');

    window.setTimeout(async () => {
      if (!('Notification' in window)) {
        setReminderState('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setReminderState('denied');
        return;
      }

      const permission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();

      if (permission !== 'granted') {
        setReminderState('denied');
        return;
      }

      try {
        window.localStorage.setItem('worldBossReminderLead', String(lead));
      } catch {
        // localStorage unavailable — non-critical
      }

      if (!event) {
        setReminderState('saved');
        return;
      }

      const spawnTime = new Date(event.spawn_time_utc).getTime();
      const notifyAt = spawnTime - lead * 60 * 1000;
      const delay = notifyAt - Date.now();

      if (delay > 0) {
        window.setTimeout(() => {
          new Notification(`${event.boss_name} spawns in ${lead} min`, {
            body: `Location: ${event.location_name || 'Unknown'} — ${event.region || 'Unknown region'}`,
            icon: '/favicon.svg',
            tag: 'world-boss-reminder',
          });
        }, delay);
      }

      setReminderState('saved');
    }, 450);
  }

  async function submitReport(eventArg: React.FormEvent<HTMLFormElement>) {
    eventArg.preventDefault();
    setReportStatus('submitting');
    setReportError('');

    if (reportNote.length > 500) {
      setReportStatus('error');
      setReportError('Report note must be 500 characters or fewer.');
      return;
    }

    const payload: WorldBossReportPayload = {
      event_id: event?.event_id ?? null,
      report_type: reportType,
      user_note: reportNote || undefined,
      user_timezone: timezoneLabel,
      displayed_time: event ? formatLocalDateTime(event.spawn_time_utc) : undefined,
      page_state: {
        confidence_status: event?.confidence_status,
        boss_slug: event?.boss_slug,
      },
    };

    try {
      const response = await fetch('/api/world-boss/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || 'Report failed.');
      }
      trackAnalyticsEvent('submit_error_report', {
        boss: event?.boss_name,
        report_type: reportType,
      });
      setReportStatus('submitted');
    } catch (error) {
      setReportStatus('error');
      setReportError(error instanceof Error ? error.message : 'Report failed.');
    }
  }

  return (
    <main className="wb-page">
      <Header
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((value) => !value)}
        onReminder={() => {
          trackAnalyticsEvent('click_remind_me', { source: 'header' });
          setReminderOpen(true);
        }}
      />
      {menuOpen ? (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          onReminder={() => {
            trackAnalyticsEvent('click_remind_me', { source: 'mobile_menu' });
            setMenuOpen(false);
            setReminderOpen(true);
          }}
        />
      ) : null}

      {current.announcement.enabled ? (
        <div className="wb-announcement" role="status">
          <Megaphone size={16} />
          <span>{current.announcement.message}</span>
        </div>
      ) : null}

      <section className="wb-title-block" aria-labelledby="page-title">
        <h1 id="page-title">Diablo 4 World Boss Timer</h1>
        <p>
          Schedule the next spawn with Diablo 4 World Boss Timer and compare it
          with Diablo 4 World Boss Tracker for local time, location, alerts, and
          accuracy status.
        </p>
      </section>

      <section className="wb-hero-grid" aria-label="Next World Boss dashboard">
        <TimerCard
          event={event}
          currentStatus={currentStatus}
          secondsLeft={secondsLeft}
          checkingNext={checkingNext}
          stale={stale}
          timezoneLabel={timezoneLabel}
          timezoneFailed={timezoneState.failed}
          accuracyCopy={accuracyCopy}
          onReminder={() => {
            trackAnalyticsEvent('click_remind_me', { source: 'timer_card' });
            setReminderOpen(true);
          }}
          onMap={requestMap}
          onReport={() => {
            trackAnalyticsEvent('click_report_wrong_time', { source: 'timer_card' });
            setReportOpen(true);
          }}
          onRetry={() => void refetchCurrent()}
        />
        <SchedulePanel
          events={scheduleEvents}
          scheduleStatus={scheduleStatus}
          onRetry={() => void retrySchedule()}
          onReminder={() => {
            trackAnalyticsEvent('click_remind_me', { source: 'schedule' });
            setReminderOpen(true);
          }}
        />
      </section>

      <section className="wb-info-grid" aria-label="Location and accuracy">
        <LocationCard event={event} mapState={mapState} onMap={requestMap} />
        <AccuracyPanel
          event={event}
          stale={stale}
          timezoneLabel={timezoneLabel}
          timezoneFailed={timezoneState.failed}
          accuracyCopy={accuracyCopy}
          onReport={() => {
            trackAnalyticsEvent('click_report_wrong_time', { source: 'accuracy_panel' });
            setReportOpen(true);
          }}
        />
      </section>

      {reminderOpen ? (
        <ReminderPanel
          event={event}
          reminderLead={reminderLead}
          reminderState={reminderState}
          onLeadSelect={saveReminder}
          onClose={() => setReminderOpen(false)}
        />
      ) : null}

      <RewardsCards />
      <SeoContent />
      <FAQSection
        expandedFaq={expandedFaq}
        onToggle={(value) => {
          if (value !== null) {
            trackAnalyticsEvent('faq_expand', {
              question: faqItems[value]?.question,
            });
          }
          setExpandedFaq(value);
        }}
      />
      <footer className="wb-disclaimer">
        <p>{disclaimer}</p>
      </footer>

      {reportOpen ? (
        <ReportDialog
          event={event}
          reportType={reportType}
          reportNote={reportNote}
          reportStatus={reportStatus}
          reportError={reportError}
          onTypeChange={setReportType}
          onNoteChange={setReportNote}
          onSubmit={submitReport}
          onClose={() => {
            setReportOpen(false);
            setReportStatus('idle');
            setReportError('');
          }}
          onSubmitAnother={() => {
            setReportStatus('idle');
            setReportNote('');
          }}
        />
      ) : null}

      {showDevControls ? (
        <div className="wb-dev-panel" aria-label="Mock state controls">
          <button type="button" onClick={() => setCurrentStatus('loading')}>
            Current loading
          </button>
          <button type="button" onClick={() => void refetchCurrent('confirmed')}>
            Confirmed
          </button>
          <button type="button" onClick={() => void refetchCurrent('needs-verification')}>
            Needs verification
          </button>
          <button type="button" onClick={() => void refetchCurrent('no-active-anchor')}>
            No anchor
          </button>
          <button type="button" onClick={() => void refetchCurrent('no-future-events')}>
            No future
          </button>
          <button type="button" onClick={() => void refetchCurrent('expired')}>
            Expired
          </button>
          <button type="button" onClick={() => void refetchCurrent('announcement')}>
            Announcement
          </button>
          <button type="button" onClick={() => void refetchCurrent('stale')}>
            Stale
          </button>
          <button type="button" onClick={() => void refetchCurrent('failed')}>
            API failed
          </button>
          <button type="button" onClick={() => setScheduleStatus('loading')}>
            Schedule loading
          </button>
          <button type="button" onClick={() => setScheduleStatus('error')}>
            Schedule failed
          </button>
          <button
            type="button"
            onClick={() => {
              setMapState('error');
              revealLocationSection();
            }}
          >
            Map failed
          </button>
          <button
            type="button"
            onClick={() => {
              setReminderOpen(true);
              setReminderState('unsupported');
            }}
          >
            Reminder unsupported
          </button>
          <button
            type="button"
            onClick={() => {
              setReminderOpen(true);
              setReminderState('denied');
            }}
          >
            Reminder denied
          </button>
          <button
            type="button"
            onClick={() => {
              setReminderOpen(true);
              setReminderState('saved');
            }}
          >
            Reminder saved
          </button>
          <button
            type="button"
            onClick={() => setTimezoneOverride({ label: 'UTC', failed: true })}
          >
            Timezone failed
          </button>
          <button
            type="button"
            onClick={() => {
              setReportOpen(true);
              setReportStatus('submitted');
            }}
          >
            Report submitted
          </button>
          <button
            type="button"
            onClick={() => {
              setReportOpen(true);
              setReportStatus('error');
              setReportError('Mock report submission failed.');
            }}
          >
            Report error
          </button>
        </div>
      ) : null}
    </main>
  );
}

function Header({
  menuOpen,
  onMenuToggle,
  onReminder,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onReminder: () => void;
}) {
  return (
    <header className="wb-header">
      <a className="wb-brand" href="#page-title">
        D4 World Boss Timer
      </a>
      <nav className="wb-desktop-nav" aria-label="Primary navigation">
        <a href="#schedule">Schedule</a>
        <a href="#locations">Locations</a>
        <a href="#rewards">Rewards</a>
        <a href="#faq">FAQ</a>
      </nav>
      <button className="wb-header-cta" type="button" onClick={onReminder}>
        <Bell size={15} />
        Set Alert
      </button>
      <button
        className="wb-menu-button"
        type="button"
        onClick={onMenuToggle}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
        Menu
      </button>
    </header>
  );
}

function MobileMenu({
  onClose,
  onReminder,
}: {
  onClose: () => void;
  onReminder: () => void;
}) {
  return (
    <div className="wb-mobile-menu" id="mobile-menu" role="dialog" aria-modal="true">
      <div className="wb-mobile-menu__top">
        <span>D4 World Boss Timer</span>
        <button type="button" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      {[
        ['Schedule', '#schedule'],
        ['Locations', '#locations'],
        ['Rewards', '#rewards'],
        ['FAQ', '#faq'],
      ].map(([label, href]) => (
        <a key={href} href={href} onClick={onClose}>
          {label}
        </a>
      ))}
      <button type="button" onClick={onReminder}>
        Set Alert
      </button>
    </div>
  );
}

function TimerCard({
  event,
  currentStatus,
  secondsLeft,
  checkingNext,
  stale,
  timezoneLabel,
  timezoneFailed,
  accuracyCopy,
  onReminder,
  onMap,
  onReport,
  onRetry,
}: {
  event: WorldBossEventDto | null;
  currentStatus: FetchState;
  secondsLeft: number;
  checkingNext: boolean;
  stale: boolean;
  timezoneLabel: string;
  timezoneFailed: boolean;
  accuracyCopy: string;
  onReminder: () => void;
  onMap: () => void;
  onReport: () => void;
  onRetry: () => void;
}) {
  if (currentStatus === 'loading') {
    return (
      <article className="wb-card wb-timer-card" aria-busy="true">
        <Skeleton label="Loading next spawn..." />
      </article>
    );
  }

  if (currentStatus === 'error') {
    return (
      <article className="wb-card wb-timer-card wb-error-card">
        <ShieldAlert size={20} />
        <h2>Unable to load the next Diablo 4 world boss.</h2>
        <p>Diablo 4 World Boss Timer needs a retry before the next event can be shown.</p>
        <button className="wb-primary-button" type="button" onClick={onRetry}>
          <RefreshCw size={15} />
          Retry
        </button>
      </article>
    );
  }

  if (!event) {
    return (
      <article className="wb-card wb-timer-card">
        <p className="wb-eyebrow">Next Diablo 4 World Boss</p>
        <h2>Schedule anchor needs verification.</h2>
        <p className="wb-muted">
          Diablo 4 World Boss Timer countdown is hidden until a confirmed UTC anchor is available.
        </p>
        <button className="wb-secondary-button" type="button" onClick={onReport}>
          Report Wrong Time
        </button>
      </article>
    );
  }

  return (
    <article className="wb-card wb-timer-card">
      <div className="wb-card-row">
        <p className="wb-eyebrow">Next Diablo 4 World Boss</p>
        <ConfidenceBadge status={event.confidence_status} />
      </div>
      <h2>{event.boss_name}</h2>
      {checkingNext ? (
        <p className="wb-countdown wb-countdown--checking" aria-live="polite">
          Checking next Diablo 4 world boss spawn...
        </p>
      ) : (
        <p className="wb-countdown" aria-live="polite" suppressHydrationWarning>
          {formatCountdown(secondsLeft)}
        </p>
      )}
      <div className="wb-timer-meta">
        <div>
          <strong suppressHydrationWarning>
            Spawns {formatLocalDateTime(event.spawn_time_utc)}
          </strong>
          <span suppressHydrationWarning>Your local time: {timezoneLabel}</span>
          {timezoneFailed ? (
            <span className="wb-timezone-fallback">Timezone detection failed. UTC fallback.</span>
          ) : null}
        </div>
        <div>
          <strong>{event.location_name || 'Location needs verification'}</strong>
          <span>{event.region || 'Region needs verification'}</span>
        </div>
      </div>
      <p className="wb-waypoint">{waypointLabel(event)}</p>
      <p className="wb-muted" suppressHydrationWarning>
        Updated {formatLocalDateTime(event.last_updated_at)}
      </p>
      {stale ? (
        <p className="wb-warning">
          <AlertTriangle size={15} />
          Stale data. Retry before relying on this event.
        </p>
      ) : null}
      <p className="wb-accuracy-inline">{accuracyCopy}</p>
      <div className="wb-action-row">
        <button className="wb-primary-button" type="button" onClick={onReminder}>
          <Bell size={16} />
          Set Alert
        </button>
        <button className="wb-secondary-button" type="button" onClick={onMap}>
          <Map size={16} />
          View Map
        </button>
      </div>
      <button className="wb-text-button" type="button" onClick={onReport}>
        Report Wrong Time
      </button>
    </article>
  );
}

function SchedulePanel({
  events,
  scheduleStatus,
  onRetry,
  onReminder,
}: {
  events: WorldBossEventDto[];
  scheduleStatus: FetchState;
  onRetry: () => void;
  onReminder: () => void;
}) {
  return (
    <aside className="wb-card wb-schedule-card" id="schedule">
      <div className="wb-card-row">
        <h2>Upcoming Diablo 4 World Boss Schedule</h2>
        <span>{events.length} events</span>
      </div>
      {scheduleStatus === 'loading' ? <Skeleton label="Loading schedule..." /> : null}
      {scheduleStatus === 'error' ? (
        <div className="wb-error-inline">
          <p>Upcoming schedule could not load.</p>
          <button type="button" onClick={onRetry}>
            Retry schedule
          </button>
        </div>
      ) : null}
      {scheduleStatus === 'idle' && events.length === 0 ? (
        <p className="wb-muted">No upcoming Diablo 4 world boss events are available yet.</p>
      ) : null}
      {scheduleStatus === 'idle' && events.length > 0 ? (
        <div className="wb-schedule-list">
          {events.map((item) => (
            <div className="wb-schedule-row" key={item.event_id}>
              <div>
                <strong suppressHydrationWarning>{formatTimeOnly(item.spawn_time_utc)}</strong>
                <span>{item.boss_name}</span>
              </div>
              <div>
                <span>{item.location_name || 'Unknown location'}</span>
                <small>{item.region || 'Region unknown'}</small>
              </div>
              <ConfidenceBadge status={item.confidence_status} short />
              <button
                className="wb-icon-button"
                type="button"
                onClick={onReminder}
                aria-label={`Set alert for ${item.boss_name}`}
                title="Set alert"
              >
                <Bell size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function LocationCard({
  event,
  mapState,
  onMap,
}: {
  event: WorldBossEventDto | null;
  mapState: MapState;
  onMap: () => void;
}) {
  return (
    <section className="wb-card" id="locations">
      <h2>Diablo 4 World Boss Locations</h2>
      <h3>Current Diablo 4 World Boss Location</h3>
      {event ? (
        <>
          <p className="wb-location-name">{event.location_name || 'Location unknown'}</p>
          <p className="wb-muted">{event.region || 'Region unknown'}</p>
          <p>{waypointLabel(event)}</p>
          <p className="wb-muted">{event.route_note || 'Route note needs verification.'}</p>
        </>
      ) : (
        <p className="wb-muted">Location is unavailable until the schedule anchor is verified.</p>
      )}
      {mapState === 'closed' ? (
        <button className="wb-secondary-button" type="button" onClick={onMap}>
          <Map size={16} />
          View Map
        </button>
      ) : null}
      {mapState === 'loading' ? (
        <div className="wb-map-placeholder" aria-live="polite">
          <Loader2 size={18} />
          Loading map...
        </div>
      ) : null}
      {mapState === 'open' ? (
        <div className="wb-map-panel" role="img" aria-label="Text-first map placeholder">
          <span>The map loads only after user intent.</span>
        </div>
      ) : null}
      {mapState === 'error' ? (
        <div className="wb-error-inline">
          <p>Map could not load. Use the text route above.</p>
        </div>
      ) : null}
    </section>
  );
}

function AccuracyPanel({
  event,
  stale,
  timezoneLabel,
  timezoneFailed,
  accuracyCopy,
  onReport,
}: {
  event: WorldBossEventDto | null;
  stale: boolean;
  timezoneLabel: string;
  timezoneFailed: boolean;
  accuracyCopy: string;
  onReport: () => void;
}) {
  return (
    <section className="wb-card">
      <h2>Diablo 4 Boss Timer Accuracy</h2>
      {event ? <ConfidenceBadge status={event.confidence_status} /> : null}
      <p>{accuracyCopy}</p>
      <p className="wb-muted" suppressHydrationWarning>
        Updated: {event ? formatLocalDateTime(event.last_updated_at) : 'Unavailable'}
      </p>
      <p className="wb-muted" suppressHydrationWarning>
        Timezone: {timezoneLabel}
      </p>
      {timezoneFailed ? (
        <p className="wb-warning">Timezone detection failed. Times are shown with a UTC fallback.</p>
      ) : null}
      <p className="wb-muted">
        Source: {event?.source_type || 'none'} | Algorithm:{' '}
        {event?.algorithm_version || 'none'} | Season: {event?.season_version || 'none'}
      </p>
      {stale ? <p className="wb-warning">Stale data indicator is active.</p> : null}
      <button className="wb-text-button" type="button" onClick={onReport}>
        Report Wrong Time
      </button>
    </section>
  );
}

function ReminderPanel({
  event,
  reminderLead,
  reminderState,
  onLeadSelect,
  onClose,
}: {
  event: WorldBossEventDto | null;
  reminderLead: number;
  reminderState: ReminderState;
  onLeadSelect: (lead: number) => void;
  onClose: () => void;
}) {
  return (
    <section className="wb-card wb-reminder-panel" aria-label="Reminder panel">
      <div className="wb-card-row">
        <h2>Set a World Boss Alert</h2>
        <button type="button" onClick={onClose} aria-label="Close reminder panel">
          <X size={18} />
        </button>
      </div>
      <p className="wb-muted">
        Choose an alert time before {event?.boss_name || 'the next boss'} spawns.
      </p>
      <div className="wb-reminder-options">
        {[5, 15, 30, 60].map((lead) => (
          <button
            className={lead === reminderLead ? 'is-selected' : ''}
            key={lead}
            type="button"
            onClick={() => onLeadSelect(lead)}
          >
            {lead} min
          </button>
        ))}
      </div>
      <ReminderStateMessage state={reminderState} />
    </section>
  );
}

function ReminderStateMessage({ state }: { state: ReminderState }) {
  if (state === 'checking') {
    return (
      <p className="wb-muted" aria-live="polite">
        <Loader2 size={15} /> Checking notification support...
      </p>
    );
  }
  if (state === 'unsupported') {
    return <p className="wb-warning">Browser notifications are unavailable. Local alert intent was kept.</p>;
  }
  if (state === 'denied') {
    return <p className="wb-warning">Notifications are blocked in this browser. Use a device alarm.</p>;
  }
  if (state === 'saved') {
    return <p className="wb-success"><Check size={15} /> Alert saved locally for this browser session.</p>;
  }
  return <p className="wb-muted">Notification permission is requested only after you choose an alert.</p>;
}

function RewardsCards() {
  return (
    <section className="wb-rewards" id="rewards">
      <h2>Diablo 4 World Boss Loot and Rewards</h2>
      <div className="wb-reward-grid">
        {rewards.map((reward) => (
          <article className="wb-card" key={reward.boss}>
            <h3>{reward.boss} Rewards</h3>
            <p>{reward.note}</p>
            <p className="wb-gold">{reward.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SeoContent() {
  return (
    <section className="wb-seo-content">
      {seoSections.map((section) => (
        <article className="wb-card" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
      ))}
    </section>
  );
}

function FAQSection({
  expandedFaq,
  onToggle,
}: {
  expandedFaq: number | null;
  onToggle: (value: number | null) => void;
}) {
  return (
    <section className="wb-card wb-faq" id="faq">
      <h2>Diablo 4 World Boss FAQ</h2>
      {faqItems.map((item, index) => {
        const open = expandedFaq === index;
        return (
          <article key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onToggle(open ? null : index)}
              >
                {item.question}
                <ChevronDown size={16} />
              </button>
            </h3>
            <p hidden={!open}>{item.answer}</p>
          </article>
        );
      })}
    </section>
  );
}

function ReportDialog({
  event,
  reportType,
  reportNote,
  reportStatus,
  reportError,
  onTypeChange,
  onNoteChange,
  onSubmit,
  onClose,
  onSubmitAnother,
}: {
  event: WorldBossEventDto | null;
  reportType: WorldBossReportPayload['report_type'];
  reportNote: string;
  reportStatus: ReportStatus;
  reportError: string;
  onTypeChange: (value: WorldBossReportPayload['report_type']) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onSubmitAnother: () => void;
}) {
  return (
    <div className="wb-dialog-backdrop" role="presentation">
      <section className="wb-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="wb-card-row">
          <h2 id="report-title">Report Wrong Time</h2>
          <button type="button" onClick={onClose} aria-label="Close report dialog">
            <X size={18} />
          </button>
        </div>
        {reportStatus === 'submitted' ? (
          <div className="wb-success-box" role="status">
            <Check size={18} />
            <p>Report submitted. Thanks - we will review this event.</p>
            <button type="button" onClick={onSubmitAnother}>
              Submit Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <label>
              Report type
              <select
                value={reportType}
                onChange={(eventArg) =>
                  onTypeChange(eventArg.target.value as WorldBossReportPayload['report_type'])
                }
                required
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Optional note
              <textarea
                maxLength={501}
                value={reportNote}
                onChange={(eventArg) => onNoteChange(eventArg.target.value)}
                placeholder="Tell us what looked wrong. Max 500 characters."
              />
            </label>
            <p className="wb-muted">
              Event: {event?.boss_name || 'Unknown'} | Displayed time:{' '}
              <span suppressHydrationWarning>
                {event ? formatLocalDateTime(event.spawn_time_utc) : 'Unavailable'}
              </span>
            </p>
            {reportStatus === 'error' ? <p className="wb-warning">{reportError}</p> : null}
            <button className="wb-primary-button" type="submit" disabled={reportStatus === 'submitting'}>
              {reportStatus === 'submitting' ? <Loader2 size={15} /> : <Send size={15} />}
              Submit Report
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function ConfidenceBadge({ status, short = false }: { status: WorldBossEventDto['confidence_status']; short?: boolean }) {
  return (
    <span className={`wb-confidence wb-confidence--${confidenceClass(status)}`}>
      {short ? status.replace('Needs verification', 'Verify') : status}
    </span>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="wb-skeleton">
      <p>{label}</p>
      <span />
      <span />
      <span />
    </div>
  );
}
