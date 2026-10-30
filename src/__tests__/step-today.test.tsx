/**
 * The small step, day by day (owner, 2026-10-30: «حاجات مفيدة من غير AI»). One tap a day on Home,
 * seven dots, the week in plain words — no model, no score, no streak.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { StepToday } from '../app/app/components/StepToday';
import { lastDays, localDayKey, shiftDay, weekReview, followedStep } from '@/lib/life/step-week';
import { stepCopy } from '@/lib/life/step-copy';
import { sessionCopy } from '@/lib/life/session-copy';
import { LOCALES } from '@/lib/i18n/locales';
import type { JourneyEntry } from '@/lib-client/life/journey';

const TODAY = '2026-10-30';

describe('the week, read from the days', () => {
  it('seven days ending today, oldest first, an empty day is null', () => {
    const d = lastDays([{ day: '2026-10-30', answer: 'DONE' }, { day: '2026-10-25', answer: 'PARTLY' }, { day: '2026-10-20', answer: 'DONE' }], TODAY);
    expect(d.map((x) => x.day)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']);
    expect(d.map((x) => x.answer)).toEqual([null, 'PARTLY', null, null, null, null, 'DONE']);
  });

  it('calendar days, across a month end', () => {
    expect(shiftDay('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('this week against the one before; a first week is never "fewer"', () => {
    expect(weekReview([{ day: '2026-10-29', answer: 'DONE' }], TODAY)).toEqual({ done: 1, partly: 0, before: 0, trend: 'first' });
    const twoWeeks = [
      { day: '2026-10-20', answer: 'DONE' as const }, { day: '2026-10-21', answer: 'DONE' as const },
      { day: '2026-10-28', answer: 'DONE' as const }, { day: '2026-10-29', answer: 'DONE' as const }, { day: '2026-10-30', answer: 'DONE' as const },
    ];
    expect(weekReview(twoWeeks, TODAY)).toMatchObject({ done: 3, before: 2, trend: 'more' });
    expect(weekReview(twoWeeks.slice(0, 4), TODAY)).toMatchObject({ done: 2, before: 2, trend: 'same' });
    expect(weekReview(twoWeeks.slice(0, 3), TODAY)).toMatchObject({ done: 1, before: 2, trend: 'fewer' });
    // A "not yet" the week before is still an answer — the comparison is real.
    expect(weekReview([{ day: '2026-10-20', answer: 'NOT_YET' }], TODAY).trend).toBe('same');
  });

  it('the newest entry\'s step only — not after DONE, not over a month old, not when the newest has none', () => {
    const e = (over: Partial<JourneyEntry>): JourneyEntry => ({ id: 'j', problem: 'p', understanding: 'u', step: 'Walk', step_outcome: null, created_at: '2026-10-25T10:00:00Z', ...over });
    const now = new Date('2026-10-30T12:00:00Z');
    expect(followedStep([e({})], now)?.step).toBe('Walk');
    expect(followedStep([e({ step_outcome: 'PARTLY' })], now)).not.toBeNull();
    expect(followedStep([e({ step_outcome: 'DONE' })], now)).toBeNull();
    expect(followedStep([e({ created_at: '2026-09-20T10:00:00Z' })], now)).toBeNull();
    expect(followedStep([e({ step: null }), e({ id: 'old' })], now)).toBeNull();
    expect(followedStep([], now)).toBeNull();
  });

  it('every language says the week and every trend, with no placeholder left', () => {
    for (const { code } of LOCALES) {
      const c = stepCopy(code);
      for (const n of [0, 1, 2, 3, 7]) expect(c.week(n, n % 2), code).not.toMatch(/\{|undefined/);
      for (const t of ['first', 'more', 'same', 'fewer'] as const) expect(c.trend[t](2), `${code}/${t}`).toBeTruthy();
      if (code !== 'en') expect(c.question, code).not.toBe(stepCopy('en').question);
    }
    expect(stepCopy('ar').week(1, 0)).toBe('هذا الأسبوع: قمت بها يومًا واحدًا.');
    expect(stepCopy('ar').week(2, 1)).toBe('هذا الأسبوع: قمت بها يومين، وجزئيًا في يوم.');
    expect(stepCopy('ar').week(0, 0)).toBe('هذا الأسبوع: لم تُسجَّل أيام بعد.');
  });
});

describe('the card on Home', () => {
  const s = sessionCopy('en');
  const c = stepCopy('en');
  let journey: unknown;
  let puts: { url: string; body: unknown }[] = [];
  let putOk = true;
  const today = localDayKey();

  beforeEach(() => {
    puts = []; putOk = true;
    journey = { keeping: true, entries: [{ id: 'j1', problem: 'p', understanding: 'u', step: 'Phone in the kitchen at 11', step_outcome: null,
      created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(), days: [{ day: shiftDay(today, -1), answer: 'DONE' }] }] };
    vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
      const url = String(u);
      if ((init?.method ?? 'GET') === 'PUT') {
        puts.push({ url, body: JSON.parse(String(init?.body)) });
        return { ok: putOk, status: putOk ? 200 : 503, json: async () => ({}) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: journey }) } as Response;
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('shows the step, yesterday\'s dot and the week; one tap sends today\'s answer — the day is the person\'s own', async () => {
    render(<StepToday />);
    expect(await screen.findByText('Phone in the kitchen at 11')).toBeTruthy();
    expect(screen.getByTestId(`dot-${shiftDay(today, -1)}`).getAttribute('aria-label')).toContain('done');
    expect(screen.getByTestId(`dot-${today}`).getAttribute('aria-label')).toContain('no answer');
    expect(screen.getByTestId('step-week').textContent).toContain('done on 1 day');

    fireEvent.click(screen.getByRole('button', { name: s.outPartly }));
    await screen.findByText(c.saved);
    expect(puts).toEqual([{ url: '/api/bff/life/journey/j1/today', body: { day: today, answer: 'PARTLY' } }]);
    expect(screen.getByRole('button', { name: s.outPartly }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId(`dot-${today}`).getAttribute('aria-label')).toContain('partly');
  });

  it('a failed save says so and changes nothing on screen', async () => {
    putOk = false;
    render(<StepToday />);
    fireEvent.click(await screen.findByRole('button', { name: s.outDone }));
    await screen.findByText(c.failed);
    expect(screen.getByRole('button', { name: s.outDone }).getAttribute('aria-pressed')).toBe('false');
  });

  it('nothing at all when keeping is off, when the step is DONE, or when there is no step', async () => {
    for (const j of [
      { keeping: false, entries: (journey as { entries: unknown[] }).entries },
      { keeping: true, entries: [{ ...(journey as { entries: Record<string, unknown>[] }).entries[0], step_outcome: 'DONE' }] },
      { keeping: true, entries: [{ ...(journey as { entries: Record<string, unknown>[] }).entries[0], step: null }] },
    ]) {
      journey = j;
      const { container } = render(<StepToday />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 0));
      expect(container.querySelector('[data-testid="step-today"]')).toBeNull();
      cleanup();
    }
  });
});
