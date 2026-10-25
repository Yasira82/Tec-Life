'use client';

// App-shell bottom navigation — same quality bar as tec-assets: vector icons from
// tec-ui (not emoji), glass backdrop, active scale + underline, light haptic.
import { useTranslation } from '@/lib/i18n';
import { Icon, type IconName } from '@yasser172/tec-ui';
import { C, bgA, goldA } from '@/lib-client/palette';

// Five tabs, not four. Skills is one of the six capabilities C-106 §4 says
// Life owns, and the first of the three that were missing entirely — it earns a
// tab rather than a card inside another screen.
export type LifeTab = 'home' | 'goals' | 'skills' | 'activity' | 'settings';

export function BottomNav({ active, onSelect }: { active: LifeTab; onSelect: (t: LifeTab) => void }) {
  const { t } = useTranslation();
  const ITEMS: { key: LifeTab; icon: IconName; label: string }[] = [
    { key: 'home',     icon: 'home',     label: t.life.nav.home     },
    { key: 'goals',    icon: 'trophy',   label: t.life.nav.goals    },
    { key: 'skills',   icon: 'sprout',   label: t.life.nav.skills   },
    { key: 'activity', icon: 'chart',    label: t.life.nav.activity },
    { key: 'settings', icon: 'settings', label: t.life.nav.settings },
  ];
  // A floating bar, not a strip welded to the bottom edge: rounded, inset from the
  // sides, lifted off the content by a soft shadow — the active tab gets a gold pill
  // behind its icon instead of a 2px underline nobody sees on a phone.
  return (
    <nav aria-label={t.life.brand} style={{
      position: 'fixed', zIndex: 200,
      left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))',
      maxWidth: 560, margin: '0 auto',
      background: bgA(0.88), backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${C.border}`, borderRadius: 24,
      boxShadow: `0 10px 30px ${bgA(0.7)}`,
      display: 'flex', padding: '6px 4px',
    }}>
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { navigator.vibrate?.(8); onSelect(item.key); }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1, minWidth: 0, minHeight: 52,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 44, height: 28, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? goldA(0.16) : 'transparent',
              transition: 'background 0.2s',
            }}>
              <Icon name={item.icon} size={20} color={isActive ? C.gold : C.faint} strokeWidth={isActive ? 2.2 : 1.9} />
            </div>
            <div style={{
              fontSize: 10.5, fontWeight: isActive ? 700 : 500, color: isActive ? C.gold : C.faint,
              transition: 'color 0.2s', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.label}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
