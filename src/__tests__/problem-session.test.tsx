/**
 * Life's conversation — nothing saved (KB First Session Spec §2, §5, §8).
 *
 * The rules under test:
 *   • nothing is sent before the person agrees;
 *   • their words go to ONE place — Life's own talk route — and appear in no other
 *     request and in no storage;
 *   • the counter carries one closed word, never text;
 *   • a failed reply gives the message back instead of losing it.
 * `e2e/session.spec.ts` checks the same in a real browser, every request type.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProblemSession } from '../app/app/components/ProblemSession';
import { sessionCopy } from '@/lib/life/session-copy';

const s = sessionCopy('en');
const MARKER = 'ZQX-private-marker-7781';

let calls: { url: string; body: string }[] = [];
let talkStatus = 200;
beforeEach(() => {
  calls = []; talkStatus = 200;
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    calls.push({ url, body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/bff/life/talk') {
      return { ok: talkStatus < 400, status: talkStatus, json: async () => ({ success: true, data: { reply: 'I hear you. When did it last happen?' } }) } as Response;
    }
    return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const type = (value: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value } });
const metrics = () => calls.filter((c) => c.url.endsWith('/session/count')).map((c) => JSON.parse(c.body).metric);
const talks = () => calls.filter((c) => c.url === '/api/bff/life/talk');

async function converse() {
  render(<ProblemSession onClose={vi.fn()} />);
  click(s.agree);
  type(`my problem ${MARKER}`);
  click(s.send);
  await screen.findByText('I hear you. When did it last happen?');
}

describe('consent first', () => {
  it('nothing is sent before the person agrees, and the AI and Groq are named', () => {
    render(<ProblemSession onClose={vi.fn()} />);
    expect(screen.getByText(s.introAi)).toBeTruthy();
    expect(s.introAi).toMatch(/Groq/);
    expect(screen.getByText(s.support)).toBeTruthy();
    expect(calls).toEqual([]);
  });

  it('"Not now" closes without sending or counting anything', () => {
    const onClose = vi.fn();
    render(<ProblemSession onClose={onClose} />);
    click(s.cancel);
    expect(onClose).toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});

describe('the words go to one place only', () => {
  it('only the talk route carries the text; the counter carries one closed word', async () => {
    await converse();
    for (const c of calls) {
      expect(c.url).not.toContain(MARKER);
      if (c.url !== '/api/bff/life/talk') {
        expect(c.body).not.toContain(MARKER);
        expect(Object.keys(JSON.parse(c.body))).toEqual(['metric']);
      }
    }
    const sent = JSON.parse(talks()[0]!.body);
    expect(Object.keys(sent)).toEqual(['messages']);
    expect(sent.messages[0]).toEqual({ role: 'assistant', content: s.opener });
    expect(sent.messages.at(-1)).toEqual({ role: 'user', content: `my problem ${MARKER}` });
    expect(metrics()).toEqual(['s2_started']);
  });

  it('no storage holds it — local, session, or the URL', async () => {
    await converse();
    const dump = (st: Storage) => Array.from({ length: st.length }, (_, i) => `${st.key(i)}=${st.getItem(st.key(i)!)}`).join('|');
    expect(dump(localStorage)).not.toContain(MARKER);
    expect(dump(sessionStorage)).not.toContain(MARKER);
    expect(window.location.href).not.toContain(MARKER);
  });

  it('the text field turns off the browser\'s own ways of moving text', () => {
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.agree);
    const box = screen.getByRole('textbox');
    expect(box.getAttribute('autocomplete')).toBe('off');
    expect(box.getAttribute('spellcheck')).toBe('false');
    expect(box.getAttribute('translate')).toBe('no');
  });
});

describe('the conversation', () => {
  it('a failed reply gives the message back and says so — nothing is lost', async () => {
    talkStatus = 503;
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.agree);
    type('hello');
    click(s.send);
    await screen.findByText(s.errUnavailable);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('hello');
  });

  it('too many messages is said plainly', async () => {
    talkStatus = 429;
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.agree); type('hello'); click(s.send);
    await screen.findByText(s.errBusy);
  });

  it('ending counts the close once; M6 is optional and answered once; Finish closes', async () => {
    const onClose = vi.fn();
    render(<ProblemSession onClose={onClose} />);
    click(s.agree); type('hello'); click(s.send);
    await screen.findByText('I hear you. When did it last happen?');
    click(s.endChat);
    await waitFor(() => expect(metrics()).toEqual(['s2_started', 's7_reached']));
    expect(screen.getByText(s.notSaved)).toBeTruthy();
    expect(screen.getByText(s.support)).toBeTruthy();
    click(s.clearerSomewhat);
    expect(screen.queryByRole('button', { name: s.clearerYes })).toBeNull();
    expect(metrics()).toEqual(['s2_started', 's7_reached', 'm6_somewhat']);
    click(s.finish);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('the code keeps the rule', () => {
  const file = readFileSync(join(process.cwd(), 'src/app/app/components/ProblemSession.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

  it('the component never touches storage or fetch directly — its one door is talk()', () => {
    expect(file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
    expect(file).not.toMatch(/\bfetch\(/);
  });

  it('the talk client sends to Life\'s own route only', () => {
    const client = readFileSync(join(process.cwd(), 'src/lib-client/life/lifeTalk.ts'), 'utf8');
    expect(client.match(/fetch\(/g)?.length).toBe(1);
    expect(client).toContain("fetch('/api/bff/life/talk'");
  });

  it('Arabic and English copy have the same keys; other locales read English', () => {
    expect(Object.keys(sessionCopy('ar')).sort()).toEqual(Object.keys(sessionCopy('en')).sort());
    expect(sessionCopy('fr')).toBe(sessionCopy('en'));
  });
});
