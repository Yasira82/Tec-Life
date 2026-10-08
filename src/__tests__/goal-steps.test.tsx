/**
 * A goal TEC AI proposed can come with the steps toward it (owner, 2026-10-08: "a mentor
 * that builds the person"). The steps arrive in the Add form, each removable, and are saved
 * INSIDE the goal — its description, as a checklist — only when the person taps Add.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { parseSteps, withSteps, toggleStep, cleanStep, STEP_MAX, STEP_TEXT_MAX } from '@/lib/life/steps';
import { readGoalPrefill, withoutGoalPrefill } from '@/lib/life/prefill';
import { Goals, GoalItem } from '../app/app/components/Goals';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';
import { LOCALES } from '@/lib/i18n/locales';

const en = DICTIONARIES.en.life.goals;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('the checklist inside a description', () => {
  it('reads step lines and keeps every other line as written', () => {
    const d = 'Why: freedom\n- [ ] Open a savings goal\n- [x] Put 5π aside';
    expect(parseSteps(d)).toEqual([{ text: 'Open a savings goal', done: false }, { text: 'Put 5π aside', done: true }]);
    expect(toggleStep(d, 0)).toBe('Why: freedom\n- [x] Open a savings goal\n- [x] Put 5π aside');
    expect(parseSteps(null)).toEqual([]);
    expect(parseSteps('just a note')).toEqual([]);
  });

  it('a step out of range changes nothing', () => {
    expect(toggleStep('- [ ] a', 3)).toBe('- [ ] a');
  });

  it('writes steps after the person\'s own text', () => {
    expect(withSteps('', [{ text: 'a', done: false }])).toBe('- [ ] a');
    expect(withSteps('note\n\n', [{ text: 'a', done: true }])).toBe('note\n- [x] a');
  });

  it('a step is one clean line: no checklist syntax smuggled in, capped', () => {
    expect(cleanStep('  - [x] walk\n daily ')).toBe('walk daily');
    expect(cleanStep('x'.repeat(200))).toHaveLength(STEP_TEXT_MAX);
  });
});

describe('the proposal carries steps', () => {
  it('?steps= is split on ";", cleaned, at most five', () => {
    expect(readGoalPrefill('?goal=Read%20more&steps=Pick%20a%20book;%20;20%20pages%20a%20day')).toEqual({
      title: 'Read more', steps: ['Pick a book', '20 pages a day'],
    });
    const many = Array.from({ length: 9 }, (_, i) => `s${i}`).join(';');
    expect(readGoalPrefill(`?goal=x&steps=${many}`)?.steps).toHaveLength(STEP_MAX);
    expect(withoutGoalPrefill('?goal=x&steps=a;b&ref=R')).toBe('?ref=R');
  });

  it('the form lists them, a step can be removed, and Add saves the rest inside the goal', async () => {
    const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => ({
      ok: true, status: 200,
      json: async () => (init?.method === 'POST' ? { success: true, data: { goal: {} } } : { success: true, data: { goals: [] } }),
    }) as Response);
    vi.stubGlobal('fetch', f);
    render(<Goals isPro={false} prefill={{ title: 'Read more', steps: ['Pick a book', 'Phone off at 10', '20 pages a day'] }} />);
    expect(screen.getByTestId('goal-prefill-steps').textContent).toContain('Phone off at 10');
    expect(f.mock.calls.filter((c) => c[1]?.method === 'POST')).toHaveLength(0);   // nothing before Add

    fireEvent.click(screen.getAllByLabelText(en.removeStep)[1]!);
    fireEvent.click(screen.getByText(en.add));
    await waitFor(() => expect(f.mock.calls.filter((c) => c[1]?.method === 'POST')).toHaveLength(1));
    const body = JSON.parse(String(f.mock.calls.find((c) => c[1]?.method === 'POST')![1]!.body));
    expect(body).toEqual({ title: 'Read more', description: '- [ ] Pick a book\n- [ ] 20 pages a day' });
  });
});

describe('a saved goal shows its steps and ticks them', () => {
  const goal = {
    id: 'g1', title: 'Read more', description: '- [ ] Pick a book\n- [x] 20 pages a day', status: 'ACTIVE' as const,
    target_date: null, target_amount: null, progress: 0, created_at: '', updated_at: '',
  };

  it('ticking a step sends the rewritten description', () => {
    const onSteps = vi.fn();
    render(<GoalItem goal={goal} first busy={false} onToggle={() => {}} onDelete={() => {}} onLog={() => {}} onSteps={onSteps} />);
    expect(screen.getByTestId('goal-steps-g1').textContent).toContain('1 of 2 steps');
    fireEvent.click(screen.getAllByRole('checkbox')[0]!);
    expect(onSteps).toHaveBeenCalledWith('- [x] Pick a book\n- [x] 20 pages a day');
  });

  it('a goal without steps shows no checklist', () => {
    render(<GoalItem goal={{ ...goal, description: null }} first busy={false} onToggle={() => {}} onDelete={() => {}} onLog={() => {}} />);
    expect(screen.queryByTestId('goal-steps-g1')).toBeNull();
  });

  it('the words exist in every locale', () => {
    for (const { code } of LOCALES) {
      const g = DICTIONARIES[code].life.goals;
      expect(g.steps && g.removeStep && g.stepsDone.includes('{done}') && g.stepsDone.includes('{total}'), code).toBeTruthy();
    }
  });
});
