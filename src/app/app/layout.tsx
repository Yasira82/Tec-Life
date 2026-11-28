// /app — chooses the design on the server (Life redesign, Phase 1 Foundation).
//
// The current app is ./page.tsx, untouched: for everyone the switch does not name, this
// layout renders it exactly as before. The redesign is rendered INSTEAD of it only for a
// person resolveDesign() puts on the list — and any doubt is the current design (P6).
// Rolling back is turning the switch off; nothing here has to be deployed again.
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { resolveDesign } from '@/lib/server/design-flag';
import { NewApp } from './redesign/NewApp';

// Decided per request from the session cookie — never cached, never static.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get('tec_access_token')?.value;
  const { design, reason } = await resolveDesign(token);
  // The reason only — never a name or a token — and only when it says something: a tester
  // got the redesign, or the server cannot check a token at all (JWT_SECRET missing).
  // Everyone else getting the current design is the normal case and is not logged.
  if (reason === 'on_list' || reason === 'no_secret') console.info('[life/design]', design, reason);
  return design === 'new' ? <NewApp /> : <>{children}</>;
}
