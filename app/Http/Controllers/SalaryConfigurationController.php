<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\SalaryType;
use App\Models\SalaryRate;
use App\Models\OvertimeRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryConfigurationController extends Controller
{
    /**
     * Display the salary configuration dashboard.
     */
    public function index(Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        // Get all salary types
        $salaryTypes = SalaryType::all();

        // Get salary rates for this business
        $salaryRates = SalaryRate::where('business_id', $business->id)
            ->with(['user.profile', 'salaryType'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get overtime rates for this business
        $overtimeRates = OvertimeRate::where('business_id', $business->id)
            ->with(['salaryType'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate stats
        $stats = [
            'total_employees' => $business->users()->count(),
            'employees_with_rates' => $salaryRates->where('is_active', true)->count(),
            'active_overtime_rates' => $overtimeRates->where('is_active', true)->count(),
            'total_salary_types' => $salaryTypes->count(),
        ];

        return Inertia::render('Business/SalaryConfiguration/Index', [
            'business' => $business,
            'salaryTypes' => $salaryTypes,
            'salaryRates' => $salaryRates,
            'overtimeRates' => $overtimeRates,
            'stats' => $stats,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Store a new salary rate.
     */
    public function storeSalaryRate(Request $request, Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage salary rates.');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'salary_type_id' => 'required|exists:salary_types,id',
            'base_rate' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check if user is part of this business
        if (!$business->users()->where('user_id', $validated['user_id'])->exists()) {
            return back()->with('error', 'Selected user is not a member of this business.');
        }

        // Deactivate other active rates for this user
        if ($validated['is_active'] ?? true) {
            SalaryRate::where('business_id', $business->id)
                ->where('user_id', $validated['user_id'])
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $salaryRate = SalaryRate::create([
            'business_id' => $business->id,
            ...$validated,
        ]);

        return back()->with('success', 'Salary rate created successfully.');
    }

    /**
     * Update an existing salary rate.
     */
    public function updateSalaryRate(Request $request, Business $business, SalaryRate $salaryRate)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage salary rates.');
        }

        // Ensure the salary rate belongs to this business
        if ($salaryRate->business_id !== $business->id) {
            abort(404, 'Salary rate not found.');
        }

        $validated = $request->validate([
            'salary_type_id' => 'required|exists:salary_types,id',
            'base_rate' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        // If activating this rate, deactivate others for the same user
        if ($validated['is_active'] ?? true) {
            SalaryRate::where('business_id', $business->id)
                ->where('user_id', $salaryRate->user_id)
                ->where('id', '!=', $salaryRate->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $salaryRate->update($validated);

        return back()->with('success', 'Salary rate updated successfully.');
    }

    /**
     * Delete a salary rate.
     */
    public function destroySalaryRate(Business $business, SalaryRate $salaryRate)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage salary rates.');
        }

        // Ensure the salary rate belongs to this business
        if ($salaryRate->business_id !== $business->id) {
            abort(404, 'Salary rate not found.');
        }

        $salaryRate->delete();

        return back()->with('success', 'Salary rate deleted successfully.');
    }

    /**
     * Store a new overtime rate.
     */
    public function storeOvertimeRate(Request $request, Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage overtime rates.');
        }

        $validated = $request->validate([
            'salary_type_id' => 'required|exists:salary_types,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:overtime_rates,code,NULL,id,business_id,' . $business->id,
            'rate_type' => 'required|in:multiplier,fixed',
            'multiplier' => 'nullable|numeric|min:0|required_if:rate_type,multiplier',
            'fixed_rate' => 'nullable|numeric|min:0|required_if:rate_type,fixed',
            'conditions' => 'nullable|array',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $overtimeRate = OvertimeRate::create([
            'business_id' => $business->id,
            ...$validated,
        ]);

        return back()->with('success', 'Overtime rate created successfully.');
    }

    /**
     * Update an existing overtime rate.
     */
    public function updateOvertimeRate(Request $request, Business $business, OvertimeRate $overtimeRate)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage overtime rates.');
        }

        // Ensure the overtime rate belongs to this business
        if ($overtimeRate->business_id !== $business->id) {
            abort(404, 'Overtime rate not found.');
        }

        $validated = $request->validate([
            'salary_type_id' => 'required|exists:salary_types,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:overtime_rates,code,' . $overtimeRate->id . ',id,business_id,' . $business->id,
            'rate_type' => 'required|in:multiplier,fixed',
            'multiplier' => 'nullable|numeric|min:0|required_if:rate_type,multiplier',
            'fixed_rate' => 'nullable|numeric|min:0|required_if:rate_type,fixed',
            'conditions' => 'nullable|array',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $overtimeRate->update($validated);

        return back()->with('success', 'Overtime rate updated successfully.');
    }

    /**
     * Delete an overtime rate.
     */
    public function destroyOvertimeRate(Business $business, OvertimeRate $overtimeRate)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to manage overtime rates.');
        }

        // Ensure the overtime rate belongs to this business
        if ($overtimeRate->business_id !== $business->id) {
            abort(404, 'Overtime rate not found.');
        }

        $overtimeRate->delete();

        return back()->with('success', 'Overtime rate deleted successfully.');
    }
}
