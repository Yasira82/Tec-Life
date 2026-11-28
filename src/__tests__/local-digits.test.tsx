/**
 * Digits follow the screen's language (owner, 28 Nov 2026): Arabic screens show ٠-٩ everywhere,
 * English keeps 0-9 — never a mix of «٣ أشهر» beside «8». A person's own words are never changed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { LocaleProvider } from '@/lib/i18n';
import { localDigits } from '@/lib/life/digits';
import { fill } from '@/lib/life/today-copy';
import { parseAmount, TARGET_MAX } from '@/lib/life/amount';
import { MirrorView } from '../app/app/redesign/mirror/MirrorView';
import { localDayKey, shiftDay } from '@/lib/life/step-week';

describe('localDigits', () => {
  it('Arabic: Arabic-Indic digits and the Arabic decimal point', () => {
    expect(localDigits('ar', 8)).toBe('٨');
    expect(localDigits('ar', 1234567890)).toBe('١٢٣٤٥٦٧٨٩٠');
    expect(localDigits('ar', 2.5)).toBe('٢٫٥');
    expect(localDigits('ar', 'هذا الأسبوع: قمت بها 3 أيام.')).toBe('هذا الأسبوع: قمت بها ٣ أيام.');
    expect(localDigits('ar', 'Life Pro.')).toBe('Life Pro.');   // a full stop after a word is not a decimal point
  });

  it('every other language: unchanged', () => {
    for (const l of ['en', 'es', 'fr', 'hi', 'zh'] as const) {
      expect(localDigits(l, 2.5)).toBe('2.5');
      expect(localDigits(l, 'Week 3')).toBe('Week 3');
    }
  });

  it('what is shown in Arabic reads back as the same amount', () => {
    for (const v of [5, 2.5, 0.25, 999999999.123456]) {
      expect(parseAmount(localDigits('ar', v), TARGET_MAX)).toEqual({ ok: true, value: v });
    }
  });

  it('fill: numbers take the screen’s digits, a person’s words do not', () => {
    expect(fill('{n} على الأقل', { n: 500 }, 'ar')).toBe('٥٠٠ على الأقل');
    expect(fill('عن «{t}»', { t: 'وفّر 2π' }, 'ar')).toBe('عن «وفّر 2π»');
    expect(fill('{n} at least', { n: 500 }, 'en')).toBe('500 at least');
    expect(fill('{n} at least', { n: 500 })).toBe('500 at least');   // no locale: as before
  });
});

describe('My mirror — digits on screen', () => {
  const TODAY = localDayKey();
  const at = (n: number) => new Date(`${shiftDay(TODAY, -n)}T12:00:00`).toISOString();
  const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
  const entries = Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, problem: `topic 12 ${i}`, understanding: 'u', step: null, step_outcome: null, created_at: at(i) }));

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL) => {
      const url = String(u);
      if (url.startsWith('/api/bff/life/journey')) return ok({ keeping: true, entries });
      return ok({ trajectory: { window_days: 7, entries: 2, active_days: 2, pi_logged: 0, pi_per_week: 0, first_entry_at: null, completed_in_window: 3, projectable: false, goals: [] } });
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

  it('Arabic: every count is ٠-٩, none is 0-9', async () => {
    localStorage.setItem('tec_locale', 'ar');
    render(<LocaleProvider><MirrorView onTalk={vi.fn()} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByTestId('stat-progress-days').textContent).toContain('٢'));
    await waitFor(() => expect(screen.getByTestId('stat-summaries').textContent).toContain('٧'));
    for (const id of ['stat-progress-days', 'stat-goals-done', 'stat-summaries', 'stat-step-days']) {
      expect(screen.getByTestId(id).textContent).not.toMatch(/[0-9]/);
    }
    expect(screen.getByTestId('stat-goals-done').textContent).toContain('٣');
    // The evidence rule's lines («على مدى ١٤ يومًا أو أكثر (لديك ٦)») — fixed copy and counts only.
    const learned = screen.getByTestId('mirror-learned').textContent!;
    expect(learned).toMatch(/[٠-٩]/);
    expect(learned).not.toMatch(/[0-9]/);
  });

  it('English: 0-9, and no Arabic-Indic digit anywhere', async () => {
    localStorage.setItem('tec_locale', 'en');
    render(<LocaleProvider><MirrorView onTalk={vi.fn()} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByTestId('stat-summaries').textContent).toContain('7'));
    expect(screen.getByTestId('stat-progress-days').textContent).toContain('2');
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
