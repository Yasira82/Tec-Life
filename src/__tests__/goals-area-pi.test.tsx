/**
 * «هو لازم بتحط باي؟» (owner, 2026-10-31): no — the π target is optional, and it is asked only for a
 * money goal: with no area, or with the money area. A health or faith goal is never asked for π.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Goals } from '../app/app/components/Goals';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

const g = DICTIONARIES.en.life.goals;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('the π field shows with no area or money, and hides for any other area', async () => {
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL) => {
    const url = String(u);
    const data = url.endsWith('/life/future') ? { vision: null, areas: [{ area: 'HEALTH', note: null }, { area: 'MONEY', note: null }] } : { goals: [] };
    return { ok: true, status: 200, json: async () => ({ data }) } as Response;
  }));
  render(<Goals isPro={false} />);
  const select = await screen.findByTestId('goal-new-area');
  expect(screen.queryByPlaceholderText(g.targetPlaceholder)).toBeTruthy();
  fireEvent.change(select, { target: { value: 'HEALTH' } });
  expect(screen.queryByPlaceholderText(g.targetPlaceholder)).toBeNull();
  fireEvent.change(select, { target: { value: 'MONEY' } });
  expect(screen.queryByPlaceholderText(g.targetPlaceholder)).toBeTruthy();
});
