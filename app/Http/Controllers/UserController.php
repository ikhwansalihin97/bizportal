<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use AuthorizesRequests;

    /**
     * Get role description for display.
     */
    private function getRoleDescription(string $roleName): string
    {
        $descriptions = [
            'superadmin' => 'Full system access and control',
            'admin' => 'Administrative access to assigned areas',
            'manager' => 'Team and project management capabilities',
            'employee' => 'Standard user access',
            'viewer' => 'Read-only access',
            'business_admin' => 'Business-level administrative access',
            'business_owner' => 'Full business ownership and control',
            'business_manager' => 'Business management capabilities',
            'business_employee' => 'Business employee access',
        ];

        return $descriptions[$roleName] ?? 'User role with standard permissions';
    }

    /**
     * Format role name for display.
     */
    private function formatRoleName(string $roleName): string
    {
        $formatted = str_replace(['_', '-'], ' ', $roleName);
        return ucwords($formatted);
    }

    /**
     * Display a listing of users (admin only).
     */
    public function index(Request $request): Response|JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::with(['profile', 'roles'])
            ->withCount(['businesses', 'createdBusinesses'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($profile) use ($search) {
                      $profile->where('job_title', 'like', "%{$search}%")
                              ->orWhere('department', 'like', "%{$search}%")
                              ->orWhere('employee_id', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('profile', function ($profile) use ($request) {
                $profile->where('role', $request->role);
            });
        }

        if ($request->filled('status')) {
            $query->whereHas('profile', function ($profile) use ($request) {
                $profile->where('status', $request->status);
            });
        }

        if ($request->filled('verified')) {
            if ($request->verified === 'verified') {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json($users);
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status', 'verified']),
            'stats' => [
                'total' => User::count(),
                'active' => User::whereHas('profile', fn($q) => $q->where('status', 'active'))->count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
                'superadmins' => User::whereHas('profile', fn($q) => $q->where('role', 'superadmin'))->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        // Get available roles from Spatie
        $availableRoles = Role::orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'value' => $role->name,
                    'label' => $this->formatRoleName($role->name),
                    'description' => $this->getRoleDescription($role->name),
                    'permissions_count' => $role->permissions()->count(),
                ];
            });

        return Inertia::render('Admin/Users/Create', [
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
            'send_welcome_email' => 'boolean',
            
            // Profile fields
            'job_title' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'employee_id' => 'nullable|string|max:255|unique:user_profiles,employee_id',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female',
            'role' => [
                'required',
                'string',
                Rule::in(Role::pluck('name')->toArray())
            ],
            'status' => 'required|in:active,inactive,suspended',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            // Create the user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), // Auto-verify admin-created users
                'created_by' => Auth::id(),
            ]);

            // Update the automatically created profile
            $user->profile->update([
                'job_title' => $validated['job_title'],
                'department' => $validated['department'],
                'employee_id' => $validated['employee_id'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'role' => $validated['role'],
                'status' => $validated['status'],
                'created_by' => Auth::id(),
            ]);

            // Assign Spatie role to user
            $user->assignRole($validated['role']);

            // TODO: Send welcome email if requested
            if ($validated['send_welcome_email'] ?? false) {
                // Mail::to($user)->send(new WelcomeEmail($user, $validated['password']));
            }

            DB::commit();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'User created successfully.',
                    'user' => $user->load('profile'),
                ], 201);
            }

            return redirect()
                ->route('admin.users.show', $user)
                ->with('success', 'User created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to create user.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create user: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response|JsonResponse
    {
        $this->authorize('view', $user);

        $user->load(['profile', 'businesses', 'createdBusinesses', 'roles'])
             ->loadCount(['businesses', 'createdBusinesses']);

        if (request()->expectsJson()) {
            return response()->json([
                'user' => $user,
                'can_edit' => Auth::user()->can('update', $user),
                'can_delete' => Auth::user()->can('delete', $user),
            ]);
        }

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'canEdit' => Auth::user()->can('update', $user),
            'canDelete' => Auth::user()->can('delete', $user),
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        $user->load(['profile', 'roles']);

        // Get available roles from Spatie
        $availableRoles = Role::orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'value' => $role->name,
                    'label' => $this->formatRoleName($role->name),
                    'description' => $this->getRoleDescription($role->name),
                    'permissions_count' => $role->permissions()->count(),
                ];
            });

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            
            // Profile fields
            'job_title' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'employee_id' => ['nullable', 'string', 'max:255', Rule::unique('user_profiles')->ignore($user->profile->id)],
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female',
            'role' => [
                'required',
                'string',
                Rule::in(Role::pluck('name')->toArray())
            ],
            'status' => 'required|in:active,inactive,suspended',
        ]);

        try {
            DB::beginTransaction();

            // Update user basic info
            $userUpdate = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'updated_by' => Auth::id(),
            ];

            if (!empty($validated['password'])) {
                $userUpdate['password'] = Hash::make($validated['password']);
            }

            $user->update($userUpdate);

            // Update profile
            $user->profile->update([
                'job_title' => $validated['job_title'],
                'department' => $validated['department'],
                'employee_id' => $validated['employee_id'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'role' => $validated['role'],
                'status' => $validated['status'],
                'updated_by' => Auth::id(),
            ]);

            // Update Spatie role assignment
            $user->syncRoles([$validated['role']]);

            DB::commit();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'User updated successfully.',
                    'user' => $user->fresh(['profile']),
                ]);
            }

            return redirect()
                ->route('admin.users.show', $user)
                ->with('success', 'User updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to update user.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to update user: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        // Check if user is the only superadmin
        if ($user->isSuperAdmin()) {
            $superadminCount = User::whereHas('profile', fn($q) => $q->where('role', 'superadmin'))->count();
            if ($superadminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last superadmin account.',
                ], 422);
            }
        }

        try {
            $user->update(['deleted_by' => Auth::id()]);
            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore(User $user): JsonResponse
    {
        $this->authorize('restore', $user);

        $user->restore();

        return response()->json([
            'message' => 'User restored successfully.',
            'user' => $user->fresh(['profile']),
        ]);
    }

    /**
     * Toggle user status between active and inactive.
     */
    public function toggleStatus(User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $newStatus = $user->profile->status === 'active' ? 'inactive' : 'active';
        
        $user->profile->update([
            'status' => $newStatus,
            'updated_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => "User {$newStatus} successfully.",
            'user' => $user->fresh(['profile']),
        ]);
    }

    /**
     * Send email verification to user.
     */
    public function sendVerification(User $user): JsonResponse
    {
        $this->authorize('update', $user);

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'User email is already verified.',
            ], 422);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification email sent successfully.',
        ]);
    }

    /**
     * Manually verify user email.
     */
    public function verifyEmail(User $user): JsonResponse
    {
        $this->authorize('update', $user);

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'User email is already verified.',
            ], 422);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'message' => 'User email verified successfully.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Get user statistics for dashboard.
     */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $stats = [
            'total_users' => User::count(),
            'active_users' => User::whereHas('profile', fn($q) => $q->where('status', 'active'))->count(),
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'recent_users' => User::where('created_at', '>=', now()->subDays(7))->count(),
            'superadmins' => User::whereHas('profile', fn($q) => $q->where('role', 'superadmin'))->count(),
            'business_admins' => User::whereHas('profile', fn($q) => $q->where('role', 'business-admin'))->count(),
            'managers' => User::whereHas('profile', fn($q) => $q->where('role', 'manager'))->count(),
            'employees' => User::whereHas('profile', fn($q) => $q->where('role', 'employee'))->count(),
            'suspended_users' => User::whereHas('profile', fn($q) => $q->where('status', 'suspended'))->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get available roles for assignment.
     */
    public function roles(): JsonResponse
    {
        $roles = Role::orderBy('name')->get()->mapWithKeys(function ($role) {
            return [$role->name => $role->description ?? $role->name];
        })->toArray();

        return response()->json($roles);
    }

    /**
     * Get role descriptions.
     */
    public function roleDescriptions(): JsonResponse
    {
        $descriptions = Role::orderBy('name')->get()->mapWithKeys(function ($role) {
            return [$role->name => $role->description ?? 'No description available'];
        })->toArray();

        return response()->json($descriptions);
    }


}
