<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response|JsonResponse
    {
        // Allow if superadmin OR has specific permission
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.view')) {
            abort(403, 'Unauthorized to view roles.');
        }

        $query = Role::with('permissions')
            ->withCount(['permissions', 'users'])
            ->orderBy('name');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('guard_name', 'like', "%{$search}%");
            });
        }

        $roles = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json($roles);
        }

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search']),
            'stats' => [
                'total' => Role::count(),
                'with_permissions' => Role::has('permissions')->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.create')) {
            abort(403, 'Unauthorized to create roles.');
        }

        $permissions = Permission::orderBy('name')->get();

        return Inertia::render('Admin/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.create')) {
            abort(403, 'Unauthorized to create roles.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'guard_name' => 'sometimes|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? 'web',
            ]);

            if (!empty($validated['permissions'])) {
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
            }

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Role created successfully.',
                    'role' => $role->load('permissions'),
                ]);
            }

            return redirect()
                ->route('admin.roles.show', $role)
                ->with('success', 'Role created successfully!');

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to create role.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create role: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response|JsonResponse
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.view')) {
            abort(403, 'Unauthorized to view roles.');
        }

        $role->load(['permissions', 'users'])
              ->loadCount(['permissions', 'users']);

        if (request()->expectsJson()) {
            return response()->json([
                'role' => $role,
            ]);
        }

        return Inertia::render('Admin/Roles/Show', [
            'role' => $role,
            'canEdit' => Auth::user()->isSuperAdmin() || Auth::user()->can('roles.edit'),
            'canDelete' => (Auth::user()->isSuperAdmin() || Auth::user()->can('roles.delete')) && $role->users->count() === 0,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.edit')) {
            abort(403, 'Unauthorized to edit roles.');
        }

        $role->load('permissions');
        $permissions = Permission::orderBy('name')->get();

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.edit')) {
            abort(403, 'Unauthorized to update roles.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'guard_name' => 'sometimes|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            $role->update([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? $role->guard_name,
            ]);

            if (isset($validated['permissions'])) {
                $permissions = Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
            }

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Role updated successfully.',
                    'role' => $role->load('permissions'),
                ]);
            }

            return redirect()
                ->route('admin.roles.show', $role)
                ->with('success', 'Role updated successfully!');

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to update role.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to update role: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Request $request, Role $role)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('roles.delete')) {
            abort(403, 'Unauthorized to delete roles.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Cannot delete role that is assigned to users.',
                ], 422);
            }

            return redirect()
                ->back()
                ->with('error', 'Cannot delete role that is assigned to users.');
        }

        try {
            $roleName = $role->name;
            $role->delete();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Role deleted successfully.',
                ]);
            }

            return redirect()
                ->route('admin.roles.index')
                ->with('success', "Role '{$roleName}' deleted successfully!");

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to delete role.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to delete role: ' . $e->getMessage());
        }
    }
}