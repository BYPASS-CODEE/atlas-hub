import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { ShieldAlert, Users, Building, FileText, ArrowRight, Activity, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button.js';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="theme-page min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Strict RBAC: If not ADMIN, display 403 Forbidden
  if (!isAdmin) {
    return (
      <div className="theme-page min-h-screen flex items-center justify-center p-6">
        <div className="theme-card max-w-md w-full text-center p-8 rounded-2xl border shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">دسترسی غیرمجاز (403 Forbidden)</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            حساب کاربری شما ({user?.email}) مجوز سطح مدیریت ارشد برای ورود به مرکز کنترل سیستم را دارا نمی‌باشد. کلیه تلاش‌های دسترسی غیرمجاز در گزارشات ممیزی امنیتی ثبت می‌گردد.
          </p>
          <div className="mt-6">
            <Link to="/app">
              <Button variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
                بازگشت به میز کار
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'وضعیت سامانه', href: '/control-center', icon: Activity, end: true },
    { name: 'مدیریت کاربران', href: '/control-center/users', icon: Users },
    { name: 'سازمان‌ها', href: '/control-center/organizations', icon: Building },
    { name: 'لاگ‌های ممیزی امنیتی', href: '/control-center/audit', icon: FileText },
  ];

  return (
    <div className="theme-page min-h-screen flex flex-col transition-colors">
      {/* Admin Top Header */}
      <header className="theme-card h-16 border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/control-center" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>مرکز کنترل و نظارت سیستم (Control Center)</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80 font-mono font-medium">
            SYS_ADMIN
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={theme === 'dark' ? 'تغییر به پوسته روشن' : 'تغییر به پوسته تاریک'}
            title={theme === 'dark' ? 'تغییر به پوسته روشن' : 'تغییر به پوسته تاریک'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <Link to="/app" className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700">
            <span>بازگشت به اپلیکیشن</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Admin Subnav */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 px-6 backdrop-blur-xs">
        <nav className="flex items-center gap-6 text-xs font-medium overflow-x-auto py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.href : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 py-1 px-2.5 rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
