import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/transactions', icon: '💸', label: 'Transacciones' },
    { to: '/pockets', icon: '🏦', label: 'Bolsillos' },
    { to: '/categories', icon: '🏷️', label: 'Categorías' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-[#f5f6fa]">
            {/* ─── Overlay mobile ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 gradient-primary text-white
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold tracking-tight">
                        💰 Fynz
                    </h1>
                    <p className="text-white/60 text-sm mt-1">Finanzas inteligentes</p>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white/20 text-white shadow-lg shadow-black/10'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <span className="text-lg">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                            {user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username || 'Usuario'}</p>
                            <p className="text-xs text-white/50 truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium
              bg-white/10 hover:bg-white/20 text-white/80 hover:text-white
              transition-all duration-200 cursor-pointer"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Topbar mobile */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-gradient">💰 Fynz</h1>
                    <div className="w-10" />
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
