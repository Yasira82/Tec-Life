// The guard at the AI service's body limit still ends gracefully: one tap ends the
// conversation and writes the summary. Run with a small cap so the test is quick.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { sessionCopy } from '@/lib/life/session-copy';

vi.mock('@/lib-client/life/lifeTalk', async (orig) => ({ ...(await orig<object>()), MAX_MESSAGES: 5 }));
const { ProblemSession } = await import('../app/app/components/ProblemSession');

const s = sessionCopy('en');
const urls: string[] = [];
beforeEach(() => {
  urls.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL) => {
    urls.push(String(u));
    if (String(u) === '/api/bff/life/talk') return { ok: true, status: 200, json: async () => ({ data: { reply: 'ok' } }) } as Response;
    if (String(u) === '/api/bff/life/summary') return { ok: true, status: 200, json: async () => ({ data: { summary: { problem: 'P', understanding: 'U', step: null } } }) } as Response;
    return { ok: true, status: 200, json: async () => ({ data: { keeping: false, entries: [] } }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('at the guard', () => {
  it('refuses more, and one tap ends and writes the summary', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    for (let i = 0; i < 2; i++) {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: `m${i}` } });
      fireEvent.click(screen.getByRole('button', { name: s.send }));
      await waitFor(() => expect(screen.getAllByText('ok').length).toBe(i + 1));
    }
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'more' } });
    fireEvent.click(screen.getByRole('button', { name: s.send }));
    await screen.findByText(s.errLimit);
    fireEvent.click(screen.getByRole('button', { name: s.endAndKeep }));
    await screen.findByDisplayValue('P');
    expect(urls).toContain('/api/bff/life/summary');
  });
});
