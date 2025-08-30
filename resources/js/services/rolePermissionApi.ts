import { router } from '@inertiajs/react';
import type { 
  Role, 
  Permission, 
  RoleFormData, 
  PermissionFormData,
  RoleFilters,
  PermissionFilters,
  RolePaginatedResponse,
  PermissionPaginatedResponse 
} from '@/types';

class RolePermissionApi {
  // Role API methods
  async getRoles(filters: RoleFilters = {}): Promise<RolePaginatedResponse> {
    return new Promise((resolve) => {
      router.get('/admin/roles', filters, {
        onSuccess: (page) => {
          resolve(page.props.roles as RolePaginatedResponse);
        },
      });
    });
  }

  async getRole(id: number): Promise<Role> {
    return new Promise((resolve) => {
      router.get(`/admin/roles/${id}`, {}, {
        onSuccess: (page) => {
          resolve(page.props.role as Role);
        },
      });
    });
  }

  async createRole(data: RoleFormData): Promise<Role> {
    return new Promise((resolve, reject) => {
      router.post('/admin/roles', data, {
        onSuccess: (page) => {
          resolve(page.props.role as Role);
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  async updateRole(id: number, data: RoleFormData): Promise<Role> {
    return new Promise((resolve, reject) => {
      router.put(`/admin/roles/${id}`, data, {
        onSuccess: (page) => {
          resolve(page.props.role as Role);
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  async deleteRole(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      router.delete(`/admin/roles/${id}`, {
        onSuccess: () => {
          resolve();
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  // Permission API methods
  async getPermissions(filters: PermissionFilters = {}): Promise<PermissionPaginatedResponse> {
    return new Promise((resolve) => {
      router.get('/admin/permissions', filters, {
        onSuccess: (page) => {
          resolve(page.props.permissions as PermissionPaginatedResponse);
        },
      });
    });
  }

  async getPermission(id: number): Promise<Permission> {
    return new Promise((resolve) => {
      router.get(`/admin/permissions/${id}`, {}, {
        onSuccess: (page) => {
          resolve(page.props.permission as Permission);
        },
      });
    });
  }

  async createPermission(data: PermissionFormData): Promise<Permission> {
    return new Promise((resolve, reject) => {
      router.post('/admin/permissions', data, {
        onSuccess: (page) => {
          resolve(page.props.permission as Permission);
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  async updatePermission(id: number, data: PermissionFormData): Promise<Permission> {
    return new Promise((resolve, reject) => {
      router.put(`/admin/permissions/${id}`, data, {
        onSuccess: (page) => {
          resolve(page.props.permission as Permission);
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  async deletePermission(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      router.delete(`/admin/permissions/${id}`, {
        onSuccess: () => {
          resolve();
        },
        onError: (errors) => {
          reject(errors);
        },
      });
    });
  }

  // Utility methods
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return [];
    }
  }
}

export default new RolePermissionApi();
