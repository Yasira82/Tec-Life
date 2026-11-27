// @vitest-environment node
/**
 * The link preview (owner, 27 Nov 2026: «ضيف صورة المعاينة»). A Life link shared in a chat, or opened through
 * PiNet (life4748.pinet.com, metadata type "frontend" — read from the page itself), showed a bare title: no
 * picture. Next serves src/app/opengraph-image.png + twitter-image.png as og:image / twitter:image; they need an
 * absolute address, which is metadataBase — the production domain, so a preview never points at a preview build.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const png = (f: string) => readFileSync(`${process.cwd()}/src/app/${f}`);
const size = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });

describe('link preview', () => {
  it('a 1200×630 PNG for Open Graph and for X, each with alt text', () => {
    for (const f of ['opengraph-image', 'twitter-image']) {
      const b = png(`${f}.png`);
      expect(b.subarray(1, 4).toString()).toBe('PNG');
      expect(size(b)).toEqual({ w: 1200, h: 630 });
      expect(b.length).toBeLessThan(1_000_000);
      expect(png(`${f}.alt.txt`).toString().trim()).toMatch(/TEC Life/);
    }
  });

  it('absolute links on the production domain, and a large card', async () => {
    const { metadata } = await import('@/app/layout');
    expect(String(metadata.metadataBase)).toBe('https://life.tecosystem.app/');
    expect(metadata.openGraph).toMatchObject({ title: 'TEC Life', siteName: 'TEC Life', type: 'website' });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});
