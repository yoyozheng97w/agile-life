import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Sprint Board', icon: '📋' },
    { path: '/history', label: 'History', icon: '📈' },
    { path: '/retro', label: 'Retro', icon: '💭' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <nav className="w-48 bg-slate-800 text-white shadow-lg p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-8">Agile Life</h1>
        <ul className="space-y-2 flex-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  location.pathname === item.path
                    ? 'bg-blue-600 font-semibold'
                    : 'hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
