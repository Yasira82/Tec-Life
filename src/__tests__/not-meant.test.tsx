/**
 * «مش ده قصدي» (owner, 2026-10-30). When Life misreads, the person corrects it in one tap — and in
 * their OWN new words: the tap starts the box with the phrase and asks them to say it another way.
 * The phrase in every language must be one the AI service reads as a correction
 * (tec-ai-service understand.ts CORRECTION), or the tap would read as an ordinary message.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ProblemSession } from '../app/app/components/ProblemSession';
import { sessionCopy } from '@/lib/life/session-copy';
import { LOCALES } from '@/lib/i18n/locales';

const s = sessionCopy('en');
let talks: string[] = [];
beforeEach(() => {
  talks = [];
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    if (url === '/api/bff/life/talk') {
      talks.push(String(init?.body));
      return { ok: true, status: 200, json: async () => ({ success: true, data: { reply: 'You want to drink more water.' } }) } as Response;
    }
    if (url === '/api/bff/life/journey') return { ok: true, status: 200, json: async () => ({ success: true, data: { keeping: false, entries: [] } }) } as Response;
    return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const box = () => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('«مش ده قصدي»', () => {
  it('not under the opener — only under a reply to something the person said', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    expect(screen.queryByRole('button', { name: s.notMeant })).toBeNull();
    fireEvent.change(box(), { target: { value: 'I smoke a lot and want to stop' } });
    fireEvent.click(screen.getByRole('button', { name: s.send }));
    expect(await screen.findByRole('button', { name: s.notMeant })).toBeTruthy();
  });

  it('starts the box with the phrase, asks for other words, and sends nothing by itself', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    fireEvent.change(box(), { target: { value: 'I smoke a lot and want to stop' } });
    fireEvent.click(screen.getByRole('button', { name: s.send }));
    fireEvent.click(await screen.findByRole('button', { name: s.notMeant }));
    expect(talks).toHaveLength(1);
    expect(box().value).toBe(`${s.notMeant}. `);
    expect(box().getAttribute('placeholder')).toBe(s.notMeantHint);
    expect(screen.getByRole('status').textContent).toBe(s.notMeantHint);
    expect(screen.queryByRole('button', { name: s.notMeant })).toBeNull();

    fireEvent.change(box(), { target: { value: `${box().value}I mean cigarettes, not drinks` } });
    fireEvent.click(screen.getByRole('button', { name: s.send }));
    await screen.findAllByText('You want to drink more water.');
    const sent = JSON.parse(talks[1]!).messages.at(-1);
    expect(sent).toEqual({ role: 'user', content: `${s.notMeant}. I mean cigarettes, not drinks` });
    // Back to normal after sending; the button returns under the new reply.
    expect(box().getAttribute('placeholder')).toBe(s.placeholder);
    expect(screen.getByRole('button', { name: s.notMeant })).toBeTruthy();
  });

  it('what was already typed stays, after the phrase', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: s.agree }));
    fireEvent.change(box(), { target: { value: 'hello there' } });
    fireEvent.click(screen.getByRole('button', { name: s.send }));
    const tap = await screen.findByRole('button', { name: s.notMeant });
    fireEvent.change(box(), { target: { value: 'cigarettes' } });
    fireEvent.click(tap);
    expect(box().value).toBe(`${s.notMeant}. cigarettes`);
    // The button hides once correcting; a typed phrase already at the start is never doubled.
    expect(screen.queryByRole('button', { name: s.notMeant })).toBeNull();
  });

  it('every language has the button and its hint, each in that language', () => {
    for (const { code: l } of LOCALES) {
      const c = sessionCopy(l);
      expect(c.notMeant, l).toBeTruthy();
      expect(c.notMeantHint, l).toBeTruthy();
      if (l !== 'en') expect(c.notMeant, l).not.toBe(s.notMeant);
    }
    expect(sessionCopy('ar').notMeant).toBe('مش ده قصدي');
  });
});
