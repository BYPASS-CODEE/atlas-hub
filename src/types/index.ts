export type UserRole = 'ADMIN' | 'MANAGER' | 'TEAM_MEMBER' | 'CLIENT';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  user?: User;
  created_at: string;
}

export type ClientStatus = 'active' | 'inactive' | 'lead';

export interface Client {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  projects_count?: number;
  invoices_count?: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  organization_id: string;
  client_id?: string;
  client_name?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget?: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  organization_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  content: string;
  created_at: string;
}

export type TicketCategory = 'technical' | 'billing' | 'general' | 'feature';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  organization_id: string;
  client_id?: string;
  client_name?: string;
  user_id: string;
  user_name?: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  messages_count?: number;
  user_email?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  project_id?: string;
  project_name?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoice_id: string;
  organization_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  organization_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  clients_count: number;
  projects_count: number;
  tasks_count: number;
  pending_tasks_count: number;
  open_tickets_count: number;
  unpaid_invoices_count: number;
  total_revenue: number;
  recent_projects: Project[];
  recent_tasks: Task[];
  recent_tickets: SupportTicket[];
}

export interface ReportSummary {
  total_revenue: number;
  total_invoices_count: number;
  paid_invoices_count: number;
  total_projects_count: number;
  completed_projects_count: number;
  tasks_by_status: { status: string; count: number }[];
  projects_by_status: { status: string; count: number }[];
  revenue_by_client: { client_name: string; total: number }[];
}
