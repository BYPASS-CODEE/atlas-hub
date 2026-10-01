import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { AdminLayout } from './components/layout/AdminLayout.js';

// Public Pages
import { HomePage } from './pages/public/HomePage.js';
import { FeaturesPage } from './pages/public/FeaturesPage.js';
import { AboutPage } from './pages/public/AboutPage.js';
import { ContactPage } from './pages/public/ContactPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';

// App Pages
import { DashboardPage } from './pages/app/DashboardPage.js';
import { ClientsPage } from './pages/app/ClientsPage.js';
import { ClientDetailPage } from './pages/app/ClientDetailPage.js';
import { ProjectsPage } from './pages/app/ProjectsPage.js';
import { ProjectDetailPage } from './pages/app/ProjectDetailPage.js';
import { TasksPage } from './pages/app/TasksPage.js';
import { SupportPage } from './pages/app/SupportPage.js';
import { NewTicketPage } from './pages/app/NewTicketPage.js';
import { TicketDetailPage } from './pages/app/TicketDetailPage.js';
import { InvoicesPage } from './pages/app/InvoicesPage.js';
import { InvoiceDetailPage } from './pages/app/InvoiceDetailPage.js';
import { TeamPage } from './pages/app/TeamPage.js';
import { ReportsPage } from './pages/app/ReportsPage.js';
import { NotificationsPage } from './pages/app/NotificationsPage.js';
import { SettingsPage } from './pages/app/SettingsPage.js';

// Admin Control Center Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminOrganizationsPage } from './pages/admin/AdminOrganizationsPage.js';
import { AdminAuditPage } from './pages/admin/AdminAuditPage.js';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Authenticated Workspace Application Routes */}
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="support/new" element={<NewTicketPage />} />
                <Route path="support/tickets/:id" element={<TicketDetailPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Dedicated Admin Control Center (Strict RBAC Protection) */}
              <Route path="/control-center" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="organizations" element={<AdminOrganizationsPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
              </Route>

              {/* 404 Catch-All */}
              <Route
                path="*"
                element={
                  <div className="theme-page min-h-screen flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-4">
                      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">۴۰۴</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        صفحه مورد نظر در سامانه اطلس هاب یافت نشد.
                      </p>
                      <a
                        href="/app"
                        className="inline-block text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        بازگشت به صفحه اصلی
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
