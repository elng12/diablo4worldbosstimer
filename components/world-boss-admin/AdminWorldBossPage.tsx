'use client';

import { AlertTriangle, Bell, List, Loader2, RefreshCw, Save, Settings, Shield, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type {
  AdminWorldBossReportDto,
  ConfidenceStatus,
  WorldBossEventDto,
} from '@/types/worldBoss';

type FetchStatus = 'idle' | 'loading' | 'ok' | 'error';

/* ------------------------------------------------------------------ */
/*  Shared tiny helpers                                               */
/* ------------------------------------------------------------------ */
function confidenceBadgeClass(status: ConfidenceStatus | string) {
  if (status === 'Confirmed') return 'wba-badge wba-badge--confirmed';
  if (status === 'Predicted') return 'wba-badge wba-badge--predicted';
  return 'wba-badge wba-badge--needs-verification';
}

function reportBadgeClass(status: string) {
  if (status === 'resolved') return 'wba-badge wba-badge--resolved';
  if (status === 'ignored') return 'wba-badge wba-badge--ignored';
  return 'wba-badge wba-badge--open';
}

/* ------------------------------------------------------------------ */
/*  AdminWorldBossPage                                                */
/* ------------------------------------------------------------------ */
export function AdminWorldBossPage() {
  /* ---- Token ---- */
  const [token, setToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('wba_token') ?? '';
    if (saved) { setToken(saved); setTokenSaved(true); }
  }, []);

  function saveToken() {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;
    setToken(trimmedToken);
    sessionStorage.setItem('wba_token', trimmedToken);
    setTokenSaved(true);
  }

  function clearToken() {
    sessionStorage.removeItem('wba_token');
    setToken('');
    setTokenSaved(false);
  }

  function authHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /* ---- Events ---- */
  const [events, setEvents] = useState<WorldBossEventDto[]>([]);
  const [eventsStatus, setEventsStatus] = useState<FetchStatus>('idle');

  const fetchEvents = useCallback(async () => {
    setEventsStatus('loading');
    try {
      const res = await fetch('/api/admin/world-boss/events?limit=20', { headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setEvents(body.events ?? []);
      setEventsStatus('ok');
    } catch {
      setEvents([]);
      setEventsStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---- Reports ---- */
  const [reports, setReports] = useState<AdminWorldBossReportDto[]>([]);
  const [reportsStatus, setReportsStatus] = useState<FetchStatus>('idle');

  const fetchReports = useCallback(async () => {
    setReportsStatus('loading');
    try {
      const res = await fetch('/api/admin/world-boss/reports', { headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setReports(body.reports ?? []);
      setReportsStatus('ok');
    } catch {
      setReports([]);
      setReportsStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function updateReportStatus(reportId: string, status: 'open' | 'resolved' | 'ignored') {
    try {
      const res = await fetch('/api/admin/world-boss/report-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ report_id: reportId, status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r)),
      );
    } catch {
      /* silent — badge stays */
    }
  }

  /* ---- Announcement ---- */
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState<FetchStatus>('idle');
  const [announcementResult, setAnnouncementResult] = useState<string | null>(null);

  const fetchAnnouncement = useCallback(async () => {
    setAnnouncementStatus('loading');
    try {
      const res = await fetch('/api/admin/world-boss/announcement', { headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setAnnouncementEnabled(body.announcement?.enabled ?? false);
      setAnnouncementMessage(body.announcement?.message ?? '');
      setAnnouncementStatus('ok');
    } catch {
      setAnnouncementStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function saveAnnouncement() {
    setAnnouncementResult(null);
    try {
      const res = await fetch('/api/admin/world-boss/announcement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ enabled: announcementEnabled, message: announcementMessage || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setAnnouncementResult('ok');
    } catch {
      setAnnouncementResult('err');
    }
  }

  /* ---- Override form ---- */
  const [overrideEventId, setOverrideEventId] = useState('');
  const [overrideBossName, setOverrideBossName] = useState('');
  const [overrideSpawnTime, setOverrideSpawnTime] = useState('');
  const [overrideLocation, setOverrideLocation] = useState('');
  const [overrideRegion, setOverrideRegion] = useState('');
  const [overrideConfidence, setOverrideConfidence] = useState<ConfidenceStatus | ''>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideResult, setOverrideResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  async function submitOverride() {
    setOverrideLoading(true);
    setOverrideResult(null);
    try {
      const payload: Record<string, unknown> = { event_id: overrideEventId };
      if (overrideBossName) payload.boss_name = overrideBossName;
      if (overrideSpawnTime) payload.spawn_time_utc = overrideSpawnTime;
      if (overrideLocation) payload.location_name = overrideLocation;
      if (overrideRegion) payload.region = overrideRegion;
      if (overrideConfidence) payload.confidence_status = overrideConfidence;
      if (overrideReason) payload.override_reason = overrideReason;

      const res = await fetch('/api/admin/world-boss/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      setOverrideResult({ ok: true, msg: `Override applied — event ${body.event?.event_id ?? overrideEventId}` });
      setOverrideEventId('');
      setOverrideBossName('');
      setOverrideSpawnTime('');
      setOverrideLocation('');
      setOverrideRegion('');
      setOverrideConfidence('');
      setOverrideReason('');
      fetchEvents();
    } catch (err) {
      setOverrideResult({ ok: false, msg: err instanceof Error ? err.message : 'Override failed.' });
    } finally {
      setOverrideLoading(false);
    }
  }

  /* ---- Anchor form ---- */
  const [anchorSpawnTime, setAnchorSpawnTime] = useState('');
  const [anchorBoss, setAnchorBoss] = useState('');
  const [anchorBossSlug, setAnchorBossSlug] = useState('');
  const [anchorLocation, setAnchorLocation] = useState('');
  const [anchorRegion, setAnchorRegion] = useState('');
  const [anchorWaypoint, setAnchorWaypoint] = useState('');
  const [anchorBossIdx, setAnchorBossIdx] = useState('0');
  const [anchorLocIdx, setAnchorLocIdx] = useState('0');
  const [anchorInterval, setAnchorInterval] = useState('210');
  const [anchorResult, setAnchorResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [anchorLoading, setAnchorLoading] = useState(false);

  async function submitAnchor() {
    setAnchorLoading(true);
    setAnchorResult(null);
    try {
      const res = await fetch('/api/admin/world-boss/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          anchor_spawn_time_utc: anchorSpawnTime,
          anchor_boss: anchorBoss,
          anchor_boss_slug: anchorBossSlug,
          anchor_location_name: anchorLocation,
          anchor_region: anchorRegion,
          anchor_nearest_waypoint: anchorWaypoint,
          boss_rotation_index: Number(anchorBossIdx),
          location_rotation_index: Number(anchorLocIdx),
          interval_minutes: Number(anchorInterval) || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
      const gen = body.generation ?? {};
      setAnchorResult({
        ok: true,
        msg: `Anchor set — ${gen.inserted_count ?? '?'} events inserted, ${gen.generated_count ?? '?'} generated`,
      });
      fetchEvents();
    } catch (err) {
      setAnchorResult({ ok: false, msg: err instanceof Error ? err.message : 'Anchor reset failed.' });
    } finally {
      setAnchorLoading(false);
    }
  }

  /* ---- Initial fetch when token is saved ---- */
  useEffect(() => {
    if (tokenSaved) {
      Promise.all([fetchEvents(), fetchReports(), fetchAnnouncement()]).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSaved]);

  /* ---- Auto-fill override form from events table ---- */
  function prefillOverride(ev: WorldBossEventDto) {
    setOverrideEventId(ev.event_id);
    setOverrideBossName(ev.boss_name);
    setOverrideSpawnTime(ev.spawn_time_utc);
    setOverrideLocation(ev.location_name ?? '');
    setOverrideRegion(ev.region ?? '');
    setOverrideConfidence(ev.confidence_status);
  }

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div className="wba-page">
      <h1 className="wba-title">
        <Shield style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 8 }} />
        World Boss Admin
      </h1>

      {/* ---- Token bar ---- */}
      <div className="wba-token-bar">
        <input
          type="password"
          placeholder="ADMIN_API_TOKEN"
          value={token}
          onChange={(e) => { setToken(e.target.value); setTokenSaved(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') saveToken(); }}
        />
        {tokenSaved ? (
          <>
            <span className="wba-status wba-status--ok">saved</span>
            <button
              className="wba-btn wba-btn--secondary wba-btn--sm"
              aria-label="Clear admin token"
              onClick={clearToken}
            >
              <X style={{ width: 12, height: 12 }} /> clear
            </button>
          </>
        ) : (
          <button
            className="wba-btn wba-btn--primary wba-btn--sm"
            onClick={saveToken}
            disabled={!token.trim()}
          >
            Save token
          </button>
        )}
      </div>

      {!tokenSaved && <p className="wba-empty">Enter and save an admin token to unlock the panel.</p>}

      {tokenSaved && (
        <>
          {/* ---- Future Events ---- */}
          <section className="wba-section">
            <h2 className="wba-section-title">
              <List data-icon /> Future 20 Events
              <button
                className="wba-btn wba-btn--secondary wba-btn--sm"
                aria-label="Refresh future events"
                onClick={fetchEvents}
                style={{ marginLeft: 'auto' }}
              >
                <RefreshCw style={{ width: 12, height: 12 }} /> refresh
              </button>
            </h2>

            {eventsStatus === 'loading' && <div className="wba-empty"><span className="wba-spinner" /> Loading...</div>}
            {eventsStatus === 'error' && <div className="wba-empty" style={{ color: 'var(--wb-needs-verification)' }}>Failed to load events.</div>}
            {eventsStatus === 'ok' && events.length === 0 && <div className="wba-empty">No future events found.</div>}

            {events.length > 0 && (
              <div className="wba-table-wrap">
                <table className="wba-table">
                  <thead>
                    <tr>
                      <th>Boss</th>
                      <th>UTC Time</th>
                      <th>Location</th>
                      <th>Confidence</th>
                      <th>Source</th>
                      <th>Override</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.event_id}>
                        <td>{ev.boss_name}</td>
                        <td>{new Date(ev.spawn_time_utc).toISOString().replace('T', ' ').slice(0, 19)}</td>
                        <td>{ev.location_name ?? '—'}</td>
                        <td><span className={confidenceBadgeClass(ev.confidence_status)}>{ev.confidence_status}</span></td>
                        <td>{ev.source_type}</td>
                        <td>{ev.is_overridden && <span className="wba-badge wba-badge--override">yes</span>}</td>
                        <td>
                          <button
                            className="wba-btn wba-btn--gold wba-btn--sm"
                            aria-label={`Edit ${ev.boss_name} event at ${new Date(ev.spawn_time_utc).toISOString()}`}
                            onClick={() => prefillOverride(ev)}
                          >
                            edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ---- Override form ---- */}
          <section className="wba-section">
            <h2 className="wba-section-title"><Settings data-icon /> Override Event</h2>
            <div className="wba-form">
              <div className="wba-field">
                <label>Event ID</label>
                <input value={overrideEventId} onChange={(e) => setOverrideEventId(e.target.value)} placeholder="uuid" />
              </div>
              <div className="wba-row">
                <div className="wba-field">
                  <label>Boss Name</label>
                  <input value={overrideBossName} onChange={(e) => setOverrideBossName(e.target.value)} placeholder="Ashava" />
                </div>
                <div className="wba-field">
                  <label>Spawn Time (ISO)</label>
                  <input value={overrideSpawnTime} onChange={(e) => setOverrideSpawnTime(e.target.value)} placeholder="2025-01-01T00:00:00Z" />
                </div>
              </div>
              <div className="wba-row">
                <div className="wba-field">
                  <label>Location</label>
                  <input value={overrideLocation} onChange={(e) => setOverrideLocation(e.target.value)} placeholder="Crane Pool" />
                </div>
                <div className="wba-field">
                  <label>Region</label>
                  <input value={overrideRegion} onChange={(e) => setOverrideRegion(e.target.value)} placeholder="Fractured Peaks" />
                </div>
              </div>
              <div className="wba-row">
                <div className="wba-field">
                  <label>Confidence</label>
                  <select value={overrideConfidence} onChange={(e) => setOverrideConfidence(e.target.value as ConfidenceStatus | '')}>
                    <option value="">— unchanged —</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Predicted">Predicted</option>
                    <option value="Needs verification">Needs verification</option>
                  </select>
                </div>
                <div className="wba-field">
                  <label>Reason</label>
                  <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="community confirmation" />
                </div>
              </div>
              <button className="wba-btn wba-btn--primary" onClick={submitOverride} disabled={overrideLoading || !overrideEventId}>
                {overrideLoading ? <><Loader2 style={{ width: 14, height: 14 }} className="wba-spin" /> Applying...</> : <>Apply Override</>}
              </button>
              {overrideResult && (
                <div className={`wba-result ${overrideResult.ok ? 'wba-result--ok' : 'wba-result--err'}`}>
                  {overrideResult.msg}
                </div>
              )}
            </div>
          </section>

          {/* ---- Anchor form ---- */}
          <section className="wba-section">
            <h2 className="wba-section-title"><AlertTriangle data-icon /> Reset Anchor</h2>
            <div className="wba-form">
              <div className="wba-field">
                <label>Anchor Spawn Time (ISO)</label>
                <input value={anchorSpawnTime} onChange={(e) => setAnchorSpawnTime(e.target.value)} placeholder="2025-01-01T00:00:00Z" />
              </div>
              <div className="wba-row">
                <div className="wba-field">
                  <label>Boss</label>
                  <input value={anchorBoss} onChange={(e) => setAnchorBoss(e.target.value)} placeholder="Ashava" />
                </div>
                <div className="wba-field">
                  <label>Boss Slug</label>
                  <input value={anchorBossSlug} onChange={(e) => setAnchorBossSlug(e.target.value)} placeholder="ashava" />
                </div>
              </div>
              <div className="wba-row">
                <div className="wba-field">
                  <label>Location</label>
                  <input value={anchorLocation} onChange={(e) => setAnchorLocation(e.target.value)} placeholder="Crane Pool" />
                </div>
                <div className="wba-field">
                  <label>Region</label>
                  <input value={anchorRegion} onChange={(e) => setAnchorRegion(e.target.value)} placeholder="Fractured Peaks" />
                </div>
              </div>
              <div className="wba-row-3 wba-row">
                <div className="wba-field">
                  <label>Waypoint</label>
                  <input value={anchorWaypoint} onChange={(e) => setAnchorWaypoint(e.target.value)} placeholder="Maro" />
                </div>
                <div className="wba-field">
                  <label>Boss Rot. Index</label>
                  <input type="number" value={anchorBossIdx} onChange={(e) => setAnchorBossIdx(e.target.value)} />
                </div>
                <div className="wba-field">
                  <label>Loc. Rot. Index</label>
                  <input type="number" value={anchorLocIdx} onChange={(e) => setAnchorLocIdx(e.target.value)} />
                </div>
              </div>
              <div className="wba-field">
                <label>Interval (min)</label>
                <input type="number" value={anchorInterval} onChange={(e) => setAnchorInterval(e.target.value)} placeholder="210" />
              </div>
              <button className="wba-btn wba-btn--primary" onClick={submitAnchor} disabled={anchorLoading || !anchorSpawnTime || !anchorBoss}>
                {anchorLoading ? <><Loader2 style={{ width: 14, height: 14 }} className="wba-spin" /> Resetting...</> : <>Reset Anchor &amp; Regenerate</>}
              </button>
              {anchorResult && (
                <div className={`wba-result ${anchorResult.ok ? 'wba-result--ok' : 'wba-result--err'}`}>
                  {anchorResult.msg}
                </div>
              )}
            </div>
          </section>

          {/* ---- Reports ---- */}
          <section className="wba-section">
            <h2 className="wba-section-title">
              <AlertTriangle data-icon /> User Reports
              <button
                className="wba-btn wba-btn--secondary wba-btn--sm"
                aria-label="Refresh user reports"
                onClick={fetchReports}
                style={{ marginLeft: 'auto' }}
              >
                <RefreshCw style={{ width: 12, height: 12 }} /> refresh
              </button>
            </h2>

            {reportsStatus === 'loading' && <div className="wba-empty"><span className="wba-spinner" /> Loading...</div>}
            {reportsStatus === 'error' && <div className="wba-empty" style={{ color: 'var(--wb-needs-verification)' }}>Failed to load reports.</div>}
            {reportsStatus === 'ok' && reports.length === 0 && <div className="wba-empty">No reports found.</div>}

            {reports.length > 0 && (
              <div className="wba-table-wrap">
                <table className="wba-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Note</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td title={r.id}>{r.id.slice(0, 8)}</td>
                        <td title={r.event_id ?? ''}>{r.event_id ? r.event_id.slice(0, 8) : '—'}</td>
                        <td>{r.report_type}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.user_note ?? ''}>{r.user_note ?? '—'}</td>
                        <td><span className={reportBadgeClass(r.status)}>{r.status}</span></td>
                        <td>{r.created_at ? new Date(r.created_at).toISOString().slice(0, 16).replace('T', ' ') : '—'}</td>
                        <td style={{ display: 'flex', gap: 4 }}>
                          {r.status !== 'resolved' && (
                            <button
                              className="wba-btn wba-btn--sm wba-btn--secondary"
                              aria-label={`Resolve report ${r.id}`}
                              onClick={() => updateReportStatus(r.id, 'resolved')}
                            >
                              resolve
                            </button>
                          )}
                          {r.status !== 'ignored' && (
                            <button
                              className="wba-btn wba-btn--sm wba-btn--secondary"
                              aria-label={`Ignore report ${r.id}`}
                              onClick={() => updateReportStatus(r.id, 'ignored')}
                            >
                              ignore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ---- Announcement ---- */}
          <section className="wba-section">
            <h2 className="wba-section-title"><Bell data-icon /> Announcement</h2>
            {announcementStatus === 'loading' && <div className="wba-empty"><span className="wba-spinner" /> Loading...</div>}
            {announcementStatus === 'error' && <div className="wba-empty" style={{ color: 'var(--wb-needs-verification)' }}>Failed to load announcement.</div>}
            {announcementStatus !== 'loading' && announcementStatus !== 'error' && (
              <div className="wba-form">
                <div className="wba-toggle-row">
                  <button
                    className="wba-toggle"
                    role="switch"
                    aria-label="Toggle announcement"
                    aria-checked={announcementEnabled}
                    onClick={() => setAnnouncementEnabled((v) => !v)}
                  />
                  <span className="wba-toggle-label">{announcementEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="wba-field">
                  <label>Message</label>
                  <textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Announcement message for users..."
                  />
                </div>
                <button className="wba-btn wba-btn--primary" onClick={saveAnnouncement}>
                  <Save style={{ width: 14, height: 14 }} /> Save Announcement
                </button>
                {announcementResult && (
                  <div className={`wba-result ${announcementResult === 'ok' ? 'wba-result--ok' : 'wba-result--err'}`}>
                    {announcementResult === 'ok' ? 'Announcement saved.' : 'Failed to save announcement.'}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
