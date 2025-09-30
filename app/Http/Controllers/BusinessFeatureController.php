<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessFeature;
use App\Models\BusinessFeatureAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusinessFeatureController extends Controller
{
    /**
     * Display the feature management page for a business.
     */
    public function index(Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage business features.');
        }

        // Get all available features
        $availableFeatures = BusinessFeature::all();

        // Get currently assigned features for this business
        $assignedFeatures = BusinessFeatureAssignment::where('business_id', $business->id)
            ->with('feature')
            ->get()
            ->pluck('feature');

        // Get unassigned features
        $unassignedFeatures = $availableFeatures->diff($assignedFeatures);

        return Inertia::render('Business/Features/Index', [
            'business' => $business,
            'availableFeatures' => $availableFeatures,
            'assignedFeatures' => $assignedFeatures,
            'unassignedFeatures' => $unassignedFeatures,
            'userRole' => $userRole,
            'canManage' => $canManage,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'isSuperAdmin' => $user->isSuperAdmin(),
                'permissions' => $user->permissions->pluck('name')->toArray(),
            ],
        ]);
    }

    /**
     * Assign a feature to a business.
     */
    public function assign(Request $request, Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage business features.');
        }

        // Debug: Log all request data
        \Log::info('Feature assignment request data:', [
            'all_data' => $request->all(),
            'input' => $request->input(),
            'post_data' => $request->post(),
            'feature_id' => $request->input('feature_id'),
            'business_id' => $business->id,
            'user_id' => $user->id,
        ]);

        $validated = $request->validate([
            'feature_id' => 'required|exists:business_features,id',
        ]);

        // Check if feature is already assigned
        $existingAssignment = $business->features()->where('feature_id', $validated['feature_id'])->exists();

        if ($existingAssignment) {
            return back()->with('error', 'Feature is already assigned to this business.');
        }

        // Create the assignment
        BusinessFeatureAssignment::create([
            'business_id' => $business->id,
            'feature_id' => $validated['feature_id'],
            'enabled_by' => $user->id,
            'is_enabled' => true, // Enable the feature when assigned
        ]);

        return back()->with('success', 'Feature assigned successfully.');
    }

    /**
     * Remove a feature from a business.
     */
    public function remove(Request $request, Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage business features.');
        }

        $validated = $request->validate([
            'feature_id' => 'required|exists:business_features,id',
        ]);

        // Remove the assignment
        BusinessFeatureAssignment::where('business_id', $business->id)
            ->where('feature_id', $validated['feature_id'])
            ->delete();

        return back()->with('success', 'Feature removed successfully.');
    }
}
