<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class BusinessUserController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display users for a specific business.
     */
    public function index(Business $business, Request $request): Response|JsonResponse
    {
        $this->authorize('viewUsers', $business);

        $query = $business->users()
            ->with(['profile'])
            ->withPivot([
                'business_role',
                'employment_status', 
                'joined_date',
                'left_date',
                'invited_by'
            ]);

        // Apply filters
        if ($request->filled('role')) {
            $query->wherePivot('business_role', $request->role);
        }

        if ($request->filled('status')) {
            $query->wherePivot('employment_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($profile) use ($search) {
                      $profile->where('job_title', 'like', "%{$search}%")
                              ->orWhere('department', 'like', "%{$search}%");
                  });
            });
        }

        $users = $query->orderByPivot('joined_date', 'desc')
            ->paginate($request->get('per_page', 15))
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json($users);
        }

        // Debug logging
        $user = Auth::user();
        $isSuperAdmin = $user->isSuperAdmin();
        $canCreatePermission = $user->can('users.create');
        $allPermissions = $user->getAllPermissions()->pluck('name')->toArray();

        return Inertia::render('Business/Users/Index', [
            'business' => $business,
            'users' => $users,
            'filters' => $request->only(['role', 'status', 'search']),
            'canManageUsers' => Auth::user()->canManageBusiness($business),
            'canCreateUsers' => Auth::user()->isSuperAdmin() || Auth::user()->can('users.create'),
        ]);
    }

    /**
     * Show form to invite a user to the business.
     */
    public function invite(Business $business): Response
    {
        $this->authorize('inviteUsers', $business);

        // Get users who are not already part of this business
        $availableUsers = User::whereNotIn('id', function ($query) use ($business) {
            $query->select('user_id')
                  ->from('business_users')
                  ->where('business_id', $business->id)
                  ->whereNull('deleted_at');
        })
        ->with('profile')
        ->where('id', '!=', Auth::id()) // Exclude current user
        ->orderBy('name')
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => $user->profile?->job_title,
                'department' => $user->profile?->department,
                'role' => $user->profile?->role,
                'status' => $user->profile?->status,
            ];
        });

        // Available business roles (simplified to owner/employee)
        $availableRoles = [
            [
                'value' => 'owner',
                'label' => 'Owner',
                'description' => 'Full access to everything in this business',
                'permissions_count' => 0,
            ],
            [
                'value' => 'employee',
                'label' => 'Employee',
                'description' => 'Access based on assigned roles and permissions',
                'permissions_count' => 0,
            ],
        ];

        return Inertia::render('Business/Users/Invite', [
            'business' => $business,
            'availableUsers' => $availableUsers,
            'availableRoles' => $availableRoles,
        ]);
    }



    /**
     * Invite a user to join the business.
     */
    public function sendInvite(Business $business, Request $request)
    {
        $this->authorize('inviteUsers', $business);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'business_role' => 'required|string|max:50',
            'permissions' => 'nullable|array',
            'notes' => 'nullable|string|max:500',
        ]);

        // Additional validation: ensure the user is not already part of this business
        $userAlreadyExists = $business->users()
            ->where('user_id', $validated['user_id'])
            ->whereNull('business_users.deleted_at')
            ->exists();

        if ($userAlreadyExists) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'User is already a member of this business.',
                ], 422);
            }
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'User is already a member of this business.');
        }

        $user = User::findOrFail($validated['user_id']);

        try {
            DB::beginTransaction();

            // Create invitation token
            $invitationToken = Str::random(32);

            // Add user to business with pending status
            $business->users()->attach($user->id, [
                'business_role' => $validated['business_role'],
                'permissions' => json_encode($validated['permissions'] ?? []),
                'employment_status' => 'active', // Set to active immediately for now
                'joined_date' => now(),
                'notes' => $validated['notes'],
                'invitation_token' => $invitationToken,
                'invitation_sent_at' => now(),
                'invited_by' => Auth::id(),
            ]);

            // TODO: Send invitation email here
            // Mail::to($user)->send(new BusinessInvitation($business, $invitationToken));

            DB::commit();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'User invited successfully.',
                    'user' => $user->load('profile'),
                ], 201);
            }

            return redirect()
                ->route('businesses.users.index', $business->slug)
                ->with('success', 'User invited successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to invite user.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to invite user: ' . $e->getMessage());
        }
    }

    /**
     * Display a specific user's details in the business.
     */
    public function show(Business $business, User $user): Response|JsonResponse
    {
        $this->authorize('viewUsers', $business);

        // Verify user belongs to this business
        if (!$business->hasUser($user)) {
            abort(404, 'User not found in this business.');
        }

        $userWithPivot = $business->users()
            ->with(['profile'])
            ->where('user_id', $user->id)
            ->first();

        if (request()->expectsJson()) {
            return response()->json([
                'user' => $userWithPivot,
                'business' => $business,
                'can_manage' => Auth::user()->canManageBusiness($business),
            ]);
        }

        return Inertia::render('Business/Users/Show', [
            'user' => $userWithPivot,
            'business' => $business,
            'canManage' => Auth::user()->canManageBusiness($business),
        ]);
    }

    /**
     * Update a user's role and permissions in the business.
     */
    public function update(Business $business, User $user, Request $request)
    {
        $this->authorize('manageUsers', $business);

        // Verify user belongs to this business
        if (!$business->hasUser($user)) {
            abort(404, 'User not found in this business.');
        }

        $validated = $request->validate([
            'business_role' => 'sometimes|string|max:50',
            'permissions' => 'nullable|array',
            'employment_status' => 'sometimes|in:active,inactive,terminated',
            'notes' => 'nullable|string|max:500',
        ]);

        // Prevent self-demotion from owner role
        if (Auth::id() === $user->id && 
            isset($validated['business_role']) && 
            $business->userHasRole($user, 'owner') && 
            $validated['business_role'] !== 'owner') {
            
            return response()->json([
                'message' => 'You cannot demote yourself from owner role.',
            ], 422);
        }

        // Set left_date if terminating
        if (isset($validated['employment_status']) && $validated['employment_status'] === 'terminated') {
            $validated['left_date'] = now();
        }

        // JSON encode permissions if provided
        if (isset($validated['permissions'])) {
            $validated['permissions'] = json_encode($validated['permissions']);
        }

        $business->users()->updateExistingPivot($user->id, $validated);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'User role updated successfully.',
                'user' => $business->users()
                    ->with('profile')
                    ->where('user_id', $user->id)
                    ->first(),
            ]);
        }

        return redirect()
            ->route('businesses.users.show', [$business->slug, $user])
            ->with('success', 'User role updated successfully!');
    }

    /**
     * Remove a user from the business.
     */
    public function destroy(Request $request, Business $business, User $user)
    {
        $this->authorize('manageUsers', $business);

        // Verify user belongs to this business
        if (!$business->hasUser($user)) {
            abort(404, 'User not found in this business.');
        }

        // Prevent self-removal if user is the only owner
        if (Auth::id() === $user->id && $business->userHasRole($user, 'owner')) {
            $ownerCount = $business->owners()->count();
            if ($ownerCount <= 1) {
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Cannot remove the last owner from the business.',
                    ], 422);
                }
                return redirect()
                    ->back()
                    ->with('error', 'Cannot remove the last owner from the business.');
            }
        }

        try {
            $business->removeUser($user);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'User removed from business successfully.',
                ]);
            }

            return redirect()
                ->route('businesses.users.index', $business->slug)
                ->with('success', 'User removed from business successfully!');

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to remove user from business.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to remove user from business: ' . $e->getMessage());
        }
    }

    /**
     * Accept a business invitation.
     */
    public function acceptInvitation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();
        $token = $validated['token'];

        // Find the business invitation
        $business = Business::whereHas('users', function ($query) use ($user, $token) {
            $query->where('user_id', $user->id)
                  ->where('invitation_token', $token)
                  ->whereNull('invitation_accepted_at');
        })->first();

        if (!$business) {
            return response()->json([
                'message' => 'Invalid or expired invitation.',
            ], 404);
        }

        // Mark invitation as accepted
        $business->users()->updateExistingPivot($user->id, [
            'invitation_accepted_at' => now(),
            'invitation_token' => null,
        ]);

        return response()->json([
            'message' => 'Invitation accepted successfully.',
            'business' => $business,
        ]);
    }

    /**
     * Decline a business invitation.
     */
    public function declineInvitation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();
        $token = $validated['token'];

        // Find and remove the business invitation
        $business = Business::whereHas('users', function ($query) use ($user, $token) {
            $query->where('user_id', $user->id)
                  ->where('invitation_token', $token)
                  ->whereNull('invitation_accepted_at');
        })->first();

        if (!$business) {
            return response()->json([
                'message' => 'Invalid or expired invitation.',
            ], 404);
        }

        // Remove the user from the business
        $business->users()->detach($user->id);

        return response()->json([
            'message' => 'Invitation declined successfully.',
        ]);
    }

    /**
     * Get pending invitations for the current user.
     */
    public function pendingInvitations(): JsonResponse
    {
        $user = Auth::user();

        $invitations = $user->businesses()
            ->wherePivotNotNull('invitation_token')
            ->wherePivotNull('invitation_accepted_at')
            ->with(['creator'])
            ->get()
            ->map(function ($business) {
                return [
                    'business' => $business,
                    'role' => $business->pivot->business_role,
                    'invited_at' => $business->pivot->invitation_sent_at,
                    'token' => $business->pivot->invitation_token,
                ];
            });

        return response()->json([
            'invitations' => $invitations,
        ]);
    }

    /**
     * Get available roles for assignment.
     */
    public function roles(): JsonResponse
    {
        $roles = [
            'owner' => 'Business Owner - Full access to everything',
            'employee' => 'Employee - Access based on assigned roles and permissions',
        ];

        return response()->json($roles);
    }
}
