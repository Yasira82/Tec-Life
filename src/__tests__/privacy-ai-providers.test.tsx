/**
 * The privacy page names who writes the coach's replies (owner, 21 Nov 2026). Until then it named Pi Network
 * and "infrastructure providers" only — not that a person's words go to an AI provider at all.
 * It may promise only what the code does: tec-ai-service minimise.ts removes emails, links, handles, wallet
 * addresses, phone numbers and long numbers; the route stores nothing; a kept conversation is the person's choice.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import PrivacyPage from '../app/privacy/page';

const text = () => render(<PrivacyPage />).container.textContent ?? '';

describe("the privacy page — Life's AI coach", () => {
  it('names both providers that may write the reply', () => {
    const t = text();
    expect(t).toMatch(/Anthropic/);
    expect(t).toMatch(/Claude/);
    expect(t).toMatch(/OpenAI/);
  });

  it('says what is sent, what is removed first, and that TEC keeps the conversation only if you choose', () => {
    const t = text();
    expect(t).toMatch(/email addresses, links, phone numbers/);
    expect(t).toMatch(/not saved by TEC unless you choose to keep it/);
  });

  it('says the providers do not train on it, and may keep it for a limited time — never "nothing is kept"', () => {
    const t = text();
    expect(t).toMatch(/do not use .* to train their models/);
    expect(t).toMatch(/up to 30 days/);
    expect(t).not.toMatch(/never (kept|stored) by (the )?provider/i);
  });

  // The orchestra (tec-core-backend #541, owner's review 22 Nov 2026): a reply that fails at one provider is asked of
  // the other, so the words may reach both; a conversation about danger or health goes only to Anthropic; and there
  // is no zero-data-retention agreement today — "unless one applies" must not read as "one applies".
  it('says the words may reach the second provider when the first fails', () => {
    expect(text()).toMatch(/if that provider cannot answer, the same message is sent to the other/i);
  });
  it('says conversations about danger, self-harm or health go only to Anthropic', () => {
    expect(text()).toMatch(/danger, self-harm, abuse or health .* only to Anthropic/i);
  });
  it('says plainly that TEC has no zero-data-retention agreement today', () => {
    expect(text()).toMatch(/TEC has no zero-data-retention agreement with either provider today/);
  });
});

// The screen before the first conversation (21 Nov 2026, the owner's phone): it said the provider «does not
// keep it for us» — true under Groq's Zero Data Retention, not under Claude, and not under OpenAI. The screen
// still names no vendor (owner, 20 Oct 2026: "users don't need to know how we work"); the privacy page does.
import { sessionCopy } from '@/lib/life/session-copy';
import { LOCALES } from '@/lib/i18n';

describe('the intro screen says the same thing, in every language — without naming a vendor', () => {
  it('no longer says the provider keeps nothing', () => {
    expect(sessionCopy('en').introAi).toMatch(/does not train on it, but may keep it for a limited time/);
    expect(sessionCopy('en').introAi).not.toMatch(/does not keep it for us/);
    expect(sessionCopy('ar').introAi).toMatch(/قد يحتفظ به مدة محدودة/);
    expect(sessionCopy('ar').introAi).not.toMatch(/ولا يحتفظ به مزوّد النموذج/);
    for (const { code } of LOCALES) expect(sessionCopy(code).introAi, code).not.toMatch(/anthropic|openai|claude|gpt/i);
  });
});
