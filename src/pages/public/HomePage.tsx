import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, FolderKanban, Users, Receipt, LifeBuoy } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import heroImage from '../../assets/images/hero_workspace_operations_1790843451364.jpg';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              سامانه جامع عملیات و ارتباط با مشتریان
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight md:leading-snug">
              مدیریت حرفه‌ای پروژه‌ها، مشتریان و امور مالی در یک پلتفرم منسجم
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              اطلس هاب (ATLAS HUB) بستر عملیاتی اختصاصی برای آژانس‌های دیجیتال، شرکت‌های نرم‌افزاری و تیم‌های ارائه‌دهنده خدمات تخصصی است. از اولین تماس مشتری تا تحویل پروژه و صدور فاکتور رسمی را با اطمینان مدیریت کنید.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" icon={<ArrowLeft className="w-4 h-4 ml-1" />}>
                  ایجاد فضای کاری رایگان
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  ورود به حساب کاربری
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تفکیک دقیق سطوح دسترسی (RBAC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>بدون وابستگی به داده‌های ساختگی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>پایگاه داده پایدار و ساختاریافته</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
              <img
                src={heroImage}
                alt="مرکز عملیات مدرن کسب و کار اطلس هاب"
                className="w-full h-auto object-cover aspect-16/10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <p className="text-white text-sm font-semibold">مرکز هماهنگی و عملیات سازمانی</p>
                  <p className="text-slate-300 text-xs mt-1">کنترل بلادرنگ پروژه‌ها، صدور فاکتور و امور مشتریان</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            ستون‌های اصلی زیرساخت اطلس هاب
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            ابزارهای طراحی‌شده برای پاسخگویی به چالش‌های روزمره مدیریت پروژه‌های خدماتی
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="theme-card p-6 rounded-xl border shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">پرونده هوشمند مشتریان</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                ثبت تاریخچه کامل مشتری، دسترسی به قراردادها، پروژه‌های فعال و صورتحساب‌های مالی در یک نمایه متمرکز.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              تفکیک وضعیت فعال، راکد و سرنخ
            </div>
          </div>

          <div className="theme-card p-6 rounded-xl border shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">مدیریت پروژه و وظایف</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                برنامه‌ریزی فازهای اجرایی، تقسیم تسک‌ها به تفکیک مسئول، تعیین مهلت زمان‌بندی و اولویت‌بندی چهارگانه.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              محاسبه درصد پیشرفت در لحظه
            </div>
          </div>

          <div className="theme-card p-6 rounded-xl border shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">صدور فاکتور و دریافتی‌ها</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                صدور فاکتورهای دارای ردیف‌های اقلام چندگانه، محاسبه خودکار مالیات و ثبت پرداخت‌های جزئی و تسویه کامل.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-amber-600 dark:text-amber-400 font-medium">
              قالب استاندارد و چاپی رسمی
            </div>
          </div>

          <div className="theme-card p-6 rounded-xl border shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">تیکتینگ و میز پشتیبانی</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                کانال گفتگوی مکتوب و رسمی با مشتریان به همراه شماره پیگیری، تعیین دسته‌بندی و پاسخگویی کارشناسان.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-rose-600 dark:text-rose-400 font-medium">
              سیستم اعلان فوری پاسخ‌ها
            </div>
          </div>
        </div>
      </section>

      {/* Security & Reliability Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="theme-card rounded-2xl border p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>معماری امنیتی و قابلیت اطمینان</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                امنیت داده‌ها و احراز هویت در سطح استانداردهای تجاری
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                تمام کوئری‌ها در لایه سرور بر اساس شناسه سازمان محدود شده و از آسیب‌پذیری‌های متداول مانند IDOR جلوگیری می‌شود. رمزهای عبور با سالت قوی هش شده و کلیه تعاملات حیاتی در جدول گزارشات ممیزی (Audit Log) بایگانی می‌گردند.
              </p>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">انطباق نقش‌ها (RBAC)</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">مدیر ارشد، مدیر، عضو تیم، مشتری</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">پایگاه داده</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">رابطه‌ای با رعایت قیود کلید خارجی و ACID</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Decision Block */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          عملیات کسب‌وکار خود را ساماندهی کنید
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          هم‌اکنون سازمان خود را در اطلس هاب ثبت نموده و اولین پروژه‌ها و مشتریان واقعی‌تان را تعریف نمایید.
        </p>
        <div>
          <Link to="/register">
            <Button size="lg">
              شروع کار با اطلس هاب
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

