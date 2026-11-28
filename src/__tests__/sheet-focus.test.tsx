/**
 * The redesign's bottom sheet and the keyboard (owner review of the redesign chain, 28 Nov 2026):
 * focus moves in on open, stays inside while open, and returns to the opener on close.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React, { useEffect, useRef, useState } from 'react';
import { Sheet } from '../app/app/redesign/Sheet';

afterEach(cleanup);

function Harness({ autofocus = false }: { autofocus?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <button type="button">Elsewhere</button>
      {open && (
        <Sheet title="Edit" testId="t-sheet" onClose={() => setOpen(false)}>
          {autofocus ? <AutoInput /> : <input aria-label="first" />}
          <button type="button" disabled>Off</button>
          <button type="button" onClick={() => setOpen(false)}>Last</button>
          <button type="button" hidden>Hidden attr</button>
          <button type="button" style={{ display: 'none' }}>Display none</button>
          <div style={{ visibility: 'hidden' }}><button type="button">Invisible</button></div>
          <div aria-hidden="true"><button type="button">Aria hidden</button></div>
          <details><summary>More</summary><button type="button">Folded</button></details>
        </Sheet>
      )}
    </div>
  );
}
function AutoInput() {
  const r = useRef<HTMLInputElement>(null);
  useEffect(() => { r.current?.focus(); }, []);
  return <input ref={r} aria-label="first" />;
}

const tab = (shift = false) => fireEvent.keyDown(window, { key: 'Tab', shiftKey: shift });

describe('Sheet focus', () => {
  it('opening moves focus into the dialog', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus(); fireEvent.click(opener);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('a field a child focused keeps it', () => {
    render(<Harness autofocus />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(document.activeElement).toBe(screen.getByLabelText('first'));
  });

  it('Tab and Shift+Tab stay inside, skipping what is disabled', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const last = screen.getByText('More');
    last.focus(); tab();
    expect(document.activeElement).toBe(screen.getByLabelText('first'));
    tab(true);
    expect(document.activeElement).toBe(last);
    // Focus somehow outside (e.g. on the page behind) is brought back in.
    screen.getByRole('button', { name: 'Elsewhere' }).focus(); tab();
    expect(document.activeElement).toBe(screen.getByLabelText('first'));
  });

  it('Shift+Tab from outside the sheet comes back to its last control', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    screen.getByRole('button', { name: 'Elsewhere' }).focus(); tab(true);
    expect(document.activeElement).toBe(screen.getByText('More'));
  });

  it('what is hidden is never a stop: hidden, display:none, visibility:hidden, aria-hidden, inside a closed <details>', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    // The last real stop is the closed <details>' summary; Tab from it wraps to the first.
    const summary = screen.getByText('More');
    summary.focus(); tab();
    expect(document.activeElement).toBe(screen.getByLabelText('first'));
    tab(true);
    expect(document.activeElement).toBe(summary);
    // Opened, its button becomes the last stop.
    (summary.parentElement as HTMLDetailsElement).open = true;
    screen.getByLabelText('first').focus(); tab(true);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Folded' }));
  });

  it('closing (a button, Escape) returns focus to the opener', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus(); fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Last' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    opener.focus(); fireEvent.click(opener);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
