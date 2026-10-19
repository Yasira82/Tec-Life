/**
 * The Goals screen speaks the person's language (owner, 2026-10-19: "Goal insights",
 * ARCHIVED, REACHED, COMPLETION, Log were English on the Arabic screen).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { LocaleProvider } from '@/lib/i18n';
import { LifeInsights } from '../app/app/components/LifeInsights';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

const ar = DICTIONARIES.ar.life.goals;
beforeEach(() => { localStorage.setItem('tec_locale', 'ar'); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('Goal insights in Arabic', () => {
  it('title, labels and funding line come from the dictionary', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({
      pro: true, insights: { total: 3, byStatus: { ARCHIVED: 0 }, completionRate: 86, trackers: 2, reached: 1, funding: { targetSum: 128, progressSum: 108, pct: 84 } },
    }) }) as Response));
    render(<LocaleProvider><LifeInsights /></LocaleProvider>);
    expect(await screen.findByText(ar.insights)).toBeTruthy();
    for (const label of [ar.completion, ar.reachedLabel, ar.archived, ar.funding]) expect(screen.getByText(label)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Goal insights|Completion|Reached|Archived|Funding/);
  });

  it('no English left hard-coded in the two components', () => {
    const src = ['LifeInsights', 'Goals'].map((f) => readFileSync(`src/app/app/components/${f}.tsx`, 'utf8')).join('\n');
    for (const s of ['>Goal insights<', "'Completion'", "'Reached'", "'Archived'", 'Funding toward targets', '"+ π amount"', '>\n                Log', 'Free plan is limited', 'title="Delete"']) {
      expect(src).not.toContain(s);
    }
  });
});
