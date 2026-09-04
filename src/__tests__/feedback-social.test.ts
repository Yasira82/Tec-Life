import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOCIAL, activeSocial } from '@/lib/social';

const src = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8');

describe('a link that opens nothing is worse than no link', () => {
  it('the filter still works when everything IS configured', () => {
    // A social icon that goes nowhere tells a user the product is abandoned,
    // and that is a reasonable inference for them to draw. All five are filled
    // in now, so this asserts the RULE rather than the current roster — the
    // guard has to survive the next empty handle, not just today's list.
    expect(activeSocial().every((s) => s.href !== '')).toBe(true);
    expect(activeSocial().length).toBe(SOCIAL.filter((s) => s.href !== '').length);
  });

  it('only https survives — a placeholder is treated as absent', () => {
    // The C_HUB_URL incident (July 2026): a placeholder that LOOKED like a
    // value became a live redirect target and 404'd for every user.
    expect(activeSocial().every((s) => s.href.startsWith('https://'))).toBe(true);
  });

  it('renders nothing at all when none are configured', () => {
    const c = src('components/social/SocialLinks.tsx');
    expect(c).toMatch(/links\.length === 0.*return null/s);
  });

  it('every outbound link carries noopener AND noreferrer', () => {
    // noopener stops the opened page reaching window.opener; noreferrer stops
    // our URL leaking to the third party. They are different protections.
    const c = src('components/social/SocialLinks.tsx');
    expect(c).toContain('noopener noreferrer');
  });

  it('every icon-only link has an accessible name', () => {
    // Without it a screen reader announces five empty links.
    const c = src('components/social/SocialLinks.tsx');
    expect(c).toContain('aria-label={s.label}');
  });

  it('the marks follow the theme — currentColor, never a brand hex', () => {
    // A hex literal in an inline style is decided at render and cannot follow
    // the theme (C-83 §5.5).
    const c = src('components/social/SocialLinks.tsx');
    expect(c).toContain('stroke="currentColor"');
    expect(c).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});

describe('the feedback form never refuses in silence', () => {
  const c = src('components/feedback/FeedbackCard.tsx');

  it('the send button is not disabled on invalid input', () => {
    // This app already shipped that bug once on Skills: a disabled button is
    // the one form of validation a person cannot read.
    expect(c).not.toMatch(/disabled=\{!ready\}/);
    expect(c).toContain("disabled={state === 'sending'}");
  });

  it('an invalid submit sets an explanation instead', () => {
    expect(c).toMatch(/if \(!ready\)[\s\S]*setError/);
  });

  it('prefers the SERVER’s message when it has one', () => {
    // The hourly rate limit is a rule the client cannot see, so inventing a
    // generic failure there would hide the only useful sentence.
    expect(c).toMatch(/data\?\.message \|\| data\?\.error/);
  });

  it('tells the user what is attached BEFORE they type', () => {
    expect(c).toContain('privacyNote');
  });
});

describe('the BFF sets the app label, not the client', () => {
  const route = src('app/api/bff/feedback/route.ts');

  it('spreads the parsed body FIRST so app cannot be overridden', () => {
    expect(route).toMatch(/\{ \.\.\.parsed\.data, app: APP \}/);
  });

  it('does not accept an app field from the request', () => {
    // A label anyone can set is a label nobody can sort by.
    expect(route).not.toMatch(/app:\s*z\./);
  });

  it('validates before forwarding — the gateway hop is not the first check', () => {
    expect(route).toMatch(/safeParse[\s\S]*VALIDATION_ERROR/);
  });
});

describe('all twelve locales carry the strings', () => {
  const locales = ['en', 'ar', 'es', 'fr', 'hi', 'id', 'ko', 'pt', 'ru', 'tr', 'vi', 'zh'];
  const keys = ['title', 'hint', 'placeholder', 'send', 'thanks', 'privacyNote', 'social'];

  for (const loc of locales) {
    it(`${loc}: has every feedback key`, () => {
      const dict = src(`lib/i18n/dictionaries/${loc}.ts`);
      const block = dict.slice(dict.indexOf('feedback: {'));
      expect(dict).toContain('feedback: {');
      for (const k of keys) expect(block.slice(0, 1400)).toContain(`${k}:`);
    });
  }
});
