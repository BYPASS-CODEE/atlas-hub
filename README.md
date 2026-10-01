<p align="center">
  <strong>ATLAS HUB</strong>
</p>

<p align="center">
  Full-Stack business operations platform for clients, projects, teams and service delivery.
</p>

<p align="center">
  <a href="https://github.com/BYPASS-CODEE/atlas-hub"><img src="https://img.shields.io/badge/GitHub-BYPASS--CODEE%2Fatlas--hub-181717?logo=github" alt="GitHub repository" /></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/SQLite-relational-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
</p>

<p align="center">
  <a href="#قابلیتهای-اصلی">Features</a> ·
  <a href="#معماری">Architecture</a> ·
  <a href="#امنیت">Security</a> ·
  <a href="#product-showcase">Screenshots</a> ·
  <a href="#تست-و-کیفیت">Testing</a> ·
  <a href="#نصب-و-اجرا">Installation</a>
</p>

<p align="center">
  <a href="https://github.com/BYPASS-CODEE/atlas-hub">مشاهده Repository</a>
</p>

---

## معرفی پروژه

Atlas Hub یک پلتفرم Full-Stack برای مدیریت عملیات کسب‌وکار و ارائه‌ی خدمات است. این سامانه اطلاعات مشتری، پروژه، وظایف، پشتیبانی، فاکتورها و اعضای تیم را در یک workspace سازمانی متمرکز می‌کند.

رابط کاربری با React و TypeScript ساخته شده و backend با Node.js و Express یک REST API واقعی در اختیار آن قرار می‌دهد. Authentication، نقش‌ها، دسترسی سازمانی و داده‌های رابطه‌ای SQLite نیز در خود پروژه پیاده‌سازی شده‌اند؛ بنابراین repository صرفاً یک UI mockup نیست.

## در یک نگاه

| حوزه | پیاده‌سازی واقعی |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express |
| API | REST API |
| Database | SQLite relational database |
| Authentication | JWT + bcrypt password hashing |
| Authorization | RBAC + organization-based access control |
| UI | Persian RTL, responsive Light/Dark interface |
| Testing | Authentication و database constraint tests |
| Repository | Public GitHub repository |

## قابلیت‌های اصلی

### Workspace & Dashboard

- سازمان و workspace اعضا
- Dashboard عملیاتی
- خلاصه‌ی مشتریان، پروژه‌ها، وظایف، تیکت‌ها و فاکتورها
- Empty, loading و error states برای حالت بدون داده

### CRM

- ثبت و مدیریت مشتریان
- صفحه‌ی جزئیات مشتری
- ارتباط مشتری با پروژه‌ها و فاکتورها
- وضعیت فعال، غیرفعال و lead

### Project Management

- پروژه‌ها و اعضای پروژه
- وضعیت و اولویت پروژه
- وظایف، assignee، deadline و task comments
- نمایش پیشرفت و workflow پروژه

### Support & Notifications

- Support tickets
- دسته‌بندی، اولویت و وضعیت تیکت
- Ticket messages
- اعلان‌های کاربر و mark-as-read

### Finance

- Invoices و invoice items
- محاسبه‌ی subtotal، tax و total
- ثبت payments
- وضعیت‌های draft، sent، paid، overdue و cancelled

### Team & Access

- فهرست اعضای سازمان
- دعوت عضو جدید
- تغییر نقش و مدیریت عضویت
- نقش‌های `ADMIN`، `MANAGER`، `TEAM_MEMBER` و `CLIENT`

### Administration

- Admin / Control Center
- مدیریت کاربران و سازمان‌ها
- system overview
- Audit logs و ثبت عملیات حساس

## Product Showcase

تصاویر زیر از build واقعی فعلی پروژه تهیه شده‌اند و نسخه‌های Light و Dark را نشان می‌دهند.

### Desktop

<p align="center">
  <img src="docs/screenshots/desktop-light.png" width="48%" alt="Atlas Hub desktop light mode" />
  <img src="docs/screenshots/desktop-dark.png" width="48%" alt="Atlas Hub desktop dark mode" />
</p>

<p align="center"><sub>Light Mode · Dark Mode</sub></p>

### Mobile

<p align="center">
  <img src="docs/screenshots/mobile-light.jpg" width="24%" alt="Atlas Hub mobile light mode" />
  <img src="docs/screenshots/mobile-dark.jpg" width="24%" alt="Atlas Hub mobile dark mode" />
</p>

<p align="center"><sub>Responsive Mobile · Light / Dark</sub></p>

## معماری

```text
React + TypeScript + Vite
            │
            ▼
        REST API
            │
            ▼
     Node.js + Express
            │
            ▼
 Authentication / RBAC
            │
            ▼
     SQLite relational DB
```

### ساختار Repository

```text
src/
  api/                 REST API clients
  components/          layouts و reusable UI components
  context/             Auth، Theme و Toast state
  pages/               public، auth، app و admin
  types/               TypeScript domain types

server/
  src/routes/          routeهای REST API
  src/middleware/      authentication و RBAC
  src/database/        SQLite schema و database connection
  src/utils/            auth، audit و notification utilities

tests/                 authentication و database tests
docs/screenshots/      تصاویر واقعی محصول
```

