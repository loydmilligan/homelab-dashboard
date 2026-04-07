import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AppNotifications } from './AppNotifications';
import { sectionIcons } from '../lib/section-icons';

const navItems: Array<{ to: string; label: string; shortLabel?: string }> = [
  { to: '/', label: 'Overview' },
  { to: '/hosts', label: 'Hosts' },
  { to: '/wapps', label: 'Wapps' },
  { to: '/works', label: 'Works' },
  { to: '/yots', label: 'Yots' },
  { to: '/stows', label: 'Stows' },
  { to: '/shots', label: 'Shots' },
  { to: '/tracs', label: 'Tracs' },
  { to: '/crets', label: 'Crets' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={sectionIcons.app_mark.nav}
                alt={sectionIcons.app_mark.alt}
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
              />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-100">Shost</h1>
                <p className="truncate text-xs text-gray-500">Lean homelab control surface</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:block">
                <AppNotifications />
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen((value) => !value)}
                className="inline-flex items-center rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 lg:hidden"
                aria-expanded={mobileNavOpen}
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? 'Close' : 'Menu'}
              </button>
            </div>
          </div>

          <div className="mt-4 hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-cyan-400/30 bg-cyan-500/12 text-cyan-100'
                        : 'border-transparent bg-gray-800/70 text-gray-400 hover:border-gray-700 hover:bg-gray-800 hover:text-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {mobileNavOpen ? (
            <>
              <button
                type="button"
                aria-label="Close navigation"
                className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
              <div className="relative z-30 mt-4 lg:hidden">
                <div className="rounded-2xl border border-gray-800 bg-gray-950/95 p-3 shadow-2xl">
                  <div className="mb-3">
                    <AppNotifications />
                  </div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileNavOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? 'border border-cyan-400/30 bg-cyan-500/12 text-cyan-100'
                              : 'border border-transparent bg-gray-900/70 text-gray-300 hover:bg-gray-800 hover:text-gray-100'
                          }`
                        }
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-500">Open</span>
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 sm:py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-600 py-2">
        Build: {__BUILD_NUMBER__}
      </footer>
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
