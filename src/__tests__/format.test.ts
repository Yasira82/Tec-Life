import { describe, it, expect } from 'vitest';
import { formatTime, formatDay, formatWhen, groupByDay } from '@/lib-client/format';

// The Activity screen printed nine rows of `8/28/2026, 11:02:27 PM`. That one
// string carries three separate design failures: seconds nobody needs, a year
// repeated on every row of a list where every row is that year, and no answer
// to the only question a reader actually has — "was that today?"

const L = { today: 'Today', yesterday: 'Yesterday' };
const at = (d: Date) => d.toISOString();
const daysAgo = (n: number, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 2, 27, 0);
  return d;
};

describe('formatDay', () => {
  it('answers the question instead of posing it', () => {
    expect(formatDay(at(daysAgo(0)), 'en-US', L)).toBe('Today');
    expect(formatDay(at(daysAgo(1)), 'en-US', L)).toBe('Yesterday');
  });

  it('crosses midnight by CALENDAR day, not by 24 hours', () => {
    // 23:50 last night is "Yesterday" at 00:10, even though it was 20 minutes
    // ago. An elapsed-hours rule would call it "Today" and be wrong in the
    // only way a person would notice.
    const lateLastNight = daysAgo(1, 23);
    expect(formatDay(at(lateLastNight), 'en-US', L)).toBe('Yesterday');
  });

  it('omits the year within this year, and shows it outside', () => {
    const thisYear = formatDay(at(daysAgo(40)), 'en-GB', L);
    expect(thisYear).not.toMatch(/\d{4}/);
    const old = formatDay('2019-03-05T10:00:00.000Z', 'en-GB', L);
    expect(old).toMatch(/2019/);
  });

  it('speaks the reader’s language, not a hand-written month table', () => {
    const fr = formatDay('2026-03-05T10:00:00.000Z', 'fr-FR', { today: "Aujourd'hui", yesterday: 'Hier' });
    expect(fr.toLowerCase()).toContain('mars');
  });

  it('returns empty for an unparseable date rather than "Invalid Date"', () => {
    expect(formatDay('not a date', 'en-US', L)).toBe('');
  });
});

describe('formatTime', () => {
  it('never shows seconds', () => {
    const s = formatTime('2026-08-28T23:02:27.000Z', 'en-GB');
    expect(s).not.toContain('27');
    expect(s).toMatch(/\d/);
  });

  it('follows the phone’s clock convention', () => {
    expect(formatTime('2026-08-28T23:02:00.000Z', 'en-US')).toMatch(/[AP]M/i);
    expect(formatTime('2026-08-28T23:02:00.000Z', 'en-GB')).not.toMatch(/[AP]M/i);
  });
});

describe('formatWhen', () => {
  it('is one line, day first', () => {
    const s = formatWhen(at(daysAgo(0)), 'en-GB', L);
    expect(s.startsWith('Today · ')).toBe(true);
  });
});

describe('groupByDay', () => {
  const row = (iso: string, id: string) => ({ iso, id });

  it('buckets consecutive rows from the same day together', () => {
    const rows = [
      row(at(daysAgo(0, 23)), 'a'),
      row(at(daysAgo(0, 15)), 'b'),
      row(at(daysAgo(1, 15)), 'c'),
    ];
    const days = groupByDay(rows, (r) => r.iso);
    expect(days).toHaveLength(2);
    expect(days[0]?.rows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(days[1]?.rows.map((r) => r.id)).toEqual(['c']);
  });

  it('preserves the order it was given — the server decided that', () => {
    const rows = [row(at(daysAgo(2)), 'x'), row(at(daysAgo(0)), 'y')];
    expect(groupByDay(rows, (r) => r.iso).map((d) => d.rows[0]?.id)).toEqual(['x', 'y']);
  });

  it('keeps a row whose date it cannot read', () => {
    // A row we cannot place is still a row that happened. Dropping it would
    // make the list quietly disagree with the count above it.
    const days = groupByDay([row('garbage', 'z')], (r) => r.iso);
    expect(days).toHaveLength(1);
    expect(days[0]?.rows[0]?.id).toBe('z');
  });

  it('is empty for an empty list', () => {
    expect(groupByDay([], (r: { iso: string }) => r.iso)).toEqual([]);
  });
});
