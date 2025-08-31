<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BusinessPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any businesses.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view businesses (filtered by their access)
        return true;
    }

    /**
     * Determine whether the user can view the business.
     */
    public function view(User $user, Business $business): bool
    {
        // Superadmin can view all businesses
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users can view businesses they belong to
        return $user->belongsToBusiness($business);
    }

    /**
     * Determine whether the user can create businesses.
     */
    public function create(User $user): bool
    {
        // Superadmin and business_admin can create businesses
        return $user->isSuperAdmin() || $user->profile?->role === 'business_admin';
    }

    /**
     * Determine whether the user can update the business.
     */
    public function update(User $user, Business $business): bool
    {
        // Superadmin can update any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Business owners and admins can update their business
        return $user->canManageBusiness($business);
    }

    /**
     * Determine whether the user can delete the business.
     */
    public function delete(User $user, Business $business): bool
    {
        // Superadmin can delete any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Only business owners can delete their business
        return $user->hasRoleInBusiness($business, 'owner');
    }

    /**
     * Determine whether the user can restore the business.
     */
    public function restore(User $user, Business $business): bool
    {
        // Only superadmin can restore deleted businesses
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can permanently delete the business.
     */
    public function forceDelete(User $user, Business $business): bool
    {
        // Only superadmin can force delete businesses
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can view users in the business.
     */
    public function viewUsers(User $user, Business $business): bool
    {
        // Superadmin can view users in any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users with relevant permissions can view users
        if ($user->can('users.view') || $user->can('users.create') || $user->can('users.invite')) {
            return true;
        }

        // Users can view other users in businesses they belong to
        return $user->belongsToBusiness($business);
    }

    /**
     * Determine whether the user can invite users to the business.
     */
    public function inviteUsers(User $user, Business $business): bool
    {
        // Superadmin can invite users to any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Business owners can invite users
        if ($user->hasRoleInBusiness($business, 'owner')) {
            return true;
        }

        // Users with specific permissions can invite users
        if ($user->can('users.create') || $user->can('users.invite')) {
            return true;
        }

        // Fallback to canManageBusiness for backward compatibility
        return $user->canManageBusiness($business);
    }

    /**
     * Determine whether the user can manage users in the business.
     */
    public function manageUsers(User $user, Business $business): bool
    {
        // Superadmin can manage users in any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Business owners and admins can manage users
        return $user->canManageBusiness($business);
    }

    /**
     * Determine whether the user can manage a specific user in the business.
     */
    public function manageUser(User $user, Business $business, User $targetUser): bool
    {
        // Superadmin can manage any user
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users cannot manage themselves in certain operations
        if ($user->id === $targetUser->id) {
            return false;
        }

        // Business owners can manage all users
        if ($user->hasRoleInBusiness($business, 'owner')) {
            return true;
        }

        // Business admins can manage non-owners
        if ($user->hasRoleInBusiness($business, 'admin')) {
            return !$targetUser->hasRoleInBusiness($business, 'owner');
        }

        return false;
    }

    /**
     * Determine whether the user can view business analytics/dashboard.
     */
    public function viewAnalytics(User $user, Business $business): bool
    {
        // Superadmin can view analytics for any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Business owners, admins, and managers can view analytics
        $role = $user->getRoleInBusiness($business);
        return in_array($role, ['owner', 'admin', 'manager']);
    }

    /**
     * Determine whether the user can manage business settings.
     */
    public function manageSettings(User $user, Business $business): bool
    {
        // Superadmin can manage settings for any business
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Only business owners and admins can manage settings
        return $user->canManageBusiness($business);
    }
}
