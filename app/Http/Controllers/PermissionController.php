<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;

class PermissionController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of permissions.
     */
    public function index(Request $request): Response|JsonResponse
    {
        // Allow if superadmin OR has specific permission
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.view')) {
            abort(403, 'Unauthorized to view permissions.');
        }

        $query = Permission::with('roles')
            ->orderBy('name');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('guard_name', 'like', "%{$search}%");
            });
        }

        // Apply category filter
        if ($request->filled('category')) {
            $category = $request->category;
            $query->where('name', 'like', "{$category}.%");
        }

        $permissions = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        // Get categories for filter
        $categories = Permission::selectRaw('SUBSTRING_INDEX(name, ".", 1) as category')
            ->groupBy('category')
            ->pluck('category')
            ->filter()
            ->sort()
            ->values();

        if ($request->expectsJson()) {
            return response()->json([
                'permissions' => $permissions,
                'categories' => $categories,
            ]);
        }

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category']),
            'stats' => [
                'total' => Permission::count(),
                'assigned' => Permission::has('roles')->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new permission.
     */
    public function create(): Response
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.create')) {
            abort(403, 'Unauthorized to create permissions.');
        }

        $roles = Role::orderBy('name')->get();

        // Get existing categories for suggestions
        $categories = Permission::selectRaw('SUBSTRING_INDEX(name, ".", 1) as category')
            ->groupBy('category')
            ->pluck('category')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Admin/Permissions/Create', [
            'roles' => $roles,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.create')) {
            abort(403, 'Unauthorized to create permissions.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'sometimes|string|max:255',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        try {
            $permission = Permission::create([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? 'web',
            ]);

            if (!empty($validated['roles'])) {
                $roles = Role::whereIn('id', $validated['roles'])->get();
                $permission->syncRoles($roles);
            }

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Permission created successfully.',
                    'permission' => $permission->load('roles'),
                ]);
            }

            return redirect()
                ->route('admin.permissions.show', $permission)
                ->with('success', 'Permission created successfully!');

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to create permission.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create permission: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): Response|JsonResponse
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.view')) {
            abort(403, 'Unauthorized to view permissions.');
        }

        $permission->load('roles');

        if (request()->expectsJson()) {
            return response()->json([
                'permission' => $permission,
            ]);
        }

        return Inertia::render('Admin/Permissions/Show', [
            'permission' => $permission,
            'canEdit' => Auth::user()->isSuperAdmin() || Auth::user()->can('permissions.edit'),
            'canDelete' => Auth::user()->isSuperAdmin() || Auth::user()->can('permissions.delete'),
        ]);
    }

    /**
     * Show the form for editing the specified permission.
     */
    public function edit(Permission $permission): Response
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.edit')) {
            abort(403, 'Unauthorized to edit permissions.');
        }

        $permission->load('roles');
        $roles = Role::orderBy('name')->get();

        // Get existing categories for suggestions
        $categories = Permission::selectRaw('SUBSTRING_INDEX(name, ".", 1) as category')
            ->groupBy('category')
            ->pluck('category')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Admin/Permissions/Edit', [
            'permission' => $permission,
            'roles' => $roles,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(Request $request, Permission $permission)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.edit')) {
            abort(403, 'Unauthorized to update permissions.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'guard_name' => 'sometimes|string|max:255',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        try {
            $permission->update([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? $permission->guard_name,
            ]);

            if (isset($validated['roles'])) {
                $roles = Role::whereIn('id', $validated['roles'])->get();
                $permission->syncRoles($roles);
            }

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Permission updated successfully.',
                    'permission' => $permission->load('roles'),
                ]);
            }

            return redirect()
                ->route('admin.permissions.show', $permission)
                ->with('success', 'Permission updated successfully!');

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to update permission.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to update permission: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Request $request, Permission $permission)
    {
        if (!Auth::user()->isSuperAdmin() && !Auth::user()->can('permissions.delete')) {
            abort(403, 'Unauthorized to delete permissions.');
        }

        // Check if permission is assigned to roles
        if ($permission->roles()->count() > 0) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Cannot delete permission that is assigned to roles.',
                ], 422);
            }

            return redirect()
                ->back()
                ->with('error', 'Cannot delete permission that is assigned to roles.');
        }

        try {
            $permissionName = $permission->name;
            $permission->delete();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Permission deleted successfully.',
                ]);
            }

            return redirect()
                ->route('admin.permissions.index')
                ->with('success', "Permission '{$permissionName}' deleted successfully!");

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to delete permission.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to delete permission: ' . $e->getMessage());
        }
    }
}