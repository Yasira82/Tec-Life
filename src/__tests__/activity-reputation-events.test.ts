import { describe, it, expect } from 'vitest';
import { uiCopy } from '@/lib/life/ui-copy';
import { LOCALES } from '@/lib/i18n/locales';
import { prettyType } from '@/app/app/components/Activity';

// 27 Nov 2026: Analytics now shows a person the reputation events recorded under their Pi username (an Epic
// project completed, a Zone badge) — before, their timeline held little more than «Joined TEC». They arrive
// as their stream names; each needs a name in the reader's language, never «epic · project · completed · v1».
const NEW = ['epic.project.completed.v1', 'zone.badge.issued.v1', 'connection.milestone.v1'] as const;

describe('the reputation events in the timeline', () => {
  it.each(LOCALES.map((l) => l.code))('%s names both, never the raw stream name', (code) => {
    const ev = uiCopy(code).ev as Record<string, string>;
    for (const t of NEW) {
      expect(ev[t], `${code} ${t}`).toBeTruthy();
      expect(prettyType(t, ev)).not.toMatch(/v1|·/);
    }
  });

  it('English and Arabic say what happened', () => {
    expect(uiCopy('en').ev['epic.project.completed.v1']).toBe('Completed an Epic project');
    expect(uiCopy('en').ev['zone.badge.issued.v1']).toBe('Earned a Zone verification badge');
    expect(uiCopy('ar').ev['epic.project.completed.v1']).toMatch(/Epic/);
    expect(uiCopy('ar').ev['zone.badge.issued.v1']).toMatch(/Zone/);
    // Connection's trust milestone (tec-core-backend #547): 5, 25, 100 different buyers who paid.
    expect(uiCopy('en').ev['connection.milestone.v1']).toBe('Reached a trust milestone: more people bought from you');
    expect(uiCopy('ar').ev['connection.milestone.v1']).toMatch(/ثقة/);
  });
});
