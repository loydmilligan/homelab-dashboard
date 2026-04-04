import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/hosts', label: 'Hosts' },
  { to: '/services', label: 'Services' },
  { to: '/network', label: 'Network' },
  { to: '/iot', label: 'IoT' },
  { to: '/logs', label: 'Logs' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-100">Homelab Dashboard</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-gray-100'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
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
