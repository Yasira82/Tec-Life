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
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { C, errorA, goldA } from '@/lib-client/palette';
import { useTranslation } from '@/lib/i18n';
import { useConsent, useIntent, purgeLifeData, type LifeDataCategory } from '@/lib-client/life/useLife';
import { readJourney } from '@/lib-client/life/journey';
import { listConversations } from '@/lib-client/life/conversations';
import { meCopy } from '@/lib/life/me-copy';
import { fill } from '@/lib/life/today-copy';

const KEEP: LifeDataCategory[] = ['JOURNEY', 'CONVERSATIONS'];
const REMINDER: LifeDataCategory[] = ['CHECKIN'];

const card: CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '6px 16px' };
const group: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: C.subtext, padding: '12px 0 4px' };

export function MePrivacy() {
  const { t, locale } = useTranslation();
  const p = t.life.privacy;
  const m = meCopy(locale);
  const { consent, loading, saving, grant } = useConsent();
  const intent = useIntent();
  const [armedOff, setArmedOff] = useState<LifeDataCategory | null>(null);
  const [counts, setCounts] = useState<{ summaries: number | null; conversations: number | null }>({ summaries: null, conversations: null });
  const [purgeArmed, setPurgeArmed] = useState(false);
  const [purge, setPurge] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  // How much each keep switch would delete — read only when the person asks to turn one off.
  useEffect(() => {
    if (!armedOff) return;
    if (armedOff === 'JOURNEY') void readJourney().then((j) => setCounts((c) => ({ ...c, summaries: j ? j.entries.length : null })));
    else void listConversations().then((l) => setCounts((c) => ({ ...c, conversations: l ? l.conversations.length : null })));
  }, [armedOff]);

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

  const flip = (c: LifeDataCategory, next: boolean) => {
    // Turning a keep switch OFF deletes what it kept: ask first.
    if (KEEP.includes(c) && !next) { setArmedOff(c); return; }
    void grant(c, next);
  };
  const confirmOff = async () => {
    if (!armedOff) return;
    const c = armedOff; setArmedOff(null);
    await grant(c, false);
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
        <Switch on={on(c)} disabled={saving} label={LABEL[c] ?? c} onChange={(v) => flip(c, v)} />
      </div>
      {extra}
    </div>
  );

  const confirmBox = (c: LifeDataCategory) => {
    if (armedOff !== c) return null;
    const n = c === 'JOURNEY' ? counts.summaries : counts.conversations;
    const what = n == null ? '…' : fill(c === 'JOURNEY' ? m.offSummaries : m.offConversations, { n });
    return (
      <div role="alert" data-testid={`confirm-off-${c}`} style={{ marginTop: 8, padding: 10, borderRadius: 12, background: errorA(0.06), border: `1px solid ${errorA(0.3)}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13.5, color: C.text }}>{fill(m.offConfirm, { n: what })}</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={saving} onClick={() => void confirmOff()} style={{ minHeight: 44, padding: '0 14px', borderRadius: 12, border: `1px solid ${errorA(0.5)}`, background: 'transparent', color: C.error, fontSize: 14, cursor: 'pointer' }}>{m.offDo}</button>
          <button type="button" onClick={() => setArmedOff(null)} style={{ minHeight: 44, padding: '0 14px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer' }}>{m.offKeep}</button>
        </div>
      </div>
    );
  };

  return (
    <section data-testid="me-privacy" aria-labelledby="me-privacy-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 id="me-privacy-h" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{p.title}</h2>
      <div style={card}>
        {!loading && keep.length > 0 && (<>
          <div style={group}>{m.gKeep}</div>
          {keep.map((c) => row(c.category, c.category === 'JOURNEY' ? m.keepJourneyDesc : m.keepConvsDesc, <>
            {c.category === 'CONVERSATIONS' && on('CONVERSATIONS') && !on('JOURNEY') && (
              <p data-testid="stored-not-read" style={{ margin: '6px 0 0', fontSize: 12.5, color: C.gold, lineHeight: 1.5 }}>{m.storedNotRead}</p>
            )}
            {confirmBox(c.category)}
          </>))}
        </>)}

        {!loading && hub.length > 0 && (<>
          <div style={{ ...group, borderTop: `1px solid ${C.border}`, marginTop: 6 }}>{m.gHub}</div>
          <p style={{ margin: '0 0 4px', fontSize: 12.5, color: C.subtext, lineHeight: 1.55 }}>{m.gHubNote}</p>
          <p role="note" style={{ margin: '0 0 8px', fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>{p.shareProvider}</p>
          {hub.map((c) => row(c.category, undefined, c.category === 'INTENT' && intent ? (
            <div style={{ fontSize: 12.5, color: C.subtext, marginTop: 4, lineHeight: 1.5 }}>
              {intent.intent ? (INTENT_LABEL[intent.intent] ?? intent.intent) : p.intentNone} · {p.intentNote}
            </div>
          ) : undefined))}
        </>)}

        {!loading && reminder.length > 0 && (<>
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
