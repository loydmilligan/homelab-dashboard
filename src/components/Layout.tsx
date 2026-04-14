import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppNotifications } from './AppNotifications';
import { sectionIcons } from '../lib/section-icons';
import { useShareMode } from '../lib/share-mode';

// Bottom nav: max 5 primary destinations (Material Design §9)
const primaryNav = [
  {
    to: '/',
    label: 'Overview',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/hosts',
    label: 'Hosts',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <rect x="2" y="5" width="20" height="4" rx="1.5" />
        <rect x="2" y="11" width="20" height="4" rx="1.5" />
        <rect x="2" y="17" width="20" height="4" rx="1.5" />
        <circle cx="6" cy="7" r="0.75" fill="currentColor" />
        <circle cx="6" cy="13" r="0.75" fill="currentColor" />
        <circle cx="6" cy="19" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/wapps',
    label: 'Wapps',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    to: '/stores',
    label: 'Stores',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v4c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
        <path d="M4 10v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4" />
      </svg>
    ),
  },
  {
    to: null, // triggers "More" drawer
    label: 'More',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

// Secondary routes — shown in the "More" drawer
const secondaryNav = [
  { to: '/shouts', label: 'Shouts' },
  { to: '/settings', label: 'Settings' },
];

// Routes that live under the "More" drawer for active-state detection
const secondaryPaths = secondaryNav.map((n) => n.to);

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { shareSafeMode } = useShareMode();
  const location = useLocation();

  const isSecondaryActive = secondaryPaths.includes(location.pathname);

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Top App Bar — thin, Material-style */}
      <header
        className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={sectionIcons.app_mark.nav}
              alt={sectionIcons.app_mark.alt}
              className="h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-white/5 p-1 shadow-[0_0_16px_rgba(255,255,255,0.06)]"
            />
            <span className="text-base font-semibold tracking-tight text-gray-100">Shost</span>
            {shareSafeMode ? (
              <span className="ml-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                Share-safe
              </span>
            ) : null}
          </div>
          <AppNotifications />
        </div>
      </header>

      {/* Page content — padded so it clears the bottom nav */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar — max 5 items (Material Design §9) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-10 border-t border-gray-800 bg-gray-950/95 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary navigation"
      >
        <div className="flex">
          {primaryNav.map((item) => {
            if (item.to === null) {
              // "More" button — opens drawer
              const active = isSecondaryActive || drawerOpen;
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setDrawerOpen((v) => !v)}
                  aria-expanded={drawerOpen}
                  aria-label="More navigation"
                  className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors ${
                    active ? 'text-cyan-400' : 'text-gray-500'
                  }`}
                >
                  <span className={`transition-transform duration-150 ${active ? 'scale-110' : 'scale-100'}`}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                  {active ? (
                    <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-cyan-400" />
                  ) : null}
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                    {isActive ? (
                      <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-cyan-400" />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* "More" Drawer — slides up from bottom */}
      {drawerOpen ? (
        <>
          {/* Scrim */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-gray-800 bg-gray-950 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
            role="dialog"
            aria-label="More navigation"
          >
            {/* Handle */}
            <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-gray-700" />
            <nav className="px-3 pb-2 grid grid-cols-2 gap-2">
              {secondaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border border-cyan-400/25 bg-cyan-500/10 text-cyan-100'
                        : 'border border-gray-800 bg-gray-900/60 text-gray-300 active:bg-gray-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function WallboardLayout() {
  return (
    <div className="min-h-screen tv-mode p-6">
      <Outlet />
    </div>
  );
}
