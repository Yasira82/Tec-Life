'use client';

// The redesign's privacy section (Phase 1, approved spec: three groups). Same consents, same route
// (useConsent → PUT /api/bff/life/consent), same deletion rules on the server — only the way they
// are laid out and said changes, to match what the code does:
//
//   What Life keeps      JOURNEY, CONVERSATIONS — two independent switches. Turning either off
//                        deletes what it kept, so it asks first and says how much.
//   What TEC AI may read the per-kind switches, the provider note, the live intent window.
//   Reminder             CHECKIN.
//
// Then «delete my Life data», two taps, exactly as before.
//
// Turning a keep switch off (owner review of #132): the confirmation counts first and cannot be
// confirmed until the count is known; a count that cannot be read says so, with a retry, and offers
// nothing to delete. While the server works the confirmation stays, and it closes only on success.
// A refusal stays on screen, and the switch shows what the server says is stored. Any other switch
// that fails to save says so too; settings that cannot be loaded say so instead of vanishing.
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { C, errorA, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { useConsent, useIntent, purgeLifeData, type LifeDataCategory } from '@/lib-client/life/useLife';
import { readJourney, readSelf } from '@/lib-client/life/journey';
import { listConversations } from '@/lib-client/life/conversations';
import { meCopy } from '@/lib/life/me-copy';
import { fill } from '@/lib/life/today-copy';
import { conversationsDeletion, journeyDeletion, type DeletionCount } from '@/lib/life/deletion-count';

const KEEP: LifeDataCategory[] = ['JOURNEY', 'CONVERSATIONS'];
const REMINDER: LifeDataCategory[] = ['CHECKIN'];

const card: CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '6px 16px' };
type OffPhase = 'counting' | 'countFailed' | 'ready' | 'deleting' | 'failed';
interface Off { cat: LifeDataCategory; phase: OffPhase; count?: DeletionCount }

const group: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: C.subtext, padding: '12px 0 4px' };

/**
 * `onDeleted` is told, after the server confirmed it, that a keep switch was turned off and what it
 * kept is gone — so the rest of the screen re-reads from the source instead of showing it still.
 */
