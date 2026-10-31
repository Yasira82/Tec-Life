/**
 * «مستقبلي» — my future (owner, 2026-10-31): the one-year vision, the life areas chosen, and the
 * area each goal serves. The person's own words or a choice from a closed list; nothing inferred.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Future } from '../app/app/components/Future';
import { parseFuture } from '@/lib/life/future';
import { futureCopy, LIFE_AREAS } from '@/lib/life/future-copy';
import { buildAwareness } from '@/lib/life/awareness';
import { LOCALES } from '@/lib/i18n/locales';

const f = futureCopy('en');
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('the words', () => {
  it('every language names the six areas and every label, none left in English but English', () => {
    for (const { code } of LOCALES) {
      const c = futureCopy(code);
      for (const a of LIFE_AREAS) expect(c.area[a], `${code}/${a}`).toBeTruthy();
      for (const v of Object.values(c).filter((x) => typeof x === 'string')) expect(v, code).toBeTruthy();
      if (code !== 'en') expect(c.visionLabel, code).not.toBe(f.visionLabel);
    }
    expect(futureCopy('ar').title).toBe('مستقبلي');
  });
});

describe('reading it', () => {
  it('only what is well-formed: an unknown area is dropped, an empty vision is none', () => {
    expect(parseFuture({ vision: 'أكون أهدى', areas: [{ area: 'HEALTH', note: 'أنام بدري' }, { area: 'HOBBIES' }, { area: 'FAITH', note: '  ' }] }))
      .toEqual({ vision: 'أكون أهدى', areas: [{ area: 'HEALTH', note: 'أنام بدري' }, { area: 'FAITH', note: null }] });
    expect(parseFuture({ vision: '   ', areas: 'x' })).toEqual({ vision: null, areas: [] });
    expect(parseFuture(null)).toBeNull();
  });

  it('the coach is told the vision and the areas, with the rest of where their life is now', () => {
    const a = buildAwareness({ entries: [], goals: [], clock: null, future: { vision: 'أكون أهدى', areas: [{ area: 'FAMILY', note: null }] } });
    expect(a).toEqual({ vision: 'أكون أهدى', areas: [{ area: 'FAMILY', note: null }] });
    expect(buildAwareness({ entries: [], goals: [], clock: null, future: { vision: null, areas: [] } })).toBeNull();
  });
});

describe('the card', () => {
  const put = (impl: (url: string, body: unknown) => unknown) => {
    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      calls.push({ url: String(u), body });
      return { ok: true, status: 200, json: async () => ({ data: impl(String(u), body) }) } as Response;
    }));
    return calls;
  };

  it('nothing written yet: says one sentence is enough; writing it sends only the sentence', async () => {
    const calls = put((_, b) => ({ vision: (b as { statement: string }).statement, areas: [] }));
    const onChange = vi.fn();
    render(<Future future={{ vision: null, areas: [] }} onChange={onChange} />);
    expect(screen.getByText(f.visionEmpty)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: f.edit })[0]!);
    fireEvent.change(screen.getByLabelText(f.visionLabel), { target: { value: '  A calmer father, healthier  ' } });
    fireEvent.click(screen.getByRole('button', { name: f.save }));
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ vision: 'A calmer father, healthier', areas: [] }));
    expect(calls).toEqual([{ url: '/api/bff/life/future/vision', body: { statement: 'A calmer father, healthier' } }]);
  });

  it('areas: tap to choose, a line each if they like; the whole set is sent in the fixed order', async () => {
    const calls = put((_, b) => ({ vision: null, areas: (b as { areas: unknown }).areas }));
    render(<Future future={{ vision: null, areas: [{ area: 'FAITH', note: null }] }} onChange={() => undefined} />);
    fireEvent.click(screen.getAllByRole('button', { name: f.edit })[1]!);
    expect(screen.getByRole('button', { name: f.area.FAITH }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: f.area.HEALTH }));
    fireEvent.change(screen.getAllByPlaceholderText(f.notePh)[0]!, { target: { value: 'Walk every day' } });
    fireEvent.click(screen.getByRole('button', { name: f.save }));
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({ url: '/api/bff/life/future/areas', body: { areas: [{ area: 'HEALTH', note: 'Walk every day' }, { area: 'FAITH', note: null }] } });
  });

  it('a failed save says so and keeps the card as it was', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response));
    const onChange = vi.fn();
    render(<Future future={{ vision: 'Calm', areas: [] }} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: f.edit })[0]!);
    fireEvent.click(screen.getByRole('button', { name: f.save }));
    expect(await screen.findByText(f.failed)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('the owner\'s phone, 2026-10-31', () => {
  it('opening the editor brings Save into view above the bottom bar', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<Future future={{ vision: null, areas: [] }} onChange={() => undefined} />);
    fireEvent.click(screen.getAllByRole('button', { name: f.edit })[1]!);
    await vi.waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' }));
    expect((screen.getByTestId('future-actions') as HTMLElement).style.scrollMarginBottom).toBe('130px');
  });
});
