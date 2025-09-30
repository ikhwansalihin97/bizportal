import { router } from '@inertiajs/react';
import type {
  Business,
  BusinessFormData,
  BusinessFilters,
  BusinessDashboard,
  BusinessUser,
  PaginatedResponse,
  ApiResponse,
  BusinessInvitation,
  Industry,
} from '@/types';

class BusinessApiService {
  private baseUrl = '/api/businesses';

  /**
   * Get paginated list of businesses
   */
  async getBusinesses(filters: BusinessFilters = {}): Promise<PaginatedResponse<Business>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch businesses: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single business by slug
   */
  async getBusiness(slug: string): Promise<Business> {
    const response = await fetch(`${this.baseUrl}/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch business: ${response.statusText}`);
    }

    const data = await response.json();
    return data.business || data;
  }

  /**
   * Create a new business
   */
  async createBusiness(data: BusinessFormData): Promise<ApiResponse<Business>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create business');
    }

    return result;
  }

  /**
   * Update a business
   */
  async updateBusiness(slug: string, data: Partial<BusinessFormData>): Promise<ApiResponse<Business>> {
    const response = await fetch(`${this.baseUrl}/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update business');
    }

    return result;
  }

  /**
   * Delete a business (soft delete)
   */
  async deleteBusiness(slug: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${slug}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete business');
    }

    return result;
  }

  /**
   * Restore a deleted business
   */
  async restoreBusiness(id: number): Promise<ApiResponse<Business>> {
    const response = await fetch(`${this.baseUrl}/${id}/restore`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to restore business');
    }

    return result;
  }

  /**
   * Get business dashboard data
   */
  async getBusinessDashboard(slug: string): Promise<BusinessDashboard> {
    const response = await fetch(`${this.baseUrl}/${slug}/dashboard`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch business dashboard: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get business users
   */
  async getBusinessUsers(slug: string, filters: { role?: string; status?: string; search?: string } = {}): Promise<PaginatedResponse<BusinessUser>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/${slug}/users?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch business users: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Invite user to business
   */
  async inviteUser(slug: string, data: { email: string; business_role: string; permissions?: any; notes?: string }): Promise<ApiResponse<BusinessUser>> {
    const response = await fetch(`${this.baseUrl}/${slug}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to invite user');
    }

    return result;
  }

  /**
   * Update user role in business
   */
  async updateUserRole(slug: string, userId: number, data: { business_role?: string; permissions?: any; employment_status?: string; notes?: string }): Promise<ApiResponse<BusinessUser>> {
    const response = await fetch(`${this.baseUrl}/${slug}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update user role');
    }

    return result;
  }

  /**
   * Remove user from business
   */
  async removeUser(slug: string, userId: number): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${slug}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove user');
    }

    return result;
  }

  /**
   * Get pending invitations for current user
   */
  async getPendingInvitations(): Promise<BusinessInvitation[]> {
    const response = await fetch('/api/invitations/pending', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pending invitations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.invitations || [];
  }

  /**
   * Accept business invitation
   */
  async acceptInvitation(token: string): Promise<ApiResponse> {
    const response = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to accept invitation');
    }

    return result;
  }

  /**
   * Decline business invitation
   */
  async declineInvitation(token: string): Promise<ApiResponse> {
    const response = await fetch('/api/invitations/decline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to decline invitation');
    }

    return result;
  }

  /**
   * Get list of industries
   */
  async getIndustries(): Promise<Industry[]> {
    const response = await fetch('/api/industries', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch industries: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Navigate to business page using Inertia
   */
  visitBusiness(slug: string) {
    router.visit(`/businesses/${slug}`);
  }

  /**
   * Navigate to business edit page using Inertia
   */
  visitBusinessEdit(slug: string) {
    router.visit(`/businesses/${slug}/edit`);
  }

  /**
   * Navigate to business users page using Inertia
   */
  visitBusinessUsers(slug: string) {
    router.visit(`/businesses/${slug}/users`);
  }

  /**
   * Get CSRF token from meta tag
   */
  private getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return meta?.content || '';
  }
}

// Export singleton instance
export const businessApi = new BusinessApiService();
export default businessApi;
