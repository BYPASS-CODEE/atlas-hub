import React from 'react';
import { Card } from '../../components/ui/Card.js';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          درباره اطلس هاب (ATLAS HUB)
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          اطلس هاب به عنوان یک بستر عملیاتی اختصاصی با تکیه بر اصول معماری نرم‌افزارهای تجاری و مهندسی دقیق فول‌استک متولد شده است.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <Card className="p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">فلسفه طراحی مهندسی</h2>
          <p>
            بسیاری از نرم‌افزارهای امروزی با حجم زیادی از جلوه‌های بصری غیرضروری، آمارهای ساختگی و نمودارهای تزیینی همراه شده‌اند که در محیط واقعی کاربری مفیدی ارائه نمی‌دهند. رویکرد ما در اطلس هاب، تمرکز بر کارایی واقعی، سادگی در تعامل، واکنش‌گرایی بی‌نقص در تمامی ابعاد نمایشگرها و پایداری داده‌هاست.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">پایبندی به اصالت داده‌ها (Zero Fake Data)</h2>
          <p>
            در اطلس هاب هیچ داده از پیش تولیدشده‌ای در قالب کاربر دروغین، مشتری موک یا آمار ساختگی در پایگاه داده تزریق نمی‌شود. داشبوردها و گزارشات، وضعیت شفاف و دقیق کسب‌وکار شما را نمایش می‌دهند و نمودارها بر اساس تراکنش‌ها و پروژه‌های حقیقی شما محاسبه می‌گردند.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">پشته فناوری پایدار</h2>
          <p>
            استفاده از React و TypeScript در لایه رابط کاربری، موتور اکسپرس در لایه سرویس‌دهنده و پایگاه داده رابطه‌ای سازگار با اصول ACID، بستری مطمئن و قابل توسعه برای هماهنگی فرآیندهای کسب‌وکار فراهم آورده است.
          </p>
        </Card>
      </div>
    </div>
  );
};
