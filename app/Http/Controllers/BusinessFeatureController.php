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

        $validated = $request->validate([
            'business_feature_id' => 'required|exists:business_features,id',
        ]);

        // Check if feature is already assigned
        $existingAssignment = BusinessFeatureAssignment::where('business_id', $business->id)
            ->where('business_feature_id', $validated['business_feature_id'])
            ->exists();

        if ($existingAssignment) {
            return back()->with('error', 'Feature is already assigned to this business.');
        }

        // Create the assignment
        BusinessFeatureAssignment::create([
            'business_id' => $business->id,
            'business_feature_id' => $validated['business_feature_id'],
            'assigned_by' => $user->id,
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
            'business_feature_id' => 'required|exists:business_features,id',
        ]);

        // Remove the assignment
        BusinessFeatureAssignment::where('business_id', $business->id)
            ->where('business_feature_id', $validated['business_feature_id'])
            ->delete();

        return back()->with('success', 'Feature removed successfully.');
    }

    /**
     * Get enabled features for a business (for navigation).
     */
    public static function getEnabledFeatures(Business $business)
    {
        return BusinessFeatureAssignment::where('business_id', $business->id)
            ->with('feature')
            ->get()
            ->pluck('feature');
    }
}
