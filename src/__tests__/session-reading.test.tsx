/**
 * The owner's reading (admin only): the change loop counted, and whether "real use" — the bar
 * set before any number was seen — is met (owner, 2026-10-20). Counts under 5 are "fewer than 5".
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { SessionReading } from '../app/app/components/SessionReading';
import { sessionCopy } from '@/lib/life/session-copy';
import { SESSION_METRICS } from '@/lib-client/life/sessionCounter';

const s = sessionCopy('en');
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const report = (real_use: unknown) => ({
  weeks: [{ week_start: '2026-10-19', counts: { s2_started: 7, s7_reached: 6, m6_yes: null, m6_somewhat: null, m6_no: null,
    j_kept: 5, c_resumed: null, m_before: 5, m_after: null, m_unknown: null, g_from_step: null } }],
  total: {}, stage1: { m1: null, m6_clearer: null, m6_no: null, result: 'not_enough_data' }, real_use,
});
const stub = (data: unknown) => vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data }) }) as Response));

describe('the reading', () => {
  it('shows the change loop by week, hiding counts under 5', async () => {
    stub(report({ reached: 6, after: null, met: false, bar: { weeks: 2, reached: 5, after: 5 } }));
    render(<SessionReading />);
    expect(await screen.findByText(new RegExp(s.readingKept))).toBeTruthy();
    expect(screen.getByText(new RegExp(`${s.readingBefore}`)).textContent).toContain('5');
    expect(screen.getByText(new RegExp(`^${s.readingGoal}`)).textContent).toContain(s.readingFewer);
  });

  it('says "not yet" until the bar is met, and "met" once it is', async () => {
    stub(report({ reached: 6, after: null, met: false, bar: { weeks: 2, reached: 5, after: 5 } }));
    render(<SessionReading />);
    expect(await screen.findByText(s.realUseNotYet)).toBeTruthy();
    cleanup();
    stub(report({ reached: 6, after: 5, met: true, bar: { weeks: 2, reached: 5, after: 5 } }));
    render(<SessionReading />);
    expect(await screen.findByText(s.realUseMet)).toBeTruthy();
  });

  it('the page may send only what only the page knows', () => {
    expect(SESSION_METRICS).toContain('c_resumed');
    expect(SESSION_METRICS).toContain('g_from_step');
    for (const m of ['j_kept', 'm_before', 'm_after', 'm_unknown']) expect(SESSION_METRICS).not.toContain(m); // counted by the service
  });
});
