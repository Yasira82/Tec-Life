/**
 * The owner's reading of whether Life helps (admin only; Tec-core-backend: GET
 * /identity/life/admin/outcomes). Counts of what people chose — nothing they wrote. Every count
 * under 5 arrives as null and reads "fewer than 5"; a person who is not an admin sees nothing.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { OutcomesReading } from '../app/app/components/OutcomesReading';
import { outcomesCopy } from '@/lib/life/outcomes-copy';

const o = outcomesCopy('en');
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const report = {
  people: 12, entries: 20,
  steps:    { chosen: 15, answered: 9, done: 6, partly: null, not_yet: null },
  daily:    { steps_followed: 5, done: 22, partly: null, not_yet: 7 },
  measures: { before_and_after: null, moved: null, unchanged: null, unknown_or_not_counted: null },
  feelings: { both_picked: 8, heavy_to_light: 6, light_to_heavy: null, same_side: null },
  came_back_after_a_week: 5,
};
const stub = (ok: boolean, data?: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => ({ data }) }) as Response));

describe('the outcomes reading', () => {
  it('asks the BFF, never the service', async () => {
    stub(true, report);
    render(<OutcomesReading />);
    await screen.findByText(o.title);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/bff/life/admin/outcomes', expect.anything());
  });

  it('shows the counts, and "fewer than 5" for a hidden one', async () => {
    stub(true, report);
    render(<OutcomesReading />);
    expect((await screen.findByText(new RegExp(`^${o.stepsDone}`))).textContent).toContain('6');
    expect(screen.getByText(new RegExp(`^${o.stepsPartly}`)).textContent).toContain(o.fewer);
    expect(screen.getByText(new RegExp(`^${o.heavyToLight}`)).textContent).toContain('6');
    expect(screen.getByText(new RegExp(`^${o.cameBack}`)).textContent).toContain('5');
  });

  it('says what the measure cannot: "moved", never "better"', async () => {
    stub(true, report);
    render(<OutcomesReading />);
    await screen.findByText(o.title);
    expect(document.body.textContent).toContain(o.movedNote);
  });

  it('a person who is not an admin sees nothing', async () => {
    stub(false);
    const { container } = render(<OutcomesReading />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe('');
  });

  it('Arabic for the owner; English for every other language', () => {
    expect(outcomesCopy('ar').title).not.toBe(o.title);
    expect(outcomesCopy('fr').title).toBe(o.title);
  });
});
