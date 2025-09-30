<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any users.
     */
    public function viewAny(User $user): bool
    {
        // Superadmin can view all users, others need specific permission
        return $user->isSuperAdmin() || $user->can('users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Users can view their own profile
        if ($user->id === $model->id) {
            return true;
        }

        // Superadmin can view any user, others need specific permission
        return $user->isSuperAdmin() || $user->can('users.view');
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): bool
    {
        // Superadmin can create users, others need specific permission
        return $user->isSuperAdmin() || $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Users can update their own profile (with restrictions)
        if ($user->id === $model->id) {
            return true;
        }

        // Superadmin can update anyone
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Others need specific permission
        return $user->can('users.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Cannot delete yourself
        if ($user->id === $model->id) {
            return false;
        }

        // Superadmin can delete non-superadmin users
        if ($user->isSuperAdmin() && !$model->isSuperAdmin()) {
            return true;
        }

        // Others need specific permission
        return $user->can('users.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        // Only superadmins can restore deleted users
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Only superadmins can force delete users
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can change roles.
     */
    public function changeRole(User $user, User $model, string $newRole): bool
    {
        // Cannot change your own role
        if ($user->id === $model->id) {
            return false;
        }

        // Superadmin can change any role
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Business admin can promote to business_admin, manager, or employee
        // but cannot create superadmins or demote other business admins
        if ($user->profile?->role === 'business_admin') {
            $currentRole = $model->profile?->role;
            
            // Cannot modify superadmins
            if ($currentRole === 'superadmin') {
                return false;
            }
            
            // Cannot create superadmins
            if ($newRole === 'superadmin') {
                return false;
            }
            
            // Can manage other roles
            return in_array($newRole, ['business_admin', 'manager', 'employee']);
        }

        return false;
    }

    /**
     * Determine whether the user can impersonate the model.
     */
    public function impersonate(User $user, User $model): bool
    {
        // Only superadmins can impersonate other users
        if (!$user->isSuperAdmin()) {
            return false;
        }

        // Cannot impersonate yourself
        if ($user->id === $model->id) {
            return false;
        }

        // Cannot impersonate other superadmins
        if ($model->isSuperAdmin()) {
            return false;
        }

        return true;
    }
}
