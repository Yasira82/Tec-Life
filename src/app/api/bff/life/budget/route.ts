import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forwardLife, readGateway } from '@/lib/bff/lifeGateway';
import { PERIOD, currentPeriod, periodBounds, spentBySource, composeBudget, type CapRow, type PaymentRow } from '@/lib/life/money';

// L1 — the caller's own budget for one month (C-106 §10 Phase 1).
//
// GET  /api/bff/life/budget?period=YYYY-MM
//   caps   ← identity-service  (Life owns them — the screen's own data; a failure here fails the route)
//   spent  ← payment-service   (the owning service — PRESENTED beside each cap; a failure here is
//                               `spent: null` with its status, never a 0: C-47 §10 E1)
// PUT  /api/bff/life/budget          {category, period?, cap_pi}  → identity (upsert)
//
// The session is the only identity on every call (P6); the period is the only
// thing the caller chooses.

const PAGE = 100;

export async function GET(req: NextRequest) {
  const raw    = req.nextUrl.searchParams.get('period') ?? '';
  const period = raw === '' ? currentPeriod() : raw;
  if (!PERIOD.test(period)) return NextResponse.json({ error: 'period must be YYYY-MM' }, { status: 400 });

  const { from, to } = periodBounds(period);
  const [caps, payments] = await Promise.all([
    readGateway(req, `/api/identity/life/budget?period=${period}`),
    readGateway(req, `/api/payment/history?status=completed&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${PAGE}&sort=desc`),
  ]);

  if (!caps.ok) return NextResponse.json({ error: caps.status === 401 ? 'Unauthorized' : 'Service unavailable' }, { status: caps.status });

  const capRows = ((caps.data as { caps?: CapRow[] })?.caps ?? []);

  // Spent is known only when the whole month was read. More than one page means
  // the sum would understate, and an understated "spent" reads as "under budget".
  let spent: ReturnType<typeof spentBySource> | null = null;
  let spent_status: number | 'partial' | null = null;
  if (payments.ok) {
    const d = payments.data as { payments?: PaymentRow[]; pagination?: { hasNext?: boolean } };
    if (d?.pagination?.hasNext) spent_status = 'partial';
    else spent = spentBySource(d?.payments ?? []);
  } else {
    spent_status = payments.status;
  }

  const { lines, unallocated } = composeBudget(capRows, spent);
  return NextResponse.json({
    success: true,
    data: {
      period,
      lines,
      unallocated,
      spent_total:  spent?.total ?? null,
      spent_status, // null when spent is known; a status or 'partial' when it is not
    },
  });
}

const SetCapSchema = z.object({
  category: z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/),
  period:   z.string().regex(PERIOD).optional(),
  // A number or an exact decimal string — and in both forms strictly positive:
  // "0" matches the decimal shape, and a zero cap is not a cap.
  cap_pi:   z.union([
    z.number().positive().max(1_000_000_000),
    z.string().regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,8})?$/).refine((v) => Number(v) > 0, 'cap_pi must be positive'),
  ]),
});

export async function PUT(req: NextRequest) {
  const parsed = SetCapSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  return forwardLife(req, 'PUT', '/api/identity/life/budget', parsed.data);
}
