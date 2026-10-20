/**
 * Capabilities v1 (owner, 2026-10-20): after a yes to a step, Life may propose ONE thing to
 * keep — a goal with its steps, or a skill. The rules under test:
 *   • the card shows only what the AI service proposed, checked again here;
 *   • NOTHING is written without the person's tap — and Not now writes nothing;
 *   • Add writes through Life's own goal/skill routes, the steps as Life's checklist lines;
 *   • the next message clears an unanswered proposal.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { ProblemSession } from '../app/app/components/ProblemSession';
import { sessionCopy } from '@/lib/life/session-copy';
import { readProposal } from '@/lib-client/life/proposals';
import { parseSteps } from '@/lib/life/steps';

const s = sessionCopy('en');
let calls: { url: string; method: string; body: string }[] = [];
let proposal: unknown;
let addStatus = 201;
beforeEach(() => {
  calls = []; addStatus = 201;
  proposal = { kind: 'goal', title: 'Sleep before midnight', steps: ['Phone in the kitchen after 11', 'Read ten minutes in bed'] };
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    calls.push({ url, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/bff/life/talk') {
      return { ok: true, status: 200, json: async () => ({ success: true, data: { reply: 'When will you start?', ...(proposal ? { proposal } : {}) } }) } as Response;
    }
    if (url === '/api/bff/life/goals' || url === '/api/bff/life/skills') {
      return { ok: addStatus < 400, status: addStatus, json: async () => ({ success: true }) } as Response;
    }
    if (url === '/api/bff/life/journey') return { ok: true, status: 200, json: async () => ({ success: true, data: { keeping: false, entries: [] } }) } as Response;
    return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const adds = () => calls.filter((c) => (c.url === '/api/bff/life/goals' || c.url === '/api/bff/life/skills') && c.method === 'POST');
async function agree() {
  render(<ProblemSession onClose={vi.fn()} />);
  click(s.agree);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ok, I will try' } });
  click(s.send);
  await screen.findByText('When will you start?');
}

describe('Life proposes, the person decides', () => {
  it('a goal proposal shows its title and steps, and says nothing is added without a tap', async () => {
    await agree();
    expect(screen.getByText(s.pGoalQ)).toBeTruthy();
    expect(screen.getByText('Sleep before midnight')).toBeTruthy();
    expect(screen.getByText('Read ten minutes in bed')).toBeTruthy();
    expect(screen.getByText(s.pNote)).toBeTruthy();
    expect(adds()).toEqual([]);                                   // shown ≠ written
  });

  it('Add writes the goal through Life\'s own route, its steps as checklist lines', async () => {
    await agree();
    click(s.pAddGoal);
    await screen.findByText(s.pAddedGoal);
    expect(adds()).toHaveLength(1);
    const body = JSON.parse(adds()[0]!.body);
    expect(body.title).toBe('Sleep before midnight');
    expect(parseSteps(body.description)).toEqual([
      { text: 'Phone in the kitchen after 11', done: false },
      { text: 'Read ten minutes in bed', done: false },
    ]);
  });

  it('Not now drops it and writes nothing', async () => {
    await agree();
    click(s.pNo);
    await waitFor(() => expect(screen.queryByText(s.pGoalQ)).toBeNull());
    expect(adds()).toEqual([]);
  });

  it('a skill proposal adds a skill, nothing else', async () => {
    proposal = { kind: 'skill', name: 'English' };
    await agree();
    click(s.pAddSkill);
    await screen.findByText(s.pAddedSkill);
    expect(adds().map((c) => c.url)).toEqual(['/api/bff/life/skills']);
    expect(JSON.parse(adds()[0]!.body)).toEqual({ name: 'English' });
  });

  it('a failed add says so and can be tried again', async () => {
    addStatus = 503;
    await agree();
    click(s.pAddGoal);
    await screen.findByText(s.pFailed);
    expect(screen.getByRole('button', { name: s.pAddGoal })).toBeTruthy();
  });

  it('the next message clears an unanswered proposal; no proposal → no card', async () => {
    await agree();
    proposal = undefined;
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tomorrow' } });
    click(s.send);
    await waitFor(() => expect(screen.queryByText(s.pGoalQ)).toBeNull());
    expect(adds()).toEqual([]);
  });

  it('a malformed proposal shows no card', () => {
    expect(readProposal({ kind: 'goal', title: 'x'.repeat(81), steps: ['walk'] })).toBeNull();
    expect(readProposal({ kind: 'goal', title: 'Run', steps: [] })).toBeNull();
    expect(readProposal({ kind: 'delete_everything' })).toBeNull();
    expect(readProposal('goal')).toBeNull();
    expect(readProposal({ kind: 'goal', title: 'Run', steps: ['a', 'b', 'c', 'd'] })!).toMatchObject({ steps: ['a', 'b', 'c'] });
  });
});
