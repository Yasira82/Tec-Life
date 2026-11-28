/**
 * useSkills — the hook both designs use (owner review of e41a4b1): only the newest read may write.
 * A read that answers after a later one changes nothing: not the list, not the error, not `loading`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSkills } from '@/lib-client/life/useLife';

const skill = (name: string) => ({ id: name, name, level: 'LEARNING', source: 'SELF_DECLARED', created_at: '', updated_at: '' });
const ok = (names: string[]) => ({ ok: true, status: 200, json: async () => ({ success: true, data: { skills: names.map(skill) } }) } as Response);
const fail = () => ({ ok: false, status: 502, json: async () => ({ error: 'down' }) } as Response);
afterEach(() => vi.unstubAllGlobals());

/** Each GET waits until the test answers it, in whatever order the test chooses. */
function server() {
  const pending: ((r: Response) => void)[] = [];
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => pending.push(r))));
  return pending;
}

describe('useSkills — a late answer', () => {
  it('an older list arriving after a newer one is ignored', async () => {
    const pending = server();
    const { result } = renderHook(() => useSkills());
    await waitFor(() => expect(pending).toHaveLength(1));            // the first read, in flight
    act(() => result.current.reload());
    await waitFor(() => expect(pending).toHaveLength(2));            // the newer read
    await act(async () => { pending[1]!(ok(['Writing', 'Design'])); });
    await waitFor(() => expect(result.current.skills.map((s) => s.name)).toEqual(['Writing', 'Design']));
    expect(result.current.loading).toBe(false);
    await act(async () => { pending[0]!(ok(['Writing'])); });       // the old one, late
    expect(result.current.skills.map((s) => s.name)).toEqual(['Writing', 'Design']);
  });

  it('a late failure does not mark a good list as failed', async () => {
    const pending = server();
    const { result } = renderHook(() => useSkills());
    await waitFor(() => expect(pending).toHaveLength(1));
    act(() => result.current.reload());
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => { pending[1]!(ok(['Writing'])); });
    await act(async () => { pending[0]!(fail()); });
    expect(result.current.error).toBeNull();
    expect(result.current.skills.map((s) => s.name)).toEqual(['Writing']);
  });

  it('a newer read still pending keeps `loading` on, even if the old one answers', async () => {
    const pending = server();
    const { result } = renderHook(() => useSkills());
    await waitFor(() => expect(pending).toHaveLength(1));
    act(() => result.current.reload());
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => { pending[0]!(ok(['Old'])); });
    expect(result.current.loading).toBe(true);
    expect(result.current.skills).toEqual([]);
  });
});