## Authentication & Authorization

- Registration و Login در `/api/auth`
- Password hashing با `bcryptjs`
- صدور و verification توکن JWT
- Bearer-token authentication middleware
- بررسی active بودن حساب در هر درخواست محافظت‌شده
- محدودسازی queryها بر اساس `organization_id`
- بررسی ownership منابع در routeهای سازمانی برای کاهش ریسک IDOR
- حفاظت کامل namespace مربوط به Admin با `requireAdmin`
- ثبت عملیات حساس در `audit_logs`

### نقش‌ها

- `ADMIN`: دسترسی به Control Center و عملیات مدیریتی سیستم؛ تنها این نقش می‌تواند نقش `ADMIN` اختصاص دهد.
- `MANAGER`: مدیریت منابع عملیاتی سازمان، از جمله مشتری، پروژه، فاکتور و اعضای تیم.
- `TEAM_MEMBER`: دسترسی عملیاتی سازمان و انجام وظایف محول‌شده.
- `CLIENT`: دسترسی محدود به اطلاعات و تیکت‌های مرتبط با خود.

## پایگاه داده

Database واقعی پروژه SQLite است، نه PostgreSQL یا MongoDB. schema رابطه‌ای شامل این entityهاست:

`users` · `organizations` · `organization_members` · `clients` · `projects` · `project_members` · `tasks` · `task_comments` · `support_tickets` · `ticket_messages` · `invoices` · `invoice_items` · `payments` · `notifications` · `audit_logs` · `contact_messages`

Foreign keyها فعال هستند، `CHECK` constraint برای status و role وجود دارد، indexهای عملیاتی تعریف شده‌اند و SQLite با WAL mode اجرا می‌شود.

## امنیت

- Passwordها فقط به‌صورت hash ذخیره می‌شوند.
- `AUTH_SECRET` از environment خوانده می‌شود.
- در production نبودن `AUTH_SECRET` مانع startup می‌شود.
- Authorization در backend enforce می‌شود و به UI وابسته نیست.
- داده‌ها بر اساس سازمان و مالکیت resource فیلتر می‌شوند.
- Database، `.env`، `node_modules` و build output در Git نادیده گرفته شده‌اند.
- برای deployment واقعی باید HTTPS، secret قوی، database production و server hardening تنظیم شود.

## UI / UX و Theme

- رابط فارسی و RTL
- Responsive layout برای mobile، tablet و desktop
- Reusable components برای form، card، modal، button، badge و stateها
- focus state و کنتراست مناسب برای تعاملات اصلی
- Light/Dark switching بدون reload
- persistence تم با `localStorage` و کلید `atlas_theme`
- semantic color tokens برای background، card، border، input و text
- پوشش theme در public pages، auth، dashboard، workspace و Control Center

## تست و کیفیت

اسکریپت‌های واقعی پروژه:

```bash
npm install
npm run lint
npm run test
npm run build
```

آخرین validation واقعی پروژه:

- Lint / TypeScript check: PASS
- Test: PASS — ۲ suite، ۴ تست، ۰ failure
- Production build: PASS

تست‌های موجود password hashing، JWT signing/verification، رد token دستکاری‌شده و foreign keyهای database را پوشش می‌دهند. Automated E2E test در پروژه ادعا نمی‌شود.

## نصب و اجرا

```bash
npm install
copy .env.example .env
npm run dev
```

برنامه در development روی `http://localhost:3000` اجرا می‌شود.

برای production:

```bash
npm run build
npm run start
```

## Environment Variables

فایل `.env.example` فقط نام متغیرها را مشخص می‌کند:

```env
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

مقدار واقعی secret نباید در source code، README یا GitHub قرار بگیرد.

## AI-Assisted Development

این پروژه با استفاده از AI-assisted development نیز توسعه و بررسی شده است. ابزارهای استفاده‌شده شامل Google AI Studio و OpenAI Codex بوده‌اند. استفاده از AI برای سرعت‌بخشیدن به implementation، audit و documentation انجام شد؛ source code، تست‌ها، اجرای محلی و validation نهایی به‌صورت عملی بررسی شده‌اند.

## وضعیت فعلی

| بخش | وضعیت |
|---|---|
| Frontend | Ready |
| Backend و REST API | Ready |
| Authentication و RBAC | Implemented |
| SQLite relational database | Implemented |
| Responsive UI | Implemented؛ automated E2E ادعا نمی‌شود |
| Light / Dark Theme | Implemented و verified |
| Tests | 4 passing |
| Production build | Passing |
| Live deployment | ارائه نشده است |

## توسعه‌های آینده

- Automated E2E coverage
- Schema migration versioning
- Rate limiting و request validation متمرکز
- CI pipeline برای lint، test و build
- External storage برای avatar و attachmentها

## License

در حال حاضر license مشخصی برای repository اضافه نشده است.
