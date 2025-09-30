<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile.
     */
    public function show(?User $user = null): Response|JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization: users can view their own profile, superadmins can view any profile
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to view this profile.');
        }

        $targetUser->load(['profile', 'businesses', 'createdBusinesses'])
                   ->loadCount(['businesses', 'createdBusinesses']);

        if (request()->expectsJson()) {
            return response()->json([
                'user' => $targetUser,
                'can_edit' => $this->canEditProfile($targetUser),
            ]);
        }

        return Inertia::render('Profile/Show', [
            'user' => $targetUser,
            'canEdit' => $this->canEditProfile($targetUser),
        ]);
    }

    /**
     * Show the form for editing the profile.
     */
    public function edit(): Response
    {
        $user = Auth::user()->load('profile');

        return Inertia::render('Profile/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request, ?User $user = null): JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to edit this profile.');
        }

        $validated = $request->validate([
            // Basic user info
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->ignore($targetUser->id),
            ],
            
            // Profile information
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female',
            'job_title' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'employee_id' => 'nullable|string|max:50',
            
            // System fields (only superadmin can modify)
            'role' => [
                'sometimes',
                'string',
                'max:50',
                function ($attribute, $value, $fail) {
                    if (!Auth::user()->isSuperAdmin()) {
                        $fail('Only superadmins can modify user roles.');
                    }
                },
            ],
            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive', 'suspended']),
                function ($attribute, $value, $fail) {
                    if (!Auth::user()->isSuperAdmin()) {
                        $fail('Only superadmins can modify user status.');
                    }
                },
            ],
            
            // Preferences
            'preferences' => 'nullable|array',
            'preferences.timezone' => 'nullable|string|max:50',
            'preferences.language' => 'nullable|string|max:10',
            'preferences.notifications' => 'nullable|array',
            'preferences.theme' => 'nullable|in:light,dark,auto',
        ]);

        try {
            // Update basic user info
            $userFields = array_intersect_key($validated, array_flip(['name', 'email']));
            if (!empty($userFields)) {
                $targetUser->update($userFields);
            }

            // Update profile info
            $profileFields = array_diff_key($validated, array_flip(['name', 'email']));
            if (!empty($profileFields)) {
                $targetUser->profile()->updateOrCreate(
                    ['user_id' => $targetUser->id],
                    $profileFields
                );
            }

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $targetUser->fresh(['profile']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update profile.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload and update user avatar.
     */
    public function updateAvatar(Request $request, ?User $user = null): JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to update this avatar.');
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            // Delete old avatar if exists
            if ($targetUser->profile?->avatar) {
                Storage::disk('public')->delete($targetUser->profile->avatar);
            }

            // Store new avatar
            $path = $request->file('avatar')->store('avatars', 'public');

            // Update profile
            $targetUser->profile()->updateOrCreate(
                ['user_id' => $targetUser->id],
                ['avatar' => $path]
            );

            return response()->json([
                'message' => 'Avatar updated successfully.',
                'avatar_url' => $targetUser->fresh()->avatar_url,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update avatar.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete user avatar.
     */
    public function deleteAvatar(?User $user = null): JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to delete this avatar.');
        }

        try {
            if ($targetUser->profile?->avatar) {
                // Delete file from storage
                Storage::disk('public')->delete($targetUser->profile->avatar);
                
                // Update profile
                $targetUser->profile->update(['avatar' => null]);
            }

            return response()->json([
                'message' => 'Avatar deleted successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete avatar.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user's last login timestamp.
     */
    public function updateLastLogin(): JsonResponse
    {
        $user = Auth::user();
        
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['last_login' => now()]
        );

        return response()->json([
            'message' => 'Last login updated.',
            'last_login' => $user->profile->last_login,
        ]);
    }

    /**
     * Get user's business memberships.
     */
    public function businesses(?User $user = null): JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to view business memberships.');
        }

        $businesses = $targetUser->businesses()
            ->with(['creator'])
            ->wherePivot('employment_status', 'active')
            ->get()
            ->map(function ($business) {
                return [
                    'id' => $business->id,
                    'name' => $business->name,
                    'slug' => $business->slug,
                    'industry' => $business->industry,
                    'role' => $business->pivot->business_role,
                    'joined_date' => $business->pivot->joined_date,
                    'employment_status' => $business->pivot->employment_status,
                ];
            });

        return response()->json([
            'businesses' => $businesses,
        ]);
    }

    /**
     * Get user statistics.
     */
    public function stats(?User $user = null): JsonResponse
    {
        $targetUser = $user ?? Auth::user();
        
        // Authorization
        if ($targetUser->id !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to view user statistics.');
        }

        $stats = [
            'businesses_count' => $targetUser->businesses()->count(),
            'active_businesses_count' => $targetUser->activeBusinesses()->count(),
            'owned_businesses_count' => $targetUser->ownedBusinesses()->count(),
            'created_businesses_count' => $targetUser->createdBusinesses()->count(),
            'last_login' => $targetUser->profile?->last_login,
            'member_since' => $targetUser->created_at,
        ];

        return response()->json($stats);
    }

    /**
     * Check if the current user can edit a profile.
     */
    private function canEditProfile(User $targetUser): bool
    {
        return $targetUser->id === Auth::id() || Auth::user()->isSuperAdmin();
    }
}
