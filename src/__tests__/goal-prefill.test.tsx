/**
 * A3 — a goal proposed by TEC AI arrives in Life's Add form and is saved only
 * when the person taps Add (C-104 §10.1 · Tec-Life #74).
 *
 * Pinned: only `goal` and `target` are read, both narrowed; the form shows the
 * values with a "suggested" note; NOTHING is written before Add, and Add sends
 * the same POST as a typed goal; the reader lives inside the sign-in door, and
 * the two keys leave the URL once read.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readGoalPrefill, withoutGoalPrefill, GOAL_TITLE_MAX } from '@/lib/life/prefill';
import { Goals } from '../app/app/components/Goals';
import { GoalPrefillReader } from '../app/app/components/GoalPrefillReader';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { LOCALES } from '@/lib/i18n/locales';

const en = DICTIONARIES.en.life.goals;

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });

describe('readGoalPrefill — only the two keys, both narrowed', () => {
  it('a title, and a target when it is a plain positive amount', () => {
    expect(readGoalPrefill('?goal=Save%2010%20%CF%80&target=10')).toEqual({ title: 'Save 10 π', target: '10' });
    expect(readGoalPrefill('?goal=Learn%20Rust')).toEqual({ title: 'Learn Rust' });
    expect(readGoalPrefill('?goal=x&target=12.5')).toEqual({ title: 'x', target: '12.5' });
  });

  it('a bad target is dropped, never guessed — the title still arrives', () => {
    for (const bad of ['0', '-5', 'ten', '1e3', '1,5', '99999999999', '1.123456789', '']) {
      expect(readGoalPrefill(`?goal=Save&target=${encodeURIComponent(bad)}`)).toEqual({ title: 'Save' });
    }
  });

  it('no title, a blank title, or no query → nothing', () => {
    for (const q of ['', '?', '?target=10', '?goal=', '?goal=%20%20%0A']) expect(readGoalPrefill(q)).toBeNull();
  });

  it('whitespace collapses and a long title is truncated to the field, not refused', () => {
    expect(readGoalPrefill('?goal=a%0A%0Ab%20%20c')).toEqual({ title: 'a b c' });
    expect(readGoalPrefill(`?goal=${'x'.repeat(500)}`)?.title).toHaveLength(GOAL_TITLE_MAX);
  });

  it('other keys are ignored, and kept when the two are removed from the URL', () => {
    expect(readGoalPrefill('?goal=Save&status=DONE&id=g9&owner=bob')).toEqual({ title: 'Save' });
    expect(withoutGoalPrefill('?goal=Save&target=10&ref=ABC')).toBe('?ref=ABC');
    expect(withoutGoalPrefill('?goal=Save')).toBe('');
  });
});

describe('Goals with a prefill — nothing is saved until Add', () => {
  const stubGoals = () => {
    const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => ({
      ok: true, status: 200,
      json: async () => (init?.method === 'POST' ? { success: true, data: { goal: {} } } : { success: true, data: { goals: [] } }),
    }) as Response);
    vi.stubGlobal('fetch', f);
    return f;
  };
  const posts = (f: ReturnType<typeof stubGoals>) => f.mock.calls.filter((c) => c[1]?.method === 'POST');

  it('the fields hold the proposal, the note says so, and no write happens', async () => {
    const f = stubGoals();
    render(<Goals isPro={false} prefill={{ title: 'Save 10 π', target: '10' }} />);
    expect((screen.getByPlaceholderText(en.addPlaceholder) as HTMLInputElement).value).toBe('Save 10 π');
    expect((screen.getByPlaceholderText(en.targetPlaceholder) as HTMLInputElement).value).toBe('10');
    expect(screen.getByTestId('goal-prefill-note').textContent).toBe(en.prefill);
    await waitFor(() => expect(f).toHaveBeenCalled()); // the list read
    expect(posts(f)).toHaveLength(0);
  });

  it('Add sends the same POST as a typed goal — the edited values, owner from the session', async () => {
    const f = stubGoals();
    render(<Goals isPro={false} prefill={{ title: 'Save 10 π', target: '10' }} />);
    fireEvent.change(screen.getByPlaceholderText(en.addPlaceholder), { target: { value: 'Save 12 π' } });
    fireEvent.change(screen.getByPlaceholderText(en.targetPlaceholder), { target: { value: '12' } });
    fireEvent.click(screen.getByText(en.add));
    await waitFor(() => expect(posts(f)).toHaveLength(1));
    const [url, init] = posts(f)[0]!;
    expect(String(url)).toBe('/api/bff/life/goals');
    expect(JSON.parse(String(init?.body))).toEqual({ title: 'Save 12 π', target_amount: 12 });
    await waitFor(() => expect(screen.queryByTestId('goal-prefill-note')).toBeNull()); // the suggestion is spent
  });

  it('without a prefill the form is empty and there is no note', () => {
    stubGoals();
    render(<Goals isPro={false} />);
    expect((screen.getByPlaceholderText(en.addPlaceholder) as HTMLInputElement).value).toBe('');
    expect(screen.queryByTestId('goal-prefill-note')).toBeNull();
  });
});

describe('GoalPrefillReader — reads once, then cleans the URL', () => {
  it('hands over the proposal and removes only its two keys', () => {
    window.history.replaceState(null, '', '/app?goal=Save%2010&target=10&ref=ABC#x');
    const onPrefill = vi.fn();
    render(<GoalPrefillReader onPrefill={onPrefill} />);
    expect(onPrefill).toHaveBeenCalledWith({ title: 'Save 10', target: '10' });
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/app?ref=ABC#x');
  });

  it('a URL with nothing usable is left alone', () => {
    window.history.replaceState(null, '', '/app?ref=ABC');
    const onPrefill = vi.fn();
    render(<GoalPrefillReader onPrefill={onPrefill} />);
    expect(onPrefill).not.toHaveBeenCalled();
    expect(window.location.search).toBe('?ref=ABC');
  });
});

describe('wiring and languages', () => {
  const page = readFileSync(join(process.cwd(), 'src', 'app/app/page.tsx'), 'utf8');

  it('the reader sits INSIDE the sign-in door — a session-less visit keeps the query through the sign-in', () => {
    const gateOpen = page.indexOf('<SignInGate>');
    const reader   = page.indexOf('<GoalPrefillReader');
    const gateEnd  = page.indexOf('</SignInGate>');
    expect(gateOpen).toBeGreaterThan(-1);
    expect(reader).toBeGreaterThan(gateOpen);
    expect(reader).toBeLessThan(gateEnd);
  });

  it('a proposal opens the Goals tab with it', () => {
    expect(page).toMatch(/onPrefill=\{\(p\) => \{ setPrefill\(p\); setTab\('goals'\); \}\}/);
    expect(page).toMatch(/<Goals isPro=\{isPro\} prefill=\{prefill\}/);
  });

  it('the note exists in every locale', () => {
    for (const { code } of LOCALES) expect(DICTIONARIES[code].life.goals.prefill, code).toBeTruthy();
  });
});
