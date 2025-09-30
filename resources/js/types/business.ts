export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  initials: string;
  full_title: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  user_id: number;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  avatar?: string;
  gender?: 'male' | 'female';
  job_title?: string;
  department?: string;
  employee_id?: string;
  role: 'superadmin' | 'business_admin' | 'manager' | 'employee';
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  timezone?: string;
  language?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  theme?: 'light' | 'dark' | 'auto';
  date_format?: string;
  time_format?: '12' | '24';
  currency?: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  logo?: string;
  tax_id?: string;
  registration_number?: string;
  established_date?: string;
  employee_count?: number;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  settings?: BusinessSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  creator?: User;
  logo_url?: string;
  full_address?: string;
  users_count?: number;
  active_users_count?: number;
  users?: BusinessUser[];
}

export interface BusinessSettings {
  timezone?: string;
  currency?: string;
  language?: string;
  date_format?: string;
  notifications?: string[];
  custom_fields?: Record<string, any>;
}

export interface BusinessUser {
  id: number;
  name: string;
  email: string;
  profile?: UserProfile;
  pivot: BusinessUserPivot;
}

export interface BusinessUserPivot {
  business_id: number;
  user_id: number;
  business_role: 'owner' | 'admin' | 'manager' | 'employee' | 'contractor' | 'viewer';
  permissions?: Record<string, any>;
  joined_date: string;
  left_date?: string;
  employment_status: 'active' | 'inactive' | 'terminated';
  notes?: string;
  invitation_token?: string;
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  invited_by?: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessInvitation {
  business: Business;
  role: BusinessUserPivot['business_role'];
  invited_at: string;
  token: string;
}

export interface BusinessStats {
  total_users: number;
  active_users: number;
  owners: number;
  admins: number;
  managers: number;
  employees: number;
}

export interface BusinessDashboard {
  business: Business;
  stats: BusinessStats;
  recent_users: BusinessUser[];
  user_role: BusinessUserPivot['business_role'];
  can_manage: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url?: string;
  path: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
}

export interface PaginationLink {
  url?: string;
  label: string;
  active: boolean;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Form types
export interface BusinessFormData {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  registration_number?: string;
  established_date?: string;
  employee_count?: number;
  subscription_plan?: Business['subscription_plan'];
  settings?: BusinessSettings;
  is_active?: boolean;
}

export interface BusinessFilters {
  search?: string;
  industry?: string;
  status?: 'active' | 'inactive';
  subscription_plan?: Business['subscription_plan'];
  per_page?: number;
}

export interface ProfileFormData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: UserProfile['gender'];
  job_title?: string;
  department?: string;
  employee_id?: string;
  role?: UserProfile['role'];
  status?: UserProfile['status'];
  preferences?: UserPreferences;
}

// Utility types
export type BusinessRole = BusinessUserPivot['business_role'];
export type UserRole = UserProfile['role'];
export type UserStatus = UserProfile['status'];
export type EmploymentStatus = BusinessUserPivot['employment_status'];
export type SubscriptionPlan = Business['subscription_plan'];

// Constants
export const BUSINESS_ROLES: Record<BusinessRole, string> = {
  owner: 'Business Owner',
  admin: 'Administrator',
  manager: 'Manager',
  employee: 'Employee',
  contractor: 'Contractor',
  viewer: 'Viewer',
};

export const USER_ROLES: Record<UserRole, string> = {
  superadmin: 'Super Administrator',
  business_admin: 'Business Administrator',
  manager: 'Manager',
  employee: 'Employee',
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Construction',
  'Transportation',
  'Hospitality',
  'Real Estate',
  'Legal',
  'Consulting',
  'Marketing',
  'Non-profit',
  'Government',
  'Other',
] as const;

export type Industry = typeof INDUSTRIES[number];

// Permission system interfaces
export interface BusinessPermission {
  module: string;
  action: string;
  resource?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
}

// Available business permissions
export const BUSINESS_PERMISSIONS = {
  // User Management
  'users.view': { name: 'View Users', description: 'View business users and their details', module: 'users', action: 'view' },
  'users.invite': { name: 'Invite Users', description: 'Send invitations to new users', module: 'users', action: 'invite' },
  'users.manage': { name: 'Manage Users', description: 'Edit user roles and remove users', module: 'users', action: 'manage' },
  
  // Business Management
  'business.view': { name: 'View Business', description: 'View business information and settings', module: 'business', action: 'view' },
  'business.edit': { name: 'Edit Business', description: 'Edit business information and settings', module: 'business', action: 'edit' },
  'business.delete': { name: 'Delete Business', description: 'Delete the business (owners only)', module: 'business', action: 'delete' },
  
  // Financial Management
  'finance.view': { name: 'View Finances', description: 'View financial reports and data', module: 'finance', action: 'view' },
  'finance.manage': { name: 'Manage Finances', description: 'Create and edit financial records', module: 'finance', action: 'manage' },
  
  // Project Management
  'projects.view': { name: 'View Projects', description: 'View business projects', module: 'projects', action: 'view' },
  'projects.manage': { name: 'Manage Projects', description: 'Create, edit, and delete projects', module: 'projects', action: 'manage' },
  
  // Reports
  'reports.view': { name: 'View Reports', description: 'Access business reports and analytics', module: 'reports', action: 'view' },
  'reports.export': { name: 'Export Reports', description: 'Export reports and data', module: 'reports', action: 'export' },
} as const;

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS = {
  owner: Object.keys(BUSINESS_PERMISSIONS),
  admin: [
    'users.view', 'users.invite', 'users.manage',
    'business.view', 'business.edit',
    'finance.view', 'finance.manage',
    'projects.view', 'projects.manage',
    'reports.view', 'reports.export'
  ],
  manager: [
    'users.view', 'users.invite',
    'business.view',
    'projects.view', 'projects.manage',
    'reports.view'
  ],
  employee: [
    'users.view',
    'business.view',
    'projects.view',
    'reports.view'
  ],
  contractor: [
    'business.view',
    'projects.view'
  ],
  viewer: [
    'business.view',
    'projects.view',
    'reports.view'
  ]
} as const;
