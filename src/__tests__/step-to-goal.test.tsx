/**
 * One tap from a step to a goal (owner, 2026-10-18 — after "before and after" v1).
 * Pinned: the tap saves NOTHING; the Goals tab opens with the step in the Add field,
 * editable, under a note that says where it came from; Add is the same POST as a typed
 * goal; a summary with no step offers no button. Goals are not redesigned.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { JourneyView } from '../app/app/components/JourneyView';
import { Goals } from '../app/app/components/Goals';
import { sessionCopy } from '@/lib/life/session-copy';
import { stepAsGoal, GOAL_TITLE_MAX } from '@/lib/life/prefill';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

const s = sessionCopy('en');
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) } as Response);
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('stepAsGoal', () => {
  it('one line, at the field\'s limit, marked as from the journey', () => {
    expect(stepAsGoal('  Walk\n ten minutes  ')).toEqual({ title: 'Walk ten minutes', from: 'journey' });
    expect(stepAsGoal('x'.repeat(500))?.title).toHaveLength(GOAL_TITLE_MAX);
    expect(stepAsGoal('  ')).toBeNull();
  });
});

describe('My journey → Make it a goal', () => {
  const entries = [
    { id: 'j1', problem: 'Smoking', understanding: 'u', step: 'Set a quit date this week', step_outcome: null, created_at: '2026-10-18T09:00:00.000Z' },
    { id: 'j2', problem: 'Late nights', understanding: 'u', step: null, step_outcome: null, created_at: '2026-10-17T09:00:00.000Z' },
  ];
  const stub = () => {
    const f = vi.fn(async (u: RequestInfo | URL, _init?: RequestInit) => String(u) === '/api/bff/life/journey'
      ? ok({ keeping: true, entries }) : ok({ keeping: false, configured: false, conversations: [] }));
    vi.stubGlobal('fetch', f);
    return f;
  };

  it('hands the step over and writes nothing', async () => {
    const f = stub(); const onMakeGoal = vi.fn();
    render(<JourneyView onMakeGoal={onMakeGoal} />);
    fireEvent.click(await screen.findByRole('button', { name: /Smoking/ }));
    fireEvent.click(screen.getByRole('button', { name: s.jMakeGoal }));
    expect(onMakeGoal).toHaveBeenCalledWith('Set a quit date this week');
    expect(f.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET')).toEqual([]);
  });

  it('a summary with no step offers no button', async () => {
    stub();
    render(<JourneyView onMakeGoal={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Late nights/ }));
    expect(screen.queryByRole('button', { name: s.jMakeGoal })).toBeNull();
  });
});

describe('Goals opened from a step', () => {
  it('shows the step in the Add field with its own note; Add is the usual POST', async () => {
    const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'POST' ? ok({ goal: {} }) : ok({ goals: [] }));
    vi.stubGlobal('fetch', f);
    render(<Goals isPro={false} prefill={stepAsGoal('Set a quit date this week')} />);
    expect(await screen.findByDisplayValue('Set a quit date this week')).toBeTruthy();
    expect(screen.getByTestId('goal-prefill-note').textContent).toBe(s.jGoalNote);
    expect(screen.getByTestId('goal-prefill-note').textContent).not.toBe(DICTIONARIES.en.life.goals.prefill);
    expect(f.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
    // a habit, not a sum: no π target field, and none is sent
    expect(screen.queryByPlaceholderText(DICTIONARIES.en.life.goals.targetPlaceholder)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: DICTIONARIES.en.life.goals.add }));
    await waitFor(() => expect(f.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
    const post = f.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(String(post[0])).toBe('/api/bff/life/goals');
    expect(JSON.parse(String(post[1]!.body)).title).toBe('Set a quit date this week');
    expect(JSON.parse(String(post[1]!.body))).not.toHaveProperty('target_amount');
  });
});
