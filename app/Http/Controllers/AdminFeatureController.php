<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessFeature;
use App\Models\BusinessFeatureAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminFeatureController extends Controller
{
    /**
     * Display a listing of all features (Admin only).
     */
    public function index()
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can view all features.');
        }

        $features = BusinessFeature::orderBy('name')->get();

        return Inertia::render('Admin/Features/Index', [
            'features' => $features,
        ]);
    }

    /**
     * Show the form for creating a new feature (Admin only).
     */
    public function create()
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can create new features.');
        }

        return Inertia::render('Admin/Features/Create');
    }

    /**
     * Store a newly created feature (Admin only).
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can create new features.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:business_features,name',
            'description' => 'nullable|string|max:1000',
            'category' => 'required|string|max:100',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $feature = BusinessFeature::create($validated);

        return redirect()->route('admin.features.index')
            ->with('success', 'Feature created successfully.');
    }

    /**
     * Display the specified feature (Admin only).
     */
    public function show(BusinessFeature $feature)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can view feature details.');
        }

        // Get businesses that have this feature assigned
        $assignedBusinesses = BusinessFeatureAssignment::where('feature_id', $feature->id)
            ->with('business')
            ->get()
            ->pluck('business');

        return Inertia::render('Admin/Features/Show', [
            'feature' => $feature,
            'businesses' => $assignedBusinesses,
        ]);
    }

    /**
     * Show the form for editing the specified feature (Admin only).
     */
    public function edit(BusinessFeature $feature)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can edit features.');
        }

        return Inertia::render('Admin/Features/Edit', [
            'feature' => $feature,
        ]);
    }

    /**
     * Update the specified feature (Admin only).
     */
    public function update(Request $request, BusinessFeature $feature)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can edit features.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:business_features,name,' . $feature->id,
            'description' => 'nullable|string|max:1000',
            'category' => 'required|string|max:100',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $feature->update($validated);

        return redirect()->route('admin.features.index')
            ->with('success', 'Feature updated successfully.');
    }

    /**
     * Remove the specified feature (Admin only).
     */
    public function destroy(BusinessFeature $feature)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can delete features.');
        }

        // Check if feature is assigned to any businesses
        $assignedCount = BusinessFeatureAssignment::where('feature_id', $feature->id)->count();
        
        if ($assignedCount > 0) {
            return back()->with('error', 'Cannot delete feature that is assigned to businesses. Remove all assignments first.');
        }

        $feature->delete();

        return redirect()->route('admin.features.index')
            ->with('success', 'Feature deleted successfully.');
    }

    /**
     * Assign a feature to a specific business (Admin only).
     */
    public function assignToBusiness(Request $request, BusinessFeature $feature, $businessId)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can assign features to businesses.');
        }

        $business = Business::findOrFail($businessId);

        // Check if feature is already assigned
        $existingAssignment = BusinessFeatureAssignment::where('business_id', $business->id)
            ->where('feature_id', $feature->id)
            ->exists();

        if ($existingAssignment) {
            return back()->with('error', 'Feature is already assigned to this business.');
        }

        // Create the assignment
        BusinessFeatureAssignment::create([
            'business_id' => $business->id,
            'feature_id' => $feature->id,
            'enabled_by' => $user->id,
            'is_enabled' => true, // Enable the feature when assigned
        ]);

        return back()->with('success', 'Feature assigned to business successfully.');
    }

    /**
     * Get features for a specific business (Admin only).
     */
    public function getBusinessFeatures(Business $business)
    {
        $user = auth()->user();
        
        if (!$user->isSuperAdmin()) {
            abort(403, 'Only superadmins can view business features.');
        }

        $assignedFeatures = BusinessFeatureAssignment::where('business_id', $business->id)
            ->with('feature')
            ->get()
            ->pluck('feature');

        return Inertia::render('Admin/Features/Business', [
            'business' => $business,
            'assignedFeatures' => $assignedFeatures,
        ]);
    }
}
