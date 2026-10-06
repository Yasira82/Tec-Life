/**
 * "Ask TEC AI" on a goal (C-106 §10 Phase 2 — life coaching, the honest version).
 *
 * Life does not grow an AI surface: the question goes to the Hub assistant's
 * composer via `?q=` (C-104 §5.6 — a third AI surface drifts), and the answer
 * draws only on the Life context the person has consented to share (§5).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES } from '@/lib/i18n/locales';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

const src = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8');

describe('a goal can be asked about in the Hub assistant', () => {
  const goals = src('app/app/components/Goals.tsx');

  it('links to the Hub /ai page with the question in ?q=, URL-encoded', () => {
    expect(goals).toMatch(/\/ai\?q=\$\{encodeURIComponent\(question\)\}/);
    expect(goals).toContain("t.life.goals.askAiQuestion.replace('{title}', goal.title)");
  });

  it('only an ACTIVE goal offers it — a closed goal has nothing to ask', () => {
    expect(goals).toMatch(/goal\.status === 'ACTIVE' && \(\s*<a href=\{askAi\}/);
  });

  it('Life renders no assistant of its own', () => {
    for (const f of ['app/app/components/Goals.tsx', 'app/app/page.tsx']) {
      expect(src(f)).not.toMatch(/api\/ai\/chat|AiClient|AIDrawer/);
    }
  });

  it('every language has the label and a question with the {title} slot', () => {
    for (const l of LOCALES) {
      const g = DICTIONARIES[l.code].life.goals;
      expect(g.askAi, `${l.code}.askAi`).toBeTruthy();
      expect(g.askAiQuestion, `${l.code}.askAiQuestion`).toContain('{title}');
    }
  });
});
