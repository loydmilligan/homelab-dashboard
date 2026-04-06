import { NavLink, Outlet } from 'react-router-dom';
import { AppNotifications } from './AppNotifications';
import { sectionIcons, type SectionIconKey } from '../lib/section-icons';

const navItems: Array<{ to: string; label: string; iconKey: SectionIconKey }> = [
  { to: '/', label: 'Overview', iconKey: 'overview' },
  { to: '/hosts', label: 'Hosts', iconKey: 'hosts' },
  { to: '/wapps', label: 'Wapps', iconKey: 'wapps' },
  { to: '/works', label: 'Works', iconKey: 'works' },
  { to: '/yots', label: 'Yots', iconKey: 'yots' },
  { to: '/stows', label: 'Stows', iconKey: 'stows' },
  { to: '/shots', label: 'Shots', iconKey: 'shots' },
  { to: '/tracs', label: 'Tracs', iconKey: 'tracs' },
  { to: '/crets', label: 'Crets', iconKey: 'crets' },
  { to: '/settings', label: 'Settings', iconKey: 'settings' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={sectionIcons.app_mark.nav}
              alt={sectionIcons.app_mark.alt}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-100">Shost</h1>
              <p className="text-xs text-gray-500">Lean homelab control surface</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 justify-end">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-700/90 text-gray-100 shadow-[0_0_18px_rgba(255,255,255,0.05)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <NavIcon iconKey={item.iconKey as SectionIconKey} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <AppNotifications />
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
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

function NavIcon({ iconKey }: { iconKey: SectionIconKey }) {
  const icon = sectionIcons[iconKey];

  return (
    <img
      src={icon.nav}
      alt=""
      aria-hidden="true"
      className="h-4 w-4 object-contain opacity-90"
    />
  );
}