export function MePrivacy({ onDeleted }: { onDeleted?: (cat: 'JOURNEY' | 'CONVERSATIONS') => void } = {}) {
  const { t, locale } = useTranslation();
  const p = t.life.privacy;
  const m = meCopy(locale);
  const { consent, loading, saving, error, grant, reload } = useConsent();
  const intent = useIntent();
  const [off, setOff] = useState<Off | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [purgeArmed, setPurgeArmed] = useState(false);
  const [purge, setPurge] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  // How much a keep switch would delete — read when the person asks to turn it off, and again on retry.
  const count = useCallback(async (cat: LifeDataCategory) => {
    setOff({ cat, phase: 'counting' });
    const c = cat === 'JOURNEY'
      ? await Promise.all([readJourney(), readSelf()]).then(([j, s]) => journeyDeletion(j, s))
      : await listConversations().then(conversationsDeletion);
    setOff((o) => (o && o.cat === cat ? (c ? { cat, phase: 'ready', count: c } : { cat, phase: 'countFailed' }) : o));
  }, []);

  // The second tap of «delete my data» disarms itself, as on the current screen.
  useEffect(() => {
    if (!purgeArmed) return;
    const id = setTimeout(() => setPurgeArmed(false), 6000);
    return () => clearTimeout(id);
  }, [purgeArmed]);

  const LABEL: Record<string, string> = {
    GOALS: p.goals, SKILLS: p.skills, PREFERENCES: p.preferences, ACTIVITY: p.activity, TRAJECTORY: p.trajectory,
    INTENT: p.intentTitle, BUDGET: p.budget, CHECKIN: p.checkin, JOURNEY: m.keepJourney, CONVERSATIONS: m.keepConvs,
  };
  const INTENT_LABEL: Record<string, string> = {
    GOAL_CREATED: p.kGoal, PROGRESS_LOGGED: p.kProgress, GOAL_COMPLETED: p.kDone,
    SKILL_ADDED: p.kSkill, SKILL_LEVELED: p.kLevel, PREFERENCE_SET: p.kPref,
  };
  const on = (c: LifeDataCategory) => consent.find((x) => x.category === c)?.granted === true;
  const keep = consent.filter((c) => KEEP.includes(c.category));
  const hub = consent.filter((c) => !KEEP.includes(c.category) && !REMINDER.includes(c.category));
  const reminder = consent.filter((c) => REMINDER.includes(c.category));

  const flip = async (c: LifeDataCategory, next: boolean) => {
    setSaveFailed(false);
    // Turning a keep switch OFF deletes what it kept: count, then ask.
    if (KEEP.includes(c) && !next) { void count(c); return; }
    if (!(await grant(c, next))) setSaveFailed(true);
  };
  const confirmOff = async () => {
    if (!off || off.phase !== 'ready' && off.phase !== 'failed') return;
    const { cat, count: c } = off;
    setOff({ cat, phase: 'deleting', count: c });
    const ok = await grant(cat, false);
    // Closed only on success. On a refusal it stays, says so, and the switch shows the server's truth.
    setOff(ok ? null : { cat, phase: 'failed', count: c });
    if (ok && (cat === 'JOURNEY' || cat === 'CONVERSATIONS')) onDeleted?.(cat);
  };

  const removeAll = async () => {
    if (!purgeArmed) { setPurgeArmed(true); return; }
    setPurgeArmed(false); setPurge('busy');
    try { await purgeLifeData(); setPurge('done'); setTimeout(() => window.location.reload(), 900); }
    catch { setPurge('failed'); }
  };

  const row = (c: LifeDataCategory, desc?: string, extra?: ReactNode) => (
    <div key={c} style={{ padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: C.text }}>{LABEL[c] ?? c}</div>
          {desc && <div style={{ fontSize: 12.5, color: C.subtext, lineHeight: 1.55, marginTop: 3 }}>{desc}</div>}
        </div>
        <Switch on={on(c)} disabled={saving || !!off} label={LABEL[c] ?? c} onChange={(v) => void flip(c, v)} />
      </div>
      {extra}
    </div>
  );

  const btn = (danger: boolean): CSSProperties => ({
    minHeight: 44, padding: '0 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer', background: 'transparent',
    border: `1px solid ${danger ? errorA(0.5) : C.border}`, color: danger ? C.error : C.text,
  });
  const confirmBox = (c: LifeDataCategory) => {
    if (off?.cat !== c) return null;
    const what = (k: DeletionCount) => {
      const n = k.atLeast ? fill(m.atLeast, { n: k.n }) : String(k.n);
      return fill(c === 'JOURNEY' ? m.offSummaries : m.offConversations, { n }) + (k.self ? m.andSelf : '');
    };
    const { phase } = off;
    return (
      <div role="alert" data-testid={`confirm-off-${c}`} data-phase={phase} aria-busy={phase === 'counting' || phase === 'deleting'}
        style={{ marginTop: 8, padding: 10, borderRadius: 12, background: errorA(0.06), border: `1px solid ${errorA(0.3)}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>
          {phase === 'counting' ? m.counting
            : phase === 'countFailed' ? m.countFailed
            : phase === 'deleting' ? m.deleting
            : fill(m.offConfirm, { n: what(off.count!) })}
        </span>
        {phase === 'failed' && <span style={{ fontSize: 13, color: C.error, lineHeight: 1.5 }}>{m.offFailed}</span>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {phase === 'countFailed'
            ? <button type="button" onClick={() => void count(c)} style={btn(false)}>{m.retry}</button>
            : <button type="button" disabled={phase !== 'ready' && phase !== 'failed'} onClick={() => void confirmOff()}
                style={{ ...btn(true), opacity: phase === 'ready' || phase === 'failed' ? 1 : 0.5 }}>{m.offDo}</button>}
          <button type="button" disabled={phase === 'deleting'} onClick={() => setOff(null)} style={btn(false)}>{m.offKeep}</button>
        </div>
      </div>
    );
  };

  return (
    <section data-testid="me-privacy" aria-labelledby="me-privacy-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 id="me-privacy-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{p.title}</h2>
      {!loading && consent.length === 0 && error ? (
        <div role="alert" data-testid="privacy-load-failed" style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 14, color: C.text }}>{m.loadFailed}</p>
          <button type="button" onClick={reload} style={{ ...btn(false), alignSelf: 'flex-start' }}>{m.retry}</button>
        </div>
      ) : loading && consent.length === 0 ? (
        <div aria-busy="true" style={{ ...card, height: 160, opacity: 0.6 }} />
      ) : null}
      {saveFailed && <p role="alert" data-testid="privacy-save-failed" style={{ margin: 0, fontSize: 13, color: C.error }}>{m.saveFailed}</p>}
      <div style={{ ...card, display: consent.length ? 'block' : 'none' }}>
        {keep.length > 0 && (<>
          <div style={group}>{m.gKeep}</div>
          {keep.map((c) => row(c.category, c.category === 'JOURNEY' ? m.keepJourneyDesc : m.keepConvsDesc, <>
            {c.category === 'CONVERSATIONS' && on('CONVERSATIONS') && !on('JOURNEY') && (
              <p data-testid="stored-not-read" style={{ margin: '6px 0 0', fontSize: 12.5, color: C.gold, lineHeight: 1.5 }}>{m.storedNotRead}</p>
            )}
            {confirmBox(c.category)}
          </>))}
        </>)}

        {hub.length > 0 && (<>
          <div style={{ ...group, borderTop: `1px solid ${C.border}`, marginTop: 6 }}>{m.gHub}</div>
          <p style={{ margin: '0 0 4px', fontSize: 12.5, color: C.subtext, lineHeight: 1.55 }}>{m.gHubNote}</p>
          <p role="note" style={{ margin: '0 0 8px', fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>{p.shareProvider}</p>
          {hub.map((c) => row(c.category, undefined, c.category === 'INTENT' && intent ? (
            <div style={{ fontSize: 12.5, color: C.subtext, marginTop: 4, lineHeight: 1.5 }}>
              {intent.intent ? (INTENT_LABEL[intent.intent] ?? intent.intent) : p.intentNone} · {p.intentNote}
            </div>
          ) : undefined))}
        </>)}

        {reminder.length > 0 && (<>
          <div style={{ ...group, borderTop: `1px solid ${C.border}`, marginTop: 6 }}>{m.gReminder}</div>
          {reminder.map((c) => row(c.category, p.checkinDesc))}
        </>)}
      </div>

      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.error }}>{p.deleteTitle}</div>
        <p style={{ fontSize: 12.5, color: C.subtext, margin: '6px 0 12px', lineHeight: 1.6 }}>{p.deleteDesc}</p>
        <button type="button" onClick={() => void removeAll()} disabled={purge === 'busy' || purge === 'done'} style={{
          width: '100%', minHeight: 48, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 800, color: C.error,
          background: purgeArmed ? errorA(0.16) : errorA(0.06), border: `1px solid ${errorA(purgeArmed ? 0.55 : 0.28)}`,
        }}>
          {purge === 'busy' ? p.deleting : purge === 'done' ? p.deleted : purgeArmed ? p.confirm : p.delete}
        </button>
        {purge === 'failed' && <p role="alert" style={{ fontSize: 12.5, color: C.error, margin: '10px 0 0' }}>{p.failed}</p>}
      </div>
    </section>
  );
}

/** A switch: a 44×26 pill inside a 52×44 target. */
function Switch({ on, disabled, label, onChange }: { on: boolean; disabled: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      style={{ width: 52, minHeight: 44, flex: 'none', border: 'none', background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>
      <span aria-hidden="true" style={{ width: 44, height: 26, borderRadius: 999, position: 'relative', display: 'block',
        background: on ? goldA(0.2) : C.surface2, border: `1px solid ${on ? C.gold : C.border}` }}>
        <span style={{ position: 'absolute', top: 3, insetInlineStart: on ? 21 : 3, width: 18, height: 18, borderRadius: 999,
          background: on ? C.gold : C.subtext, transition: 'inset-inline-start 0.2s' }} />
      </span>
    </button>
  );
}
