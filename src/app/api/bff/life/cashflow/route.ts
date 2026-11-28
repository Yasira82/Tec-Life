import { NextRequest, NextResponse } from 'next/server';
import { readGateway } from '@/lib/bff/lifeGateway';
import { PERIOD, currentPeriod, periodBounds, paymentsOutCounted, readPaymentHistory, readPayoutsIn, netOf, UNREADABLE, type CashflowSide } from '@/lib/life/money';

// L1 — cash flow for one month, PRESENTED from the owning services (C-106 §4):
//   in   ← seller payouts SENT to this person   (tec-commerce-service `payouts/mine`)
//   out  ← completed payments                   (tec-payment-service `history`)
// Each side can fail on its own and comes back `null` with its status. A net is
// given only when both sides are known (C-47 §10 E1): a net over a guess is a
// number somebody will act on.
//
// Not here yet: campaign rewards. The claim payload carries no amount, and this
// screen never shows a number it does not hold.

const PAGE = 100;

export async function GET(req: NextRequest) {
  const raw    = req.nextUrl.searchParams.get('period') ?? '';
  const period = raw === '' ? currentPeriod() : raw;
  if (!PERIOD.test(period)) return NextResponse.json({ error: 'period must be YYYY-MM' }, { status: 400 });

  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, to } = periodBounds(period);
  const [payments, payouts] = await Promise.all([
    readGateway(req, `/api/payment/history?status=completed&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${PAGE}&sort=desc`),
    readGateway(req, '/api/commerce/payouts/mine'),
  ]);

  // Each side is complete only when its answer is the expected shape and every row in it was counted
  // (owner review of #136). A broken answer, a skipped row or a cut list is null with its status — never a 0 —
  // and there is no net unless BOTH sides are complete (netOf).
  let out: CashflowSide | null = null;
  let out_status: number | 'partial' | null = null;
  if (payments.ok) {
    const read = readPaymentHistory(payments.data);
    if (read.kind === 'partial') out_status = 'partial';
    else if (read.kind === 'unreadable') out_status = UNREADABLE;
    else {
      const { side, skipped } = paymentsOutCounted(read.rows);
      if (skipped > 0) out_status = UNREADABLE;
      else out = side;
    }
  } else {
    out_status = payments.status;
  }

  let inn: CashflowSide | null = null;
  let in_status: number | 'partial' | null = null;
  if (payouts.ok) {
    const read = readPayoutsIn(payouts.data, period);
    if (read.kind === 'partial') in_status = 'partial';
    else if (read.kind === 'unreadable') in_status = UNREADABLE;
    else inn = read.side;
  } else {
    in_status = payouts.status;
  }

  return NextResponse.json({
    success: true,
    data: { period, in: inn, in_status, out, out_status, net: netOf(inn, out) },
  });
}
