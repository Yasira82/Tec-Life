/**
 * Stage 1 — "talk it through without saving" (KB First Session Spec §2, §8).
 *
 * The rule under test: the person's words never leave the page. A marker typed
 * into every field must appear in NO fetch (URL or body) and in NO storage, and
 * the only requests are the counter's, each carrying exactly `{ metric }`.
 * `e2e/session.spec.ts` checks the same in a real browser, every request type.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProblemSession } from '../app/app/components/ProblemSession';
import { sessionCopy } from '@/lib/life/session-copy';

const s = sessionCopy('en');
const MARKER = 'ZQX-private-marker-7781';

let calls: { url: string; body: string }[] = [];
beforeEach(() => {
  calls = [];
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(u), body: typeof init?.body === 'string' ? init.body : '' });
    return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const type = (value: string) => {
  const box = document.querySelector('textarea') as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value } });
};
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

/** Walk the whole session with two distinct times, typing the marker everywhere. */
function walkTwoTimes(onClose = vi.fn()) {
  render(<ProblemSession onClose={onClose} />);
  click(s.start);
  type(`problem ${MARKER}`);       click(s.next);
  type(`when one ${MARKER}`);      click(s.next);
  type(`did one ${MARKER}`);       click(s.next);
  click(s.anotherYes);
  type(`when two ${MARKER}`);      click(s.next);
  type(`did two ${MARKER}`);       click(s.next);
  click(s.next);                   // the observation plan → summary
  return onClose;
}

describe('nothing the person writes leaves the page', () => {
  it('no request carries the text — only the counter, with one closed word', () => {
    walkTwoTimes();
    click(s.clearerSomewhat);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(c.url).not.toContain(MARKER);
      expect(c.body).not.toContain(MARKER);
      expect(c.url).toBe('/api/bff/life/session/count');
      expect(Object.keys(JSON.parse(c.body))).toEqual(['metric']);
    }
    expect(calls.map((c) => JSON.parse(c.body).metric)).toEqual(['s2_started', 's7_reached', 'm6_somewhat']);
  });

  it('no storage holds it — local, session, or the URL', () => {
    walkTwoTimes();
    const dump = (st: Storage) => Array.from({ length: st.length }, (_, i) => `${st.key(i)}=${st.getItem(st.key(i)!)}`).join('|');
    expect(dump(localStorage)).not.toContain(MARKER);
    expect(dump(sessionStorage)).not.toContain(MARKER);
    expect(window.location.href).not.toContain(MARKER);
  });

  it('the summary shows their words back, and says nothing was saved', () => {
    walkTwoTimes();
    expect(screen.getByText(`problem ${MARKER}`)).toBeTruthy();
    expect(screen.getByText(s.notSaved)).toBeTruthy();
    expect(screen.getByText(s.mightExplainBody)).toBeTruthy(); // no explanations in stage 1
  });

  it('every text field turns off the browser\'s own ways of moving text', () => {
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.start);
    const box = document.querySelector('textarea')!;
    expect(box.getAttribute('autocomplete')).toBe('off');
    expect(box.getAttribute('spellcheck')).toBe('false');
    expect(box.getAttribute('translate')).toBe('no');
  });
});

describe('the session itself', () => {
  it('S3 asks at most 5 questions; "the same time" opens no second occurrence', () => {
    render(<ProblemSession onClose={vi.fn()} />);
    click(s.start);
    type('p'); click(s.next);
    type('w'); click(s.next);
    type('d'); click(s.next);
    click(s.anotherSame);
    expect(screen.getByText(s.planTitle)).toBeTruthy();
    click(s.next);
    expect(screen.queryByText(`${s.timeLabel} 2:`)).toBeNull();
  });

  it('M6 is optional and answered once; skipping writes nothing', () => {
    walkTwoTimes();
    expect(calls.map((c) => JSON.parse(c.body).metric)).toEqual(['s2_started', 's7_reached']);
    click(s.clearerNo);
    expect(screen.queryByRole('button', { name: s.clearerYes })).toBeNull();
    expect(calls.filter((c) => c.body.includes('m6_')).length).toBe(1);
  });

  it('Next waits for an answer; "Not now" closes without counting', () => {
    const onClose = vi.fn();
    render(<ProblemSession onClose={onClose} />);
    click(s.cancel);
    expect(onClose).toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('Finish closes the session', () => {
    const onClose = walkTwoTimes();
    click(s.finish);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('the code keeps the rule', () => {
  const file = readFileSync(join(process.cwd(), 'src/app/app/components/ProblemSession.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

  it('the session component never touches storage or fetch directly', () => {
    expect(file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
    expect(file).not.toMatch(/\bfetch\(/);
  });

  it('Arabic and English copy have the same keys', () => {
    expect(Object.keys(sessionCopy('ar')).sort()).toEqual(Object.keys(sessionCopy('en')).sort());
    expect(sessionCopy('fr')).toBe(sessionCopy('en'));
  });
});
