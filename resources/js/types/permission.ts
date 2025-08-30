// Role and Permission related types for Spatie Laravel Permission

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  users?: User[];
  users_count?: number;
  permissions_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: Role[];
  permissions?: Permission[];
}

// Form data interfaces
export interface RoleFormData {
  name: string;
  guard_name?: string;
  permissions?: number[];
}

export interface PermissionFormData {
  name: string;
  guard_name?: string;
  roles?: number[];
}

// Filter interfaces
export interface RoleFilters {
  search?: string;
  per_page?: number;
}

export interface PermissionFilters {
  search?: string;
  category?: string;
  per_page?: number;
}

// Stats interfaces
export interface RoleStats {
  total: number;
  with_permissions: number;
}

export interface PermissionStats {
  total: number;
  assigned: number;
}

// API response interfaces
export interface RolePaginatedResponse {
  data: Role[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface PermissionPaginatedResponse {
  data: Permission[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Permission categories for organization
export const PERMISSION_CATEGORIES = [
  'users',
  'roles', 
  'permissions',
  'businesses',
  'business-users',
  'profiles',
  'settings',
  'reports',
  'analytics'
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

// Default role types
export const DEFAULT_ROLES = [
  'superadmin',
  'business-admin', 
  'manager',
  'employee',
  'viewer'
] as const;

export type DefaultRole = typeof DEFAULT_ROLES[number];

// Permission name helpers
export const getPermissionCategory = (permissionName: string): string => {
  const parts = permissionName.split('.');
  return parts[0] || 'general';
};

export const getPermissionAction = (permissionName: string): string => {
  const parts = permissionName.split('.');
  return parts[1] || 'unknown';
};

export const formatPermissionName = (permissionName: string): string => {
  return permissionName
    .split('.')
    .map(part => part.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '))
    .join(' - ');
};

export const formatRoleName = (roleName: string): string => {
  return roleName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
