<?php

namespace App\Http\Controllers;

use App\Http\Controllers\BusinessFeatureController;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of businesses.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $user = Auth::user();
        
        // Build query based on user permissions
        $query = Business::with(['creator', 'users'])
            ->withCount(['activeUsers', 'users']);

        // Superadmin sees all businesses
        if (!$user->isSuperAdmin()) {
            // Regular users only see businesses they belong to
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->where('employment_status', 'active');
            });
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('industry', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if ($request->filled('industry')) {
            $query->where('industry', $request->industry);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('subscription_plan')) {
            $query->where('subscription_plan', $request->subscription_plan);
        }

        $businesses = $query->latest()
            ->paginate($request->get('per_page', 15))
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json($businesses);
        }

        return Inertia::render('Business/Index', [
            'businesses' => $businesses,
            'filters' => $request->only(['search', 'industry', 'status']),
            'canCreateBusiness' => $user->isSuperAdmin() || $user->profile?->role === 'business_admin',
        ]);
    }

    /**
     * Show the form for creating a new business.
     */
    public function create(): Response
    {
        $this->authorize('create', Business::class);

        return Inertia::render('Business/Create');
    }

    /**
     * Store a newly created business.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Business::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'industry' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'established_date' => 'nullable|date|before:today',
            'employee_count' => 'nullable|integer|min:1|max:1000000',
            'subscription_plan' => 'nullable|in:free,basic,pro,enterprise',
            'settings' => 'nullable|array',
        ]);

        try {
            DB::beginTransaction();

            // Create the business
            $business = Business::create(array_merge($validated, [
                'slug' => Str::slug($validated['name']),
                'is_active' => true,
            ]));

            // Add the creator as the business owner
            $business->addUser(Auth::user(), 'owner', [], Auth::user());

            DB::commit();

            // Check if this is an API request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Business created successfully.',
                    'business' => $business->load(['creator', 'users']),
                ], 201);
            }

            // For web requests, redirect to the business show page
            return redirect()
                ->route('businesses.show', $business->slug)
                ->with('success', 'Business created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Check if this is an API request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to create business.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            // For web requests, redirect back with error
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create business: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified business.
     */
    public function show(Business $business): Response|JsonResponse
    {
        $this->authorize('view', $business);

        $business->load([
            'creator',
            'users' => function ($query) {
                $query->with('profile')
                      ->wherePivot('employment_status', 'active');
            },
            'users.profile'
        ]);

        // Get user's role in this business
        $userRole = Auth::user()->getRoleInBusiness($business);
        $canManage = Auth::user()->canManageBusiness($business);

        if (request()->expectsJson()) {
            return response()->json([
                'business' => $business,
                'user_role' => $userRole,
                'can_manage' => $canManage,
            ]);
        }

        return Inertia::render('Business/Show', [
            'business' => $business,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Show the form for editing the specified business.
     */
    public function edit(Business $business): Response
    {
        $this->authorize('update', $business);

        return Inertia::render('Business/Edit', [
            'business' => $business,
        ]);
    }

    /**
     * Update the specified business.
     */
    public function update(Request $request, Business $business)
    {
        $this->authorize('update', $business);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'industry' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'established_date' => 'nullable|date|before:today',
            'employee_count' => 'nullable|integer|min:1|max:1000000',
            'subscription_plan' => 'nullable|in:free,basic,pro,enterprise',
            'settings' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        // Update slug if name changed
        if (isset($validated['name']) && $validated['name'] !== $business->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $business->update($validated);

        // Check if this is an API request
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Business updated successfully.',
                'business' => $business->fresh(['creator', 'users']),
            ]);
        }

        // For web requests, redirect to the business show page
        return redirect()
            ->route('businesses.show', $business->slug)
            ->with('success', 'Business updated successfully!');
    }

    /**
     * Remove the specified business (soft delete).
     */
    public function destroy(Request $request, Business $business)
    {
        $this->authorize('delete', $business);

        try {
            DB::beginTransaction();

            // Soft delete the business
            $business->delete();

            // Optionally deactivate all user relationships
            $business->users()->updateExistingPivot(
                $business->users->pluck('id'),
                ['employment_status' => 'terminated', 'left_date' => now()]
            );

            DB::commit();

            // Check if this is an API request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Business deleted successfully.',
                ]);
            }

            // For web requests, redirect to businesses list
            return redirect()
                ->route('businesses.index')
                ->with('success', 'Business deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Check if this is an API request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Failed to delete business.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            // For web requests, redirect back with error
            return redirect()
                ->back()
                ->with('error', 'Failed to delete business: ' . $e->getMessage());
        }
    }

    /**
     * Restore a soft-deleted business.
     */
    public function restore(Business $business): JsonResponse
    {
        $this->authorize('restore', $business);

        $business->restore();

        return response()->json([
            'message' => 'Business restored successfully.',
            'business' => $business->fresh(['creator', 'users']),
        ]);
    }

    /**
     * Toggle business active status.
     */
    public function toggleStatus(Request $request, Business $business)
    {
        $this->authorize('update', $business);

        $newStatus = !$business->is_active;
        $business->update(['is_active' => $newStatus]);

        $message = $newStatus ? 'Business activated successfully!' : 'Business deactivated successfully!';

        // Check if this is an API request
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => $message,
                'business' => $business->fresh(['creator', 'users']),
            ]);
        }

        // For web requests, redirect back with success message
        return redirect()
            ->back()
            ->with('success', $message);
    }

    /**
     * Get business dashboard data.
     */
    public function dashboard(Business $business): Response|JsonResponse
    {
        $this->authorize('view', $business);

        $user = Auth::user();
        $userRole = $user->getRoleInBusiness($business);
        
        // Handle role display for superadmins and users without specific roles
        $displayRole = $userRole;
        if (!$displayRole) {
            if ($user->isSuperAdmin()) {
                $displayRole = 'superadmin';
            } else {
                $displayRole = 'viewer';
            }
        }
        
        $data = [
            'business' => $business->load('creator'),
            'stats' => [
                'total_users' => $business->users()->count(),
                'active_users' => $business->activeUsers()->count(),
                'owners' => $business->owners()->count(),
                'employees' => $business->employees()->count(),
            ],
            'recent_users' => $business->users()
                ->with('profile')
                ->wherePivot('employment_status', 'active')
                ->orderByPivot('joined_date', 'desc')
                ->limit(5)
                ->get(),
            'enabled_features' => $business->enabledFeatures()->get(),
            'userRole' => $displayRole,
            'canManage' => $user->canManageBusiness($business),
        ];

        // For API requests, return JSON with all data
        if (request()->expectsJson()) {
            return response()->json($data);
        }

        // For web requests, render Inertia page
        return Inertia::render('Business/Dashboard', $data);
    }

    /**
     * Get industries list for dropdown.
     */
    public function industries(): JsonResponse
    {
        $industries = [
            'Technology',
            'Healthcare',
            'Finance',
            'Education',
            'Retail',
            'Manufacturing',
            'Construction',
            'Transportation',
            'Hospitality',
            'Real Estate',
            'Legal',
            'Consulting',
            'Marketing',
            'Non-profit',
            'Government',
            'Other',
        ];

        return response()->json($industries);
    }

    /**
     * Show business features.
     */
    public function features(Business $business): Response
    {
        $this->authorize('view', $business);

        $user = Auth::user();
        $userRole = $business->users()->where('user_id', $user->id)->first()?->pivot->business_role ?? 'employee';
        $canManage = $user->isSuperAdmin() || $userRole === 'owner';

        // Get enabled features for this business
        $features = $business->enabledFeatures()->get();

        return Inertia::render('Business/Features/Index', [
            'business' => $business,
            'features' => $features,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Show a specific business feature.
     */
    public function showFeature(Business $business, string $featureSlug): Response
    {
        $this->authorize('view', $business);

        $user = Auth::user();
        $userRole = $business->users()->where('user_id', $user->id)->first()?->pivot->business_role ?? 'employee';
        $canManage = $user->isSuperAdmin() || $userRole === 'owner';

        // Get the specific feature
        $feature = $business->enabledFeatures()
            ->where('slug', $featureSlug)
            ->first();

        if (!$feature) {
            abort(404, 'Feature not found or not enabled for this business.');
        }

        return Inertia::render('Business/Features/Show', [
            'business' => $business,
            'feature' => $feature,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }
}
