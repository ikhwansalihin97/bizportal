<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BusinessClaimController extends Controller
{
    /**
     * Display a listing of claims for the business.
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
        $canCreate = true; // All business users can create their own claims
        $canEdit = true; // All business users can edit their own claims
        $canDelete = true; // All business users can delete their own claims
        
        // Users can view all claims if they have manager/owner role or are super admin
        // Otherwise, they can only view their own claims
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        // Users can always view their own claims, but need permission to view others
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);

        $query = $business->claims()->with(['user', 'submittedBy', 'approvedBy']);

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

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('expense_type')) {
            $query->where('expense_type', $request->expense_type);
        }

        // Month filter - filter by expense_date and submitted_at
        if ($request->filled('month')) {
            $month = $request->month; // Format: YYYY-MM
            $query->where(function ($q) use ($month) {
                $q->whereYear('expense_date', substr($month, 0, 4))
                  ->whereMonth('expense_date', substr($month, 5, 2));
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%")
                  ->orWhere('vendor', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // If user can't view all, only show their own claims
        if (!$canViewAll) {
            $query->where('user_id', $user->id);
        }

        $claims = $query->paginate(15)->withQueryString();

        // Get users for filter (only if user can view all)
        $users = $canViewAll ? $business->users()->pluck('name', 'users.id') : collect();

        // Get summary statistics (only for records user can see)
        $baseQuery = $business->claims();
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

        return Inertia::render('Business/Claims/Index', [
            'business' => $business,
            'claims' => $claims,
            'users' => $users,
            'summary' => $summary,
            'filters' => $request->only(['status', 'user_id', 'category', 'expense_type', 'search', 'month']),
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
     * Show the form for creating a new claim.
     */
    public function create(Business $business): Response
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // All business users can create claims (for themselves)
        // Specific permissions determine if they can create for others

        // Get user's role in this business
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all claims if they have manager/owner role or are super admin
        // Otherwise, they can only view their own claims
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

        return Inertia::render('Business/Claims/Create', [
            'business' => $business,
            'users' => $users,
            'canManage' => $canManage,
            'canViewAll' => $canViewAll,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Store a newly created claim.
     */
    public function store(Request $request, Business $business)
    {
        $user = auth()->user();
        
        // Check if user belongs to this business
        if (!$business->hasUser($user)) {
            abort(403, 'You do not have access to this business.');
        }
        
        // All business users can create claims (for themselves)
        // Specific permissions determine if they can create for others

        // Get user's role in this business
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        
        // Users can view all claims if they have manager/owner role or are super admin
        // Otherwise, they can only view their own claims
        $canViewAll = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        $canManage = $canViewAll || in_array($userRole, ['owner', 'manager']);

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01|max:999999.99',
            'category' => 'required|in:travel,meals,office_supplies,transportation,utilities,general,other',
            'expense_type' => 'required|in:reimbursement,petty_cash,direct_payment,other',
            'description' => 'required|string|max:500',
            'purpose' => 'nullable|string|max:500',
            'expense_date' => 'required|date|before_or_equal:today',
            'vendor' => 'nullable|string|max:255',
            'invoice_number' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:255',
        ]);

        // If user can't manage others, they can only create claims for themselves
        if (!$canManage && $validated['user_id'] != $user->id) {
            abort(403, 'Unauthorized to create claims for other users.');
        }

        // Check if user belongs to this business
        if (!$business->hasUser(User::find($validated['user_id']))) {
            abort(403, 'User does not belong to this business.');
        }

        try {
            DB::beginTransaction();

            $claim = Claim::create([
                'business_id' => $business->id,
                'user_id' => $validated['user_id'],
                'submitted_by' => $user->id,
                'amount' => $validated['amount'],
                'category' => $validated['category'],
                'expense_type' => $validated['expense_type'],
                'description' => $validated['description'],
                'purpose' => $validated['purpose'],
                'expense_date' => $validated['expense_date'],
                'vendor' => $validated['vendor'],
                'invoice_number' => $validated['invoice_number'],
                'payment_method' => $validated['payment_method'],
                'remaining_amount' => $validated['amount'], // Initially, remaining = claimed amount
                'status' => 'pending',
            ]);

            DB::commit();

            return redirect()->route('businesses.claims.index', $business)
                ->with('success', 'Claim submitted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to submit claim.');
        }
    }

    /**
     * Display the specified claim.
     */
    public function show(Business $business, Claim $claim): Response
    {
        $user = auth()->user();
        
        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can view this claim (own claim or manager/owner/superadmin)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        // Allow users to view their own claims, or managers/owners/superadmins to view any claim
        if (!$canManage && $claim->user_id !== $user->id) {
            abort(403, 'Unauthorized to view this claim.');
        }

        $claim->load(['user', 'submittedBy', 'approvedBy', 'business']);
        
        // Ensure relationships are properly loaded and handle null cases
        if ($claim->approved_by && !$claim->approvedBy) {
            $claim->load('approvedBy');
        }

        return Inertia::render('Business/Claims/Show', [
            'business' => $business,
            'claim' => $claim,
            'canEdit' => true, // Users can always edit their own claims
            'canDelete' => true, // Users can always delete their own claims
            'canManage' => $canManage,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Show the form for editing the specified claim.
     */
    public function edit(Business $business, Claim $claim): Response
    {
        $user = auth()->user();
        
        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // All business users can edit claims (for themselves)
        // Specific permissions determine if they can edit others

        // Check if user can edit this claim
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage && $claim->user_id !== $user->id) {
            abort(403, 'Unauthorized to edit this claim.');
        }

        // Can't edit if already approved/rejected/paid
        if (in_array($claim->status, ['approved', 'rejected', 'paid'])) {
            abort(403, 'Cannot edit claim that has been processed.');
        }

        $claim->load(['user', 'submittedBy', 'approvedBy']);
        
        // Ensure relationships are properly loaded and handle null cases
        if ($claim->approved_by && !$claim->approvedBy) {
            $claim->load('approvedBy');
        }

        // Get users for selection (only if user can manage others)
        $users = $canManage ? $business->users()->pluck('name', 'users.id') : collect([$claim->user_id => $claim->user->name]);

        return Inertia::render('Business/Claims/Edit', [
            'business' => $business,
            'claim' => $claim,
            'users' => $users,
            'canManage' => $canManage,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Update the specified claim.
     */
    public function update(Request $request, Business $business, Claim $claim)
    {
        $user = auth()->user();
        
        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // All business users can edit claims (for themselves)
        // Specific permissions determine if they can edit others

        // Check if user can edit this claim
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage && $claim->user_id !== $user->id) {
            abort(403, 'Unauthorized to edit this claim.');
        }

        // Can't edit if already approved/rejected/paid
        if (in_array($claim->status, ['approved', 'rejected', 'paid'])) {
            abort(403, 'Cannot edit claim that has been processed.');
        }

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01|max:999999.99',
            'category' => 'required|in:travel,meals,office_supplies,transportation,utilities,general,other',
            'expense_type' => 'required|in:reimbursement,petty_cash,direct_payment,other',
            'description' => 'required|string|max:500',
            'purpose' => 'nullable|string|max:500',
            'expense_date' => 'required|date|before_or_equal:today',
            'vendor' => 'nullable|string|max:255',
            'invoice_number' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:255',
        ]);

        // If user can't manage others, they can only edit their own claims
        if (!$canManage && $validated['user_id'] != $user->id) {
            abort(403, 'Unauthorized to edit claims for other users.');
        }

        // Check if user belongs to this business
        if (!$business->hasUser(User::find($validated['user_id']))) {
            abort(403, 'User does not belong to this business.');
        }

        try {
            DB::beginTransaction();

            $claim->update([
                'user_id' => $validated['user_id'],
                'amount' => $validated['amount'],
                'category' => $validated['category'],
                'expense_type' => $validated['expense_type'],
                'description' => $validated['description'],
                'purpose' => $validated['purpose'],
                'expense_date' => $validated['expense_date'],
                'vendor' => $validated['vendor'],
                'invoice_number' => $validated['invoice_number'],
                'payment_method' => $validated['payment_method'],
                'remaining_amount' => $validated['amount'], // Reset remaining amount if amount changes
            ]);

            DB::commit();

            return redirect()->route('businesses.claims.index', $business)
                ->with('success', 'Claim updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to update claim.');
        }
    }

    /**
     * Remove the specified claim.
     */
    public function destroy(Business $business, Claim $claim)
    {
        $user = auth()->user();
        
        // Check permissions
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canDelete = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canDelete && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized to delete claims.');
        }

        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // All business users can delete claims (for themselves)
        // Specific permissions determine if they can delete others

        // Check if user can delete this claim
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage && $claim->user_id !== $user->id) {
            abort(403, 'Unauthorized to delete this claim.');
        }

        // Can't delete if already approved/rejected/paid
        if (in_array($claim->status, ['approved', 'rejected', 'paid'])) {
            abort(403, 'Cannot delete claim that has been processed.');
        }

        try {
            $claim->delete();
            return redirect()->route('businesses.claims.index', $business)
                ->with('success', 'Claim deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete claim.');
        }
    }

    /**
     * Approve or reject a claim.
     */
    public function updateStatus(Request $request, Business $business, Claim $claim)
    {
        $user = auth()->user();
        
        // Check permissions (need edit permission to approve/reject)
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canEdit = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canEdit && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized to update claim status.');
        }

        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can manage this claim
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage) {
            abort(403, 'Unauthorized to update claim status.');
        }

        // Can only update status if pending
        if ($claim->status !== 'pending') {
            abort(403, 'Can only update status of pending claims.');
        }

        // Validate request
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string|max:1000',
            'rejection_reason' => 'required_if:status,rejected|string|max:1000',
            'approved_amount' => 'nullable|numeric|min:0.01|max:999999.99',
        ]);

        try {
            DB::beginTransaction();

            $approvedAmount = $validated['approved_amount'] ?? $claim->amount;

            $claim->update([
                'status' => $validated['status'],
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approval_notes' => $validated['notes'],
                'rejection_reason' => $validated['status'] === 'rejected' ? $validated['rejection_reason'] : null,
                'approved_amount' => $validated['status'] === 'approved' ? $approvedAmount : null,
                'remaining_amount' => $validated['status'] === 'approved' ? $approvedAmount : $claim->amount,
            ]);

            DB::commit();

            $statusText = $validated['status'] === 'approved' ? 'approved' : 'rejected';
            return redirect()->route('businesses.claims.index', $business)
                ->with('success', "Claim {$statusText} successfully.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update claim status.');
        }
    }

    /**
     * Mark claim as paid.
     */
    public function markAsPaid(Request $request, Business $business, Claim $claim)
    {
        $user = auth()->user();
        
        // Check permissions
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canEdit = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canEdit && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized to mark claim as paid.');
        }

        // Check if claim belongs to this business
        if ($claim->business_id !== $business->id) {
            abort(404);
        }

        // Check if user can manage this claim
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner', 'manager']) || $user->isSuperAdmin();
        
        if (!$canManage) {
            abort(403, 'Unauthorized to mark claim as paid.');
        }

        // Can only mark as paid if approved
        if ($claim->status !== 'approved') {
            abort(403, 'Can only mark approved claims as paid.');
        }

        try {
            DB::beginTransaction();

            $claim->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            DB::commit();

            return redirect()->route('businesses.claims.index', $business)
                ->with('success', 'Claim marked as paid successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to mark claim as paid.');
        }
    }
}
