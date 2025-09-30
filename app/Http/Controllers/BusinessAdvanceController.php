<?php

namespace App\Http\Controllers;

use App\Models\Advance;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BusinessAdvanceController extends Controller
{
    /**
     * Display a listing of advances for the business.
     */
    public function index(Request $request, Business $business): Response
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }

        // Get user's role in this business
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Check permissions for different operations
        $canCreate = true; // All business users can create their own advances
        $canEdit = true; // All business users can edit their own advances
        $canDelete = true; // All business users can delete their own advances
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        // Users can always view their own advances, but need permission to view others
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);

        $query = $business->advances()->with(['user', 'requestedBy', 'approvedBy']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id') && $request->user_id !== 'all') {
            if ($request->user_id === 'me') {
                $query->where('user_id', $user->id);
            } else {
                // Only allow filtering by other users if they have permission
                if ($canViewAll) {
                    $query->where('user_id', $request->user_id);
                } else {
                    // If no permission, force to show only own records
                    $query->where('user_id', $user->id);
                }
            }
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Month filter - filter by advance date
        if ($request->filled('month')) {
            $month = $request->month; // Format: YYYY-MM
            $query->whereYear('advance_date', substr($month, 0, 4))
                  ->whereMonth('advance_date', substr($month, 5, 2));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('purpose', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // If user can't view all, only show their own advances
        if (!$canViewAll) {
            $query->where('user_id', $user->id);
        }

        $advances = $query->paginate(15)->withQueryString();

        // Get users for filter (only if user can view all)
        $users = $canViewAll ? $business->users()->pluck('name', 'users.id') : collect();

        // Get summary statistics (only for records user can see)
        $baseQuery = $business->advances();
        if (!$canViewAll) {
            $baseQuery->where('user_id', $user->id);
        }
        
        $summary = [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->pending()->count(),
            'approved' => (clone $baseQuery)->approved()->count(),
            'rejected' => (clone $baseQuery)->rejected()->count(),
            'paid' => (clone $baseQuery)->paid()->count(),
            'total_amount' => (clone $baseQuery)->sum('amount'),
            'pending_amount' => (clone $baseQuery)->pending()->sum('amount'),
            'total_remaining' => (clone $baseQuery)->sum('remaining_amount'),
        ];

        return Inertia::render('Business/Advances/Index', [
            'business' => $business,
            'advances' => $advances,
            'users' => $users,
            'summary' => $summary,
            'filters' => $request->only(['status', 'user_id', 'type', 'search', 'month']),
            'canCreate' => $canCreate,
            'canEdit' => $canEdit,
            'canDelete' => $canDelete,
            'canManage' => $canManage,
            'canViewAll' => $canViewAll,
            'userRole' => $userRole,
            'currentUserId' => $user->id,
        ]);
    }

    /**
     * Show the form for creating a new advance.
     */
    public function create(Business $business): Response
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // All business users can create advances (for themselves)
        // Specific permissions determine if they can create for others

        // Get user's role in this business
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);

        // Get users for selection
        if ($canViewAll) {
            // Can create for any user in the business
            $users = $business->users()->pluck('name', 'users.id');
        } else {
            // Can only create for themselves
            $users = collect([$user->id => $user->name]);
        }

        return Inertia::render('Business/Advances/Create', [
            'business' => $business,
            'users' => $users,
            'canManage' => $canManage,
            'canViewAll' => $canViewAll,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Store a newly created advance.
     */
    public function store(Request $request, Business $business)
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // All business users can create advances (for themselves)
        // Specific permissions determine if they can create for others

        // Get user's role in this business
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:cash,bank_transfer,check,other',
            'purpose' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date|after:today',
            'advance_date' => 'nullable|date|before_or_equal:today',
        ]);

        // If user can't manage others, they can only create advances for themselves
        if (!$canManage && $validated['user_id'] != $user->id) {
            abort(403, 'Unauthorized to create advances for other users.');
        }

        // Check if user belongs to this business
        if (!$business->hasUser(User::find($validated['user_id']))) {
            abort(403, 'User does not belong to this business.');
        }

        try {
            DB::beginTransaction();

            $advance = $business->advances()->create([
                'user_id' => $validated['user_id'],
                'requested_by' => $user->id,
                'amount' => $validated['amount'],
                'type' => $validated['type'],
                'purpose' => $validated['purpose'],
                'description' => $validated['description'],
                'due_date' => $validated['due_date'],
                'advance_date' => $validated['advance_date'],
                'status' => 'pending',
                'remaining_amount' => $validated['amount'],
            ]);

            DB::commit();

            return redirect()->route('businesses.advances.index', $business)
                ->with('success', 'Advance request created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to create advance request.');
        }
    }

    /**
     * Display the specified advance.
     */
    public function show(Business $business, Advance $advance): Response
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can view this advance (own advance or has permission)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);
        
        // Allow users to view their own advances, or managers/owners/superadmins to view any advance
        if (!$canManage && $advance->user_id !== $user->id) {
            abort(403, 'Unauthorized to view this advance.');
        }

        $advance->load(['user', 'requestedBy', 'approvedBy', 'business']);
        
        // Ensure relationships are properly loaded and handle null cases
        if ($advance->approved_by && !$advance->approvedBy) {
            $advance->load('approvedBy');
        }

        return Inertia::render('Business/Advances/Show', [
            'business' => $business,
            'advance' => $advance,
            'canEdit' => true, // Users can always edit their own advances
            'canDelete' => true, // Users can always delete their own advances
            'canManage' => $canManage,
            'canViewAll' => $canViewAll,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Show the form for editing the specified advance.
     */
    public function edit(Business $business, Advance $advance): Response
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // All business users can edit advances (for themselves)
        // Specific permissions determine if they can edit others

        // Check if user can edit this advance (own advance or has permission)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);
        
        if (!$canManage && $advance->user_id !== $user->id) {
            abort(403, 'Unauthorized to edit this advance.');
        }

        // Get users for selection
        if ($canViewAll) {
            // Can edit for any user in the business
            $users = $business->users()->pluck('name', 'users.id');
        } else {
            // Can only edit for themselves
            $users = collect([$user->id => $user->name]);
        }

        $advance->load(['user', 'requestedBy', 'approvedBy', 'business']);
        
        // Ensure relationships are properly loaded and handle null cases
        if ($advance->approved_by && !$advance->approvedBy) {
            $advance->load('approvedBy');
        }

        return Inertia::render('Business/Advances/Edit', [
            'business' => $business,
            'advance' => $advance,
            'users' => $users,
            'canManage' => $canManage,
            'canViewAll' => $canViewAll,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Update the specified advance.
     */
    public function update(Request $request, Business $business, Advance $advance)
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // All business users can edit advances (for themselves)
        // Specific permissions determine if they can edit others

        // Check if user can edit this advance (own advance or has permission)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);
        
        if (!$canManage && $advance->user_id !== $user->id) {
            abort(403, 'Unauthorized to edit this advance.');
        }

        // Can't edit if already approved/rejected/paid
        if (in_array($advance->status, ['approved', 'rejected', 'paid'])) {
            abort(403, 'Cannot edit advance that has been processed.');
        }

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01|max:999999.99',
            'type' => 'required|in:cash,bank_transfer,check,other',
            'purpose' => 'required|string|max:500',
            'description' => 'nullable|string|max:500',
            'due_date' => 'nullable|date|after:today',
            'advance_date' => 'nullable|date|before_or_equal:today',
        ]);

        // If user can't manage others, they can only edit their own advances
        if (!$canManage && $validated['user_id'] != $user->id) {
            abort(403, 'Unauthorized to change advance ownership.');
        }

        // Check if user belongs to this business
        if (!$business->hasUser(User::find($validated['user_id']))) {
            abort(403, 'User does not belong to this business.');
        }

        try {
            DB::beginTransaction();

            $advance->update([
                'user_id' => $validated['user_id'],
                'amount' => $validated['amount'],
                'type' => $validated['type'],
                'purpose' => $validated['purpose'],
                'description' => $validated['description'],
                'due_date' => $validated['due_date'],
                'advance_date' => $validated['advance_date'],
                'remaining_amount' => $validated['amount'], // Reset remaining amount if amount changes
            ]);

            DB::commit();

            return redirect()->route('businesses.advances.index', $business)
                ->with('success', 'Advance updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to update advance.');
        }
    }

    /**
     * Remove the specified advance.
     */
    public function destroy(Business $business, Advance $advance)
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // All business users can delete advances (for themselves)
        // Specific permissions determine if they can delete others

        // Check if user can delete this advance (own advance or has permission)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all advances if they have manager/owner role or are super admin
        // Otherwise, they can only view their own advances
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);
        
        if (!$canManage && $advance->user_id !== $user->id) {
            abort(403, 'Unauthorized to delete this advance.');
        }

        // Can't delete if already approved/rejected/paid
        if (in_array($advance->status, ['approved', 'rejected', 'paid'])) {
            abort(403, 'Cannot delete advance that has been processed.');
        }

        try {
            $advance->delete();
            return redirect()->route('businesses.advances.index', $business)
                ->with('success', 'Advance deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete advance.');
        }
    }

    /**
     * Approve or reject an advance.
     */
    public function updateStatus(Request $request, Business $business, Advance $advance)
    {
        $user = auth()->user();
        
        // Check permissions (need edit permission to approve/reject)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canEdit = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canEdit && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized to update advance status.');
        }

        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can manage this advance
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage) {
            abort(403, 'Unauthorized to update advance status.');
        }

        // Can only update status if pending
        if ($advance->status !== 'pending') {
            abort(403, 'Can only update status of pending advances.');
        }

        // Validate request
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string|max:1000',
            'rejection_reason' => 'required_if:status,rejected|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $advance->update([
                'status' => $validated['status'],
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approval_notes' => $validated['notes'],
                'rejection_reason' => $validated['status'] === 'rejected' ? $validated['rejection_reason'] : null,
            ]);

            DB::commit();

            $statusText = $validated['status'] === 'approved' ? 'approved' : 'rejected';
            return redirect()->route('businesses.advances.index', $business)
                ->with('success', "Advance {$statusText} successfully.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update advance status.');
        }
    }

    /**
     * Mark advance as paid.
     */
    public function markAsPaid(Request $request, Business $business, Advance $advance)
    {
        $user = auth()->user();
        
        // Check permissions
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canEdit = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canEdit && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized to mark advance as paid.');
        }

        // Check if advance belongs to this business
        if ($advance->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can manage this advance
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage) {
            abort(403, 'Unauthorized to mark advance as paid.');
        }

        // Can only mark as paid if approved
        if ($advance->status !== 'approved') {
            abort(403, 'Can only mark approved advances as paid.');
        }

        try {
            DB::beginTransaction();

            $advance->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            DB::commit();

            return redirect()->route('businesses.advances.index', $business)
                ->with('success', 'Advance marked as paid successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to mark advance as paid.');
        }
    }
}
