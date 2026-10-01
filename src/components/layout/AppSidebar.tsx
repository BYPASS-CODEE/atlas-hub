import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  LifeBuoy,
  Receipt,
  Users,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export interface AppSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, isAdmin } = useAuth();

  const navigation = [
    { name: 'میز کار و داشبورد', href: '/app', icon: LayoutDashboard, end: true },
    { name: 'مشتریان', href: '/app/clients', icon: Building2 },
    { name: 'پروژه‌ها', href: '/app/projects', icon: FolderKanban },
    { name: 'وظایف و تسک‌ها', href: '/app/tasks', icon: CheckSquare },
    { name: 'مرکز پشتیبانی', href: '/app/support', icon: LifeBuoy },
    { name: 'فاکتورها و مالی', href: '/app/invoices', icon: Receipt },
    { name: 'اعضای تیم', href: '/app/team', icon: Users },
    { name: 'گزارشات آماری', href: '/app/reports', icon: BarChart3 },
    { name: 'تنظیمات', href: '/app/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="theme-card flex flex-col h-full border-l w-64 select-none">
      {/* Workspace Brand / Header */}
      <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900 dark:text-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>ATLAS HUB</span>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Organization Badge */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
        <p className="text-xs text-slate-400 font-medium">فضای کاری فعال</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
          {user?.company_name || 'سازمان من'}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Discreet Control Center Link for System Admins Only */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-xs font-semibold text-slate-400 tracking-wider">مدیریت سیستمی</span>
            <NavLink
              to="/control-center"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `mt-1.5 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-800 font-semibold dark:bg-amber-950/60 dark:text-amber-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">مرکز کنترل سیستم</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer & quick logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            title="خروج از حساب"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="theme-card relative flex-1 flex flex-col max-w-xs w-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
