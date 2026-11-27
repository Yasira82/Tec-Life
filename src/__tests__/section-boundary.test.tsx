/**
 * One part of Life failing must not take the whole app down (owner, 27 Nov 2026). A budget answered with an
 * unexpected shape threw in Money.tsx and the app-wide boundary replaced everything with «Something went wrong».
 * Now each screen and each Home section has its own boundary: that part says it could not load and offers to try
 * again; the rest — the coach, the goals, the bottom bar — keeps working.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SectionBoundary } from '@/components/SectionBoundary';
import { uiCopy } from '@/lib/life/ui-copy';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
let fail = true;
const Bomb = () => { if (fail) throw new Error('lines is undefined'); return <p>budget ok</p>; };

describe('SectionBoundary', () => {
  it('a section that throws shows its own message; the rest of the page stays', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fail = true;
    render(<div><SectionBoundary name="budget"><Bomb /></SectionBoundary><p>the goals</p></div>);
    expect(screen.getByRole('alert').textContent).toContain(uiCopy('en').sectionFailed);
    expect(screen.getByText('the goals')).toBeTruthy();
    expect(screen.queryByText(/lines is undefined/)).toBeNull(); // no internals on the screen
  });
  it('«Try again» renders the section again — without reloading the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fail = true;
    render(<SectionBoundary name="budget"><Bomb /></SectionBoundary>);
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: uiCopy('en').tryAgain }));
    expect(screen.getByText('budget ok')).toBeTruthy();
  });
  it('the message exists in every language', () => {
    for (const l of ['en', 'ar', 'es', 'fr', 'pt', 'tr', 'ru', 'id', 'vi', 'ko', 'hi', 'zh'] as const) {
      expect(uiCopy(l).sectionFailed.trim().length).toBeGreaterThan(0);
      expect(uiCopy(l).tryAgain.trim().length).toBeGreaterThan(0);
    }
  });
});
