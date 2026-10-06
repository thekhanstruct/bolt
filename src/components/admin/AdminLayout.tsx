import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  FolderOpen,
  Users,
  Settings,
  ScrollText,
  LogOut,
  Building2,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { roleLabel, initials } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/pages', label: 'Pages', icon: FileText },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['super_admin', 'org_admin'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'org_admin'] },
  { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
];

export function AdminLayout() {
  const { user, profile, memberships, activeOrganization, activeRole, signOut, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (activeRole && item.roles.includes(activeRole))
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">CommunityHub</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Org switcher */}
        {memberships.length > 0 && activeOrganization && (
          <div className="px-3 py-3 border-b border-gray-200 relative">
            <button
              onClick={() => setOrgMenuOpen(!orgMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: activeOrganization.primary_color }}
                >
                  {initials(activeOrganization.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activeOrganization.name}</p>
                  <p className="text-xs text-gray-500">{roleLabel(activeRole || '')}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {orgMenuOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {memberships.map((m) => (
                  <button
                    key={m.organization_id}
                    onClick={() => {
                      switchOrganization(m.organization_id);
                      setOrgMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition text-left ${
                      m.organization_id === activeOrganization.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: m.organizations.primary_color }}
                    >
                      {initials(m.organizations.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">{m.organizations.name}</p>
                      <p className="text-xs text-gray-400">{roleLabel(m.role)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-3 border-t border-gray-200 space-y-1">
          {activeOrganization && (
            <Link
              to={`/portal/${activeOrganization.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <ExternalLink className="w-5 h-5" />
              View public site
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{profile?.display_name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700">
              {initials(profile?.display_name || user?.email || 'U')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
