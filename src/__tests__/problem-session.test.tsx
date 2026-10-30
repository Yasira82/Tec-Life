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

let calls: { url: string; method: string; body: string }[] = [];
let talkStatus = 200;
let journey: unknown = { keeping: false, entries: [] };
let summary: unknown = { problem: 'You stay up late', understanding: 'It starts with scrolling after 11', step: 'Phone in the kitchen' };
beforeEach(() => {
  calls = []; talkStatus = 200;
  journey = { keeping: false, entries: [] };
  summary = { problem: 'You stay up late', understanding: 'It starts with scrolling after 11', step: 'Phone in the kitchen' };
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    calls.push({ url, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : '' });
    if (url === '/api/bff/life/journey' && (init?.method ?? 'GET') === 'GET') {
      return { ok: true, status: 200, json: async () => ({ success: true, data: journey }) } as Response;
    }
    if (url === '/api/bff/life/journey') {
      const e = JSON.parse(String(init?.body));
      return { ok: true, status: 200, json: async () => ({ success: true, data: { entry: { id: 'j9', step_outcome: null, created_at: '2026-10-17T10:00:00.000Z', ...e } } }) } as Response;
    }
    if (url === '/api/bff/life/summary') {
      return summary
        ? { ok: true, status: 200, json: async () => ({ success: true, data: { summary } }) } as Response
        : { ok: false, status: 503, json: async () => ({}) } as Response;
    }
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
const writes = () => calls.filter((c) => c.method !== 'GET');

async function converse() {
  render(<ProblemSession onClose={vi.fn()} />);
  click(s.agree);
  type(`my problem ${MARKER}`);
  click(s.send);
  await screen.findByText('I hear you. When did it last happen?');
}

describe('consent first', () => {
  it('nothing is sent before the person agrees; the AI is named, its vendor is not (owner, 2026-10-20)', () => {
    render(<ProblemSession onClose={vi.fn()} />);
    expect(screen.getByText(s.introAi)).toBeTruthy();
    expect(s.introAi).toMatch(/AI model/);
    expect(s.introAi).not.toMatch(/Groq/);
    expect(screen.getByText(s.support)).toBeTruthy();
    // The only calls before agreeing are Life reading the person's own journey and
    // kept-conversation setting from Life — reads, with no body.
    expect(writes()).toEqual([]);
    expect(calls.every((c) => ['/api/bff/life/journey', '/api/bff/life/conversations'].includes(c.url))).toBe(true);
  });

  it('"Not now" closes without sending or counting anything', () => {
    const onClose = vi.fn();
    render(<ProblemSession onClose={onClose} />);
    click(s.cancel);
    expect(onClose).toHaveBeenCalled();
    expect(writes()).toEqual([]);
  });
});

describe('the words go to one place only', () => {
  it('only the talk route carries the text; the counter carries one closed word', async () => {
    await converse();
    for (const c of calls) {
      expect(c.url).not.toContain(MARKER);
      if (c.method === 'GET') { expect(c.body).toBe(''); continue; }
      if (c.url !== '/api/bff/life/talk') {
        expect(c.body).not.toContain(MARKER);
        expect(Object.keys(JSON.parse(c.body))).toEqual(['metric']);
      }
    }
    const sent = JSON.parse(talks()[0]!.body);
    // The words and the device's clock — nothing else (awareness, owner 2026-10-30).
    expect(Object.keys(sent)).toEqual(['messages', 'clock']);
    expect(Object.keys(sent.clock).sort()).toEqual(['hour', 'today', 'weekday']);
    expect(JSON.stringify(sent.clock)).not.toContain(MARKER);
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

  it('the talk client sends to Life\'s own routes only — the reply and, on request, the summary', () => {
    const client = readFileSync(join(process.cwd(), 'src/lib-client/life/lifeTalk.ts'), 'utf8');
    expect(client.match(/fetch\(/g)?.length).toBe(2);
    expect(client).toContain("fetch('/api/bff/life/talk'");
    expect(client).toContain("fetch('/api/bff/life/summary'");
  });

  it('the journey client sends to Life\'s own routes only', () => {
    const client = readFileSync(join(process.cwd(), 'src/lib-client/life/journey.ts'), 'utf8');
    for (const m of client.matchAll(/fetch\(([^,)]+)/g)) expect(m[1]).toMatch(/^[`']\/api\/bff\/life\/(journey|consent|self)/);
  });

  it('every locale has the same keys, and none reads English in its place (owner, 2026-10-20)', () => {
    for (const l of ['ar', 'fr', 'zh'] as const) {
      expect(Object.keys(sessionCopy(l)).sort()).toEqual(Object.keys(sessionCopy('en')).sort());
      expect(sessionCopy(l).opener).not.toBe(sessionCopy('en').opener);
    }
  });
});

// ── Life memory v1: only what the person confirms is kept ─────────────────────
async function toEnd() {
  render(<ProblemSession onClose={vi.fn()} />);
  click(s.agree); type(`my problem ${MARKER}`); click(s.send);
  await screen.findByText('I hear you. When did it last happen?');
  click(s.endChat);
}
const keeps = () => calls.filter((c) => c.url === '/api/bff/life/journey' && c.method === 'POST');
const consents = () => calls.filter((c) => c.url === '/api/bff/life/consent');

describe('keeping a summary', () => {
  it('ending writes no summary and keeps nothing unless the person asks', async () => {
    await toEnd();
    await waitFor(() => expect(metrics()).toContain('s7_reached'));
    expect(calls.some((c) => c.url === '/api/bff/life/summary')).toBe(false);
    expect(keeps()).toEqual([]);
    expect(consents()).toEqual([]);
  });

  it('the person edits the summary; only the three fields are kept, and keeping is turned on by that tap', async () => {
    await toEnd();
    click(s.keepWrite);
    const problem = await screen.findByDisplayValue('You stay up late');
    fireEvent.change(problem, { target: { value: 'I stay up late on weekdays' } });
    expect(screen.getByText(s.keepConsent)).toBeTruthy();
    click(s.keepSaveOn);
    await screen.findByText(s.keepSaved);
    expect(JSON.parse(consents()[0]!.body)).toEqual({ consent: { JOURNEY: true } });
    const kept = JSON.parse(keeps()[0]!.body);
    expect(kept).toEqual({ problem: 'I stay up late on weekdays', understanding: 'It starts with scrolling after 11', step: 'Phone in the kitchen' });
    expect(keeps()[0]!.body).not.toContain(MARKER); // the conversation is not what is kept
  });

  it('already keeping → no consent call, the button says so', async () => {
    journey = { keeping: true, entries: [] };
    await toEnd();
    click(s.keepWrite);
    await screen.findByDisplayValue('You stay up late');
    expect(screen.queryByText(s.keepConsent)).toBeNull();
    click(s.keepSave);
    await screen.findByText(s.keepSaved);
    expect(consents()).toEqual([]);
  });

  it('when Life cannot write it, the person may write it; empty fields keep nothing', async () => {
    summary = null;
    await toEnd();
    click(s.keepWrite);
    await screen.findByText(s.keepSummaryFailed);
    const save = screen.getByRole('button', { name: s.keepSaveOn }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    click(s.keepSaveOn);
    expect(keeps()).toEqual([]);
  });
});

describe('continuing from the last step', () => {
  const last = { id: 'j1', problem: 'p', understanding: 'u', step: 'Phone in the kitchen', step_outcome: null, created_at: '2026-10-10T09:00:00.000Z' };

  it('asks about the last chosen step once, and records a closed answer', async () => {
    journey = { keeping: true, entries: [last] };
    render(<ProblemSession onClose={vi.fn()} />);
    await screen.findByText(s.memoryNote);
    click(s.agree);
    await screen.findByText(s.lastStepQ.replace('{step}', last.step));
    click(s.outPartly);
    await screen.findByText(s.outThanks);
    const patch = calls.find((c) => c.method === 'PATCH')!;
    expect(patch.url).toBe('/api/bff/life/journey/j1');
    expect(JSON.parse(patch.body)).toEqual({ step_outcome: 'PARTLY' });
  });

  it('keeping off → no question and no memory note, even with old entries', async () => {
    journey = { keeping: false, entries: [last] };
    render(<ProblemSession onClose={vi.fn()} />);
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    click(s.agree);
    expect(screen.queryByText(s.memoryNote)).toBeNull();
    expect(screen.queryByText(s.lastStepQ.replace('{step}', last.step))).toBeNull();
  });
});

describe('the free plan running out', () => {
  it('says Life reached its limit — not "unavailable" — and keeps the message', async () => {
    talkStatus = 503;
    const realFetch = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    realFetch.mockImplementation(async (u: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(u), method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : '' });
      if (String(u) === '/api/bff/life/talk') return { ok: false, status: 503, json: async () => ({ error: 'capacity' }) } as Response;
      return { ok: true, status: 200, json: async () => ({ success: true, data: { keeping: false, entries: [] } }) } as Response;
    });
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.agree); type('hello'); click(s.send);
    await screen.findByText(s.errCapacity);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('hello');
  });
});

describe('the conversation lasts until the person ends it', () => {
  it('goes past 24 and 40 messages without stopping', async () => {
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.agree);
    for (let i = 0; i < 25; i++) {
      type(`m${i}`); click(s.send);
      await waitFor(() => expect(talks().length).toBe(i + 1));
      await waitFor(() => expect(screen.getAllByText('I hear you. When did it last happen?').length).toBe(i + 1));
    }
    expect(screen.queryByText(s.errLimit)).toBeNull();
    expect(JSON.parse(talks().at(-1)!.body).messages).toHaveLength(50); // the page keeps it whole
  }, 30_000);
});

// ── Personal memory (owner, 2026-10-23): Life coaches from what the person kept, and says so ──
describe('personal memory', () => {
  it('the summary\'s memory fields are shown, editable, and only the filled ones are kept', async () => {
    summary = { problem: 'You stay up late', understanding: 'u', step: null, tried: 'Water and gum', helped: 'Fasting', triggers: null, reason: 'My health' };
    await toEnd();
    click(s.keepWrite);
    const tried = await screen.findByDisplayValue('Water and gum');
    expect(screen.getByText(s.fTried)).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue('My health'), { target: { value: '' } });
    fireEvent.change(tried, { target: { value: 'Water, gum, a five-minute wait' } });
    click(s.keepSaveOn);
    await screen.findByText(s.keepSaved);
    expect(JSON.parse(keeps()[0]!.body)).toEqual({
      problem: 'You stay up late', understanding: 'u', step: null, tried: 'Water, gum, a five-minute wait', helped: 'Fasting',
    });
  });

  it('in the chat, the person sees that Life coaches from their memory — and can open it', async () => {
    journey = { keeping: true, entries: [{ id: 'j1', problem: 'p', understanding: 'u', step: null, step_outcome: null, created_at: '2026-10-10T09:00:00.000Z', tried: 'water' }] };
    const onMenu = vi.fn();
    render(<ProblemSession onClose={vi.fn()} onMenu={onMenu} />);
    await waitFor(() => expect(calls.some((c) => c.url === '/api/bff/life/journey')).toBe(true));
    click(s.agree);
    expect(await screen.findByText(s.memStrip)).toBeTruthy();
    click(s.memStripEdit);
    expect(onMenu).toHaveBeenCalled();
  });

  it('no strip when nothing is kept', async () => {
    render(<ProblemSession onClose={vi.fn()} onMenu={vi.fn()} />);
    click(s.agree);
    await screen.findByText(s.rolesNote);
    expect(screen.queryByText(s.memStrip)).toBeNull();
  });
});

describe('professional memory in the summary — practice, own words, chosen feelings (owner, 2026-10-23)', () => {
  it('Life preselects a feeling the person named; the person changes it with a tap; only what is filled is kept', async () => {
    summary = { problem: 'p', understanding: 'u', step: null, practice: 'I walk after dinner', words: 'I will not go back', feeling_start: 'FRUSTRATED', feeling_end: null };
    await toEnd();
    click(s.keepWrite);
    await screen.findByDisplayValue('I walk after dinner');
    expect(screen.getByDisplayValue('I will not go back')).toBeTruthy();
    const starts = screen.getAllByRole('button', { name: s.feel.FRUSTRATED });
    expect(starts[0]!.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(starts[0]!);                                         // tap again → cleared
    fireEvent.click(screen.getAllByRole('button', { name: s.feel.HOPEFUL })[1]!);   // the end: their choice
    click(s.keepSaveOn);
    await screen.findByText(s.keepSaved);
    expect(JSON.parse(keeps()[0]!.body)).toEqual({ problem: 'p', understanding: 'u', step: null, practice: 'I walk after dinner', words: 'I will not go back', feeling_end: 'HOPEFUL' });
  });
});
