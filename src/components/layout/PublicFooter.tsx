import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="theme-card border-t py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              ATLAS HUB
            </Link>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              سامانه یکپارچه مدیریت فرآیندهای کسب‌وکار، ارتباط با مشتریان، پیگیری پروژه‌ها و صدور فاکتور ویژه آژانس‌های دیجیتال و شرکت‌های خدمات حرفه‌ای.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              محصول
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  مدیریت پروژه‌ها و وظایف
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  سیستم مشتریان و CRM
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  صدور فاکتور و امور مالی
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  مرکز تیکتینگ و پشتیبانی
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              دسترسی سریع
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  درباره پلتفرم
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  ارتباط با ما
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  ورود به پنل کاربری
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  ثبت نام و ایجاد فضای کاری
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} ATLAS HUB. تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-6">
            <span>امنیت سطح Enterprise</span>
            <span>طراحی متمرکز بر معماری تمیز</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
