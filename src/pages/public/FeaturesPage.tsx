import React from 'react';
import { Building2, FolderKanban, CheckSquare, LifeBuoy, Receipt, Shield, Users, BarChart3 } from 'lucide-react';
import { Card } from '../../components/ui/Card.js';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Building2,
      title: 'مدیریت و پرونده مشتریان (CRM)',
      description: 'ثبت و دسته‌بندی مشخصات مشتریان شرکتی و حقیقی، اطلاعات نمایندگان، وضعیت همکاری (فعال، راکد، سرنخ) و آرشیو یکپارچه کلیه پروژه‌ها و صورتحساب‌های مالی هر مشتری.',
    },
    {
      icon: FolderKanban,
      title: 'مدیریت چندپروژه‌ای و فازبندی',
      description: 'تعریف بودجه‌بندی، تاریخ شروع و مهلت تحویل نهایی، انتساب مدیر پروژه و مشتری، و رصد در لحظه پیشرفت کارهای مرتبط با هر پروژه بر مبنای وظایف تکمیل‌شده.',
    },
    {
      icon: CheckSquare,
      title: 'پیگیری وظایف و تسک‌ها',
      description: 'تعیین سطح اولویت تسک‌ها (عادی، متوسط، بالا، فوری)، ارجاع به اعضای تیم، ثبت نظرات و یادداشت‌های هماهنگی، و تغییر مرحله از در انتظار تا تکمیل نهایی.',
    },
    {
      icon: LifeBuoy,
      title: 'سامانه تیکتینگ و پشتیبانی فنی',
      description: 'سیستم ثبت تیکت با شماره‌های پیگیری اختصاصی، تعیین نوع درخواست (فنی، مالی، عمومی)، امکان گفتگوی رفت و برگشت و اعلان خودکار به کارفرما پس از پاسخ کارشناس.',
    },
    {
      icon: Receipt,
      title: 'صدور فاکتور و مدیریت پرداخت‌ها',
      description: 'فاکتورهای رسمی دارای اقلام متعدد، محاسبه خودکار مالیات بر ارزش افزوده، ثبت دریافت‌های نقدی یا شماره پیگیری تراکنش بانکی و تبدیل وضعیت فاکتور به تسویه شده.',
    },
    {
      icon: Users,
      title: 'مدیریت اعضای تیم و سطوح دسترسی',
      description: 'تفکیک نقش‌ها در چهار لایه مدیر ارشد سیستم (Admin)، مدیر پروژه (Manager)، کارشناس تیم (Team Member) و مشتری (Client) با کنترل قطعی مجوزها در سرور.',
    },
    {
      icon: BarChart3,
      title: 'گزارشات و آمارهای مالی واقعی',
      description: 'محاسبه در لحظه درآمدهای وصول‌شده، مبالغ معوق، پراکندگی وظایف تیم و توزیع درآمدها بر اساس تک‌تک مشتریان؛ بدون استفاده از ارقام شبیه‌سازی‌شده یا موک.',
    },
    {
      icon: Shield,
      title: 'حفظ امنیت و گزارشات ممیزی (Audit Logs)',
      description: 'ثبت دقیق رویدادهای ورود، خروج، ویرایش اطلاعات، حذف فاکتور و ایجاد حساب‌های کاربری به همراه آدرس آی‌پی برای تضمین شفافیت سازمانی و ممیزی‌های دوره‌ای.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          امکانات و قابلیت‌های جامع اطلس هاب
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          کلیه بخش‌های این پلتفرم با هدف رفع سردرگمی در هماهنگی‌های روزمره، یکپارچه‌سازی مکاتبات و ایجاد اطمینان مالی میان ارائه‌دهنده خدمت و کارفرمایان پیاده‌سازی گردیده است.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
