<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Business;
use App\Models\User;
use App\Models\SalaryRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display the attendance dashboard.
     */
    public function index(Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');
        
        // Check if user can view attendance (superadmin, business member, or has attendances.view permission)
        $canView = $user->hasRole('superadmin') || 
                   $business->users()->where('user_id', $user->id)->exists() || 
                   $user->can('attendances.view');
        
        if (!$canView) {
            abort(403, 'Unauthorized to view attendance records.');
        }
        
        // Superadmins are always considered business members
        $isBusinessMember = $user->hasRole('superadmin') || $business->users()->where('user_id', $user->id)->exists();

        // Get recent attendance for the last 7 days
        $recentAttendance = Attendance::where('business_id', $business->id)
            ->whereBetween('work_date', [
                Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->subDays(6)->startOfDay(),
                Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->endOfDay()
            ])
            ->with(['user'])
            ->orderBy('work_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->groupBy(function ($attendance) {
                return $attendance->work_date->format('Y-m-d');
            });

        // Get today's attendance for stats
        $todayAttendance = Attendance::where('business_id', $business->id)
            ->where('work_date', Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->toDateString())
            ->with(['user'])
            ->get();

        // Get current user's today attendance
        $currentUserAttendance = $todayAttendance->where('user_id', $user->id)->first();

        // Calculate stats
        $stats = [
            'total_employees' => $business->users()->count(),
            'present_today' => $todayAttendance->whereNotNull('start_time')->pluck('user_id')->unique()->count(),
            'absent_today' => $business->users()->count() - $todayAttendance->whereNotNull('start_time')->pluck('user_id')->unique()->count(),
            'pending_approval' => $todayAttendance->where('status', 'pending')->pluck('user_id')->unique()->count(),
        ];

        return Inertia::render('Business/Attendance/Index', [
            'business' => $business,
            'isBusinessMember' => $isBusinessMember,
            'recentAttendance' => $recentAttendance,
            'todayAttendance' => $todayAttendance,
            'currentUserAttendance' => $currentUserAttendance,
            'stats' => $stats,
            'userRole' => $userRole,
            'canManage' => $canManage,
            // Include user data with roles and permissions for frontend authorization
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->profile && $user->profile->role === 'superadmin' ? ['superadmin'] : $user->roles->pluck('name')->toArray(),
                'permissions' => $user->permissions->pluck('name')->toArray(),
                'isSuperAdmin' => $user->isSuperAdmin(),
            ],
        ]);
    }

    /**
     * Display attendance reports with filtering.
     */
    public function report(Request $request, Business $business)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');
        
        // Check if user can view attendance reports
        $canView = $user->hasRole('superadmin') || 
                   $business->users()->where('user_id', $user->id)->exists() || 
                   $user->can('attendances.view');
        
        if (!$canView) {
            abort(403, 'Unauthorized to view attendance reports.');
        }
        
        // Superadmins are always considered business members
        $isBusinessMember = $user->hasRole('superadmin') || $business->users()->where('user_id', $user->id)->exists();

        // Get filter parameters
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $userId = $request->get('user_id');

        // Build query
        $query = Attendance::where('business_id', $business->id)
            ->with(['user'])
            ->whereBetween('work_date', [$startDate, $endDate]);

        // Filter by user if specified and user has permission
        if ($userId && $canManage) {
            $query->where('user_id', $userId);
        } elseif (!$canManage) {
            // If not manager, only show own records
            $query->where('user_id', $user->id);
        }

        // Get paginated results
        $attendance = $query->orderBy('work_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Calculate summary stats
        $summaryQuery = Attendance::where('business_id', $business->id)
            ->whereBetween('work_date', [$startDate, $endDate]);

        if ($userId && $canManage) {
            $summaryQuery->where('user_id', $userId);
        } elseif (!$canManage) {
            $summaryQuery->where('user_id', $user->id);
        }

        $summary = [
            'total_days' => $summaryQuery->count(),
            'present_days' => $summaryQuery->whereNotNull('start_time')->count(),
            'pending_days' => $summaryQuery->where('status', 'pending')->count(),
            'total_hours' => $summaryQuery->sum('regular_units') + $summaryQuery->sum('overtime_units'),
        ];

        // Get users for filter dropdown
        $users = $canManage 
            ? $business->users()->with('profile')->get()
            : collect([$user]);

        return Inertia::render('Business/Attendance/Report', [
            'business' => $business,
            'isBusinessMember' => $isBusinessMember,
            'attendance' => $attendance,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'user_id' => $userId,
            ],
            'users' => $users,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Display individual user attendance records.
     */
    public function userRecords(Request $request, Business $business, User $user)
    {
        $currentUser = auth()->user();
        $userRole = $business->users()->where('user_id', $currentUser->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $currentUser->hasRole('superadmin');

        // Check if current user can view this user's records
        if (!$canManage && $currentUser->id !== $user->id) {
            abort(403, 'Unauthorized to view this user\'s attendance records.');
        }

        // Get filter parameters
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        // Get user's attendance records
        $query = Attendance::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->whereBetween('work_date', [$startDate, $endDate]);

        // Apply status filter if provided
        if ($request->has('status') && $request->get('status') !== 'all') {
            $query->where('status', $request->get('status'));
        }

        // Get paginated results
        $attendance = $query->orderBy('work_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Calculate monthly stats
        $monthlyStats = [
            'total_days' => $query->count(),
            'present_days' => $query->whereNotNull('start_time')->count(),
            'total_hours' => $query->sum('regular_units') + $query->sum('overtime_units'),
        ];

        return Inertia::render('Business/Attendance/UserRecords', [
            'business' => $business,
            'user' => $user,
            'attendance' => $attendance,
            'monthlyStats' => $monthlyStats,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Display current user's own attendance records or other employees' records for admins.
     */
    public function myRecords(Request $request, Business $business)
    {
        $user = auth()->user();
        
        // Ensure user is a member of this business
        if (!$business->users()->where('user_id', $user->id)->exists() && !$user->hasRole('superadmin')) {
            abort(403, 'You are not a member of this business.');
        }

        // Check if user can manage other users (for viewing other employees' records)
        $canManageUsers = $user->hasRole('superadmin') || 
                         $business->users()->where('user_id', $user->id)->first()->pivot->business_role === 'owner' ||
                         $user->can('users.view') || $user->can('users.edit');

        // Check if user can view all employees (superadmin or has attendances.view permission)
        $canViewAllEmployees = $user->isSuperAdmin() || $user->can('attendances.view');

        // If user can't view all employees, force them to only see their own records
        if (!$canViewAllEmployees) {
            $selectedUserId = 'me';
        }

        // Get filter parameters
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $statusFilter = $request->get('status', 'all');
        $selectedUserId = $request->get('user_id');

        // Determine which user's records to show
        $targetUserId = null;
        if ($selectedUserId === 'all' && $canViewAllEmployees) {
            // Show all employees' records
            $targetUserId = null;
        } elseif ($selectedUserId && $selectedUserId !== 'me' && $canViewAllEmployees) {
            // Show specific user's records
            $targetUserId = $selectedUserId;
        } else {
            // Default to current user's records
            $targetUserId = $user->id;
        }
        
        // If trying to view another user's records, check permissions
        if ($targetUserId && $targetUserId != $user->id && !$canManageUsers) {
            abort(403, 'You are not authorized to view other employees\' attendance records.');
        }

        // Build query for target user's attendance
        $query = Attendance::where('business_id', $business->id);
        
        // Always load user information for display purposes
        $query->with('user');
        
        // If viewing all employees and user has permission, show all records
        if ($selectedUserId === 'all' && $canManageUsers) {
            // Show all employees' records - no user_id filter needed
        } elseif ($targetUserId) {
            // Show specific user's records (including current user)
            $query->where('user_id', $targetUserId);
        } else {
            // This should never happen, but fallback to current user's records
            $query->where('user_id', $user->id);
        }
        
        $query->whereBetween('work_date', [$startDate, $endDate]);

        // Apply status filter if provided
        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Get paginated results
        $attendance = $query->orderBy('work_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Calculate summary stats
        $summaryQuery = Attendance::where('business_id', $business->id);
        
        // Always load user information for consistency
        $summaryQuery->with('user');
        
        // If viewing all employees and user has permission, show all records
        if ($selectedUserId === 'all' && $canManageUsers) {
            // Show all employees' records - no user_id filter needed
        } elseif ($targetUserId) {
            // Show specific user's records
            $summaryQuery->where('user_id', $targetUserId);
        } else {
            // Fallback to current user's records
            $summaryQuery->where('user_id', $user->id);
        }
        
        $summaryQuery->whereBetween('work_date', [$startDate, $endDate]);

        if ($statusFilter !== 'all') {
            $summaryQuery->where('status', $statusFilter);
        }

        // Get the base query for calculations
        $baseQuery = clone $summaryQuery;
        
        // For "all employees" view, we need to count unique dates across all users
        if ($selectedUserId === 'all' && $canViewAllEmployees) {
            // Calculate total days (unique work dates across all employees)
            $totalDays = (clone $baseQuery)->distinct('work_date')->count('work_date');
            
            // Calculate present days (unique work dates with start_time across all employees)
            $presentDays = (clone $baseQuery)->whereNotNull('start_time')->distinct('work_date')->count('work_date');
            
            // Calculate approved days (unique work dates with approved status across all employees)
            $approvedDays = (clone $baseQuery)->where('status', 'approved')->distinct('work_date')->count('work_date');
            
            // Calculate pending days (unique work dates with pending status across all employees)
            $pendingDays = (clone $baseQuery)->where('status', 'pending')->distinct('work_date')->count('work_date');
        } else {
            // For single user view, count unique dates for that user
            $totalDays = (clone $baseQuery)->distinct('work_date')->count('work_date');
            
            // Calculate present days (unique work dates with start_time for that user)
            $presentDays = (clone $baseQuery)->whereNotNull('start_time')->distinct('work_date')->count('work_date');
            
            // Calculate approved days (unique work dates with approved status for that user)
            $approvedDays = (clone $baseQuery)->where('status', 'approved')->distinct('work_date')->count('work_date');
            
            // Calculate pending days (unique work dates with pending status for that user)
            $pendingDays = (clone $baseQuery)->where('status', 'pending')->distinct('work_date')->count('work_date');
        }
        
        // Calculate total hours (sum of all regular and overtime units)
        $totalHours = (clone $baseQuery)->sum('regular_units') + (clone $baseQuery)->sum('overtime_units');
        
        // Fallback: if sum returns 0, try to calculate manually from individual records
        if ($totalHours == 0) {
            $records = (clone $baseQuery)->get(['regular_units', 'overtime_units']);
            $totalHours = $records->sum(function($record) {
                return (float)($record->regular_units ?? 0) + (float)($record->overtime_units ?? 0);
            });
        }
        
        // Calculate average hours per day (only for days with hours)
        $averageHoursPerDay = $presentDays > 0 ? $totalHours / $presentDays : 0;
        
        // Additional debug info for multiple records per day
        \Log::info('Multiple records per day debug', [
            'totalRecords' => $baseQuery->count(),
            'uniqueDates' => $totalDays,
            'recordsPerDay' => $totalDays > 0 ? $baseQuery->count() / $totalDays : 0,
            'sampleDates' => $baseQuery->select('work_date')->distinct()->limit(5)->pluck('work_date')->toArray()
        ]);

        $summary = [
            'total_days' => $totalDays,
            'present_days' => $presentDays,
            'approved_days' => $approvedDays,
            'pending_days' => $pendingDays,
            'total_hours' => $totalHours,
            'average_hours_per_day' => $averageHoursPerDay,
            // Additional record-based statistics
            'total_records' => $baseQuery->count(),
            'records_per_day' => $totalDays > 0 ? round($baseQuery->count() / $totalDays, 1) : 0,
        ];

        // Get list of users for the employee filter (only if user can view all employees)
        $users = null;
        $selectedUser = null;
        
        if ($canViewAllEmployees) {
            $users = $business->users()
                ->where('users.id', '!=', $user->id) // Exclude current user to avoid redundancy
                ->select('users.id', 'users.name', 'users.email')
                ->orderBy('users.name')
                ->get();

            // Get selected user info if viewing specific user
            if ($targetUserId && $targetUserId !== $user->id) {
                $selectedUser = $users->firstWhere('id', $targetUserId);
                if (!$selectedUser) {
                    // If not in business users, get from main users table
                    $selectedUser = \App\Models\User::select('id', 'name', 'email')
                        ->where('id', $targetUserId)
                        ->first();
                }
            }
        }

        return Inertia::render('Business/Attendance/MyAttendance', [
            'business' => $business,
            'attendance' => $attendance,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $statusFilter,
                'user_id' => $selectedUserId,
            ],
            'summary' => $summary,
            'users' => $canManageUsers ? $users : null,
            'canManageUsers' => $canManageUsers,
            'selectedUser' => $selectedUser,
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
     * Clock in for the current user.
     */
    public function clockIn(Request $request, Business $business)
    {
        $user = auth()->user();

        // Get current time in Malaysia timezone
        $now = Carbon::now()->setTimezone('Asia/Kuala_Lumpur');

        try {
            // Get current salary rate for the user (optional for superadmins)
            $salaryRate = null;
            if (!$user->hasRole('superadmin')) {
                $salaryRate = $user->getCurrentSalaryRate($business->id);
            }

            // Prepare attendance data for new clock-in
            $attendanceData = [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'salary_rate_id' => $salaryRate?->id,
                'work_date' => $now->toDateString(),
                'start_time' => $now->format('Y-m-d H:i:s'), // Store as Malaysia time, not UTC
                'status' => 'pending',
            ];

            // Create new attendance record (allows multiple clock-ins per day)
            $attendance = Attendance::create($attendanceData);

            return response()->json([
                'success' => true,
                'message' => 'Successfully clocked in at ' . $now->format('H:i'),
                'attendance' => $attendance->fresh()->load('user'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Clock-in failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'attendance_data' => $attendanceData ?? 'not set',
            ]);
            
            return response()->json(['error' => 'Failed to clock in. Please try again.'], 500);
        }
    }

    /**
     * Clock out for the current user.
     */
    public function clockOut(Request $request, Business $business)
    {
        $user = auth()->user();

        try {
            // Get the most recent incomplete attendance record (no end_time)
            $attendance = Attendance::where('user_id', $user->id)
                ->where('business_id', $business->id)
                ->whereNull('end_time')
                ->orderBy('start_time', 'desc')
                ->first();

            if (!$attendance) {
                return response()->json(['error' => 'No incomplete attendance record found. Please clock in first.'], 404);
            }

            // Calculate hours worked using Malaysia timezone
            $endTime = Carbon::now()->setTimezone('Asia/Kuala_Lumpur');
            $startTime = Carbon::parse($attendance->start_time)->setTimezone('Asia/Kuala_Lumpur');
            
            if ($startTime < $endTime) {
                $totalMinutes = $endTime->diffInMinutes($startTime);
                $totalHours = $totalMinutes / 60;
                
                // Ensure we have positive values
                $totalHours = abs($totalHours);
                
                // Assuming 8 hours is regular time, anything over is overtime
                $regularHours = min($totalHours, 8);
                $overtimeHours = max(0, $totalHours - 8);
                
                $regularUnits = round($regularHours, 2);
                $overtimeUnits = round($overtimeHours, 2);
            } else {
                $regularUnits = 0;
                $overtimeUnits = 0;
            }

            // Update attendance record
            $attendance->update([
                'end_time' => $endTime->format('Y-m-d H:i:s'), // Store as Malaysia time, not UTC
                'regular_units' => $regularUnits,
                'overtime_units' => $overtimeUnits,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully clocked out at ' . $endTime->format('H:i'),
                'attendance' => $attendance->fresh()->load('user'),
                'end_time' => $endTime->toISOString(),
                'regular_units' => $regularUnits,
                'overtime_units' => $overtimeUnits,
            ]);
        } catch (\Exception $e) {
            \Log::error('Clock-out failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to clock out. Please try again.'], 500);
        }
    }

    /**
     * Get current clock status for the user.
     */
    public function status(Business $business)
    {
        $user = auth()->user();
        $attendance = Attendance::getTodayRecord($user->id, $business->id);

        return response()->json([
            'is_clocked_in' => $attendance && $attendance->start_time && !$attendance->end_time,
            'is_clocked_out' => $attendance && $attendance->end_time,
            'start_time' => $attendance?->start_time,
            'end_time' => $attendance?->end_time,
            'total_hours' => $attendance?->getTotalHoursFormattedAttribute(),
        ]);
    }

    /**
     * Show the form for editing the specified attendance record.
     */
    public function edit(Business $business, Attendance $attendance)
    {
        $user = auth()->user();
        
        // Superadmins always have access
        if ($user->hasRole('superadmin')) {
            $canManage = true;
        } else {
            // Check business role for non-superadmins
            $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
            
            // Users can edit their own attendance records
            $canEditOwn = $attendance->user_id === $user->id;
            
            // Users can edit if they are owners, have attendances.edit permission, or are editing their own record
            $canManage = in_array($userRole, ['owner']) || 
                        $user->can('attendances.edit') || 
                        $user->can('attendances.approve') ||
                        $canEditOwn;
        }

        if (!$canManage) {
            abort(403, 'Unauthorized to edit attendance records.');
        }

        return Inertia::render('Business/Attendance/Edit', [
            'business' => $business,
            'attendance' => $attendance->load('user'),
            'canManage' => $canManage,
            'isOwnRecord' => $attendance->user_id === $user->id,
        ]);
    }

    /**
     * Update attendance record (for managers, users with attendances.edit permission, or users editing their own records).
     */
    public function update(Request $request, Business $business, Attendance $attendance)
    {
        $user = auth()->user();
        
        // Superadmins always have access
        if ($user->hasRole('superadmin')) {
            $canManage = true;
        } else {
            // Check business role for non-superadmins
            $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
            
            // Users can edit their own attendance records
            $canEditOwn = $attendance->user_id === $user->id;
            
            // Users can edit if they are owners, have attendances.edit permission, or are editing their own record
            $canManage = in_array($userRole, ['owner']) || 
                        $user->can('attendances.edit') || 
                        $user->can('attendances.approve') ||
                        $canEditOwn;
        }

        if (!$canManage) {
            // Check if this is a status-only update and user has attendances.approve permission
            if ($request->has('status') && count($request->all()) === 1 && $user->can('attendances.approve')) {
                $canManage = true;
            } else {
                abort(403, 'Unauthorized to update attendance records.');
            }
        }

        $validated = $request->validate([
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'notes' => 'nullable|string|max:500',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        // Calculate hours automatically if both start and end times are provided
        if (!empty($validated['start_time']) && !empty($validated['end_time'])) {
            // Convert from local timezone to Malaysia timezone before storing
            $startTime = \Carbon\Carbon::parse($validated['start_time'])->setTimezone('Asia/Kuala_Lumpur');
            $endTime = \Carbon\Carbon::parse($validated['end_time'])->setTimezone('Asia/Kuala_Lumpur');
            
            // Update the validated data with Malaysia timezone times
            $validated['start_time'] = $startTime->format('Y-m-d H:i:s'); // Store as Malaysia time, not UTC
            $validated['end_time'] = $endTime->format('Y-m-d H:i:s'); // Store as Malaysia time, not UTC
            
            if ($startTime < $endTime) {
                // Use the correct order: endTime->diffInMinutes(startTime) gives positive value
                $totalMinutes = $endTime->diffInMinutes($startTime);
                $totalHours = $totalMinutes / 60;
                
                // Ensure we have positive values
                $totalHours = abs($totalHours);
                
                // Assuming 8 hours is regular time, anything over is overtime
                $regularHours = min($totalHours, 8);
                $overtimeHours = max(0, $totalHours - 8);
                
                $validated['regular_units'] = round($regularHours, 2);
                $validated['overtime_units'] = round($overtimeHours, 2);
            } else {
                $validated['regular_units'] = 0;
                $validated['overtime_units'] = 0;
            }
        } else {
            // If times are not provided, preserve existing hours (don't reset to 0)
            // This prevents losing hours when doing status-only updates
            // Only preserve if the fields are not explicitly set in the request
            if (!array_key_exists('regular_units', $validated)) {
                $validated['regular_units'] = $attendance->regular_units;
            }
            if (!array_key_exists('overtime_units', $validated)) {
                $validated['overtime_units'] = $attendance->overtime_units;
            }
        }

        $attendance->update($validated);

        return back()->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Show the form for creating a new attendance record.
     * Only accessible by users with attendance.create permission or superadmin.
     */
    public function create(Business $business)
    {
        $user = auth()->user();
        
        // Check if user can create attendance records
        if (!($user->profile && $user->profile->role === 'superadmin') && !$user->can('attendances.create')) {
            abort(403, 'Unauthorized to create attendance records.');
        }
        
        // Get business users for selection
        $businessUsers = $business->users()->with('profile')->get();
        
        return Inertia::render('Business/Attendance/Create', [
            'business' => $business,
            'businessUsers' => $businessUsers,
        ]);
    }

    /**
     * Store a newly created attendance record.
     * Only accessible by users with attendance.create permission or superadmin.
     */
    public function store(Request $request, Business $business)
    {
        $user = auth()->user();
        
        // Check if user can create attendance records
        if (!($user->profile && $user->profile->role === 'superadmin') && !$user->can('attendances.create')) {
            abort(403, 'Unauthorized to create attendance records.');
        }
        
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'work_date' => 'required|date',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'notes' => 'nullable|string|max:500',
            'status' => 'required|in:pending,approved,rejected',
        ]);
        
        // Check if the selected user belongs to this business
        if (!$business->users()->where('user_id', $validated['user_id'])->exists()) {
            abort(403, 'Selected user does not belong to this business.');
        }
        
        // Calculate hours automatically if both start and end times are provided
        if (!empty($validated['start_time']) && !empty($validated['end_time'])) {
            $startTime = \Carbon\Carbon::parse($validated['start_time'])->setTimezone('Asia/Kuala_Lumpur');
            $endTime = \Carbon\Carbon::parse($validated['end_time'])->setTimezone('Asia/Kuala_Lumpur');
            
            // Update the validated data with Malaysia timezone times
            $validated['start_time'] = $startTime->format('Y-m-d H:i:s');
            $validated['end_time'] = $endTime->format('Y-m-d H:i:s');
            
            if ($startTime < $endTime) {
                $totalMinutes = $endTime->diffInMinutes($startTime);
                $totalHours = $totalMinutes / 60;
                
                $totalHours = abs($totalHours);
                
                // Assuming 8 hours is regular time, anything over is overtime
                $regularHours = min($totalHours, 8);
                $overtimeHours = max(0, $totalHours - 8);
                
                $validated['regular_units'] = round($regularHours, 2);
                $validated['overtime_units'] = round($overtimeHours, 2);
            } else {
                $validated['regular_units'] = 0;
                $validated['overtime_units'] = 0;
            }
        } else {
            $validated['regular_units'] = 0;
            $validated['overtime_units'] = 0;
        }
        
        // Add business_id to the validated data
        $validated['business_id'] = $business->id;
        
        // Create the attendance record
        $attendance = Attendance::create($validated);
        
        return redirect()->route('businesses.attendance.index', $business)
            ->with('success', 'Attendance record created successfully.');
    }

    /**
     * Delete attendance record (for managers and users with attendances.delete permission).
     * Note: Users cannot delete their own attendance records for security reasons.
     */
    public function destroy(Business $business, Attendance $attendance)
    {
        $user = auth()->user();
        
        // Superadmins always have access
        if ($user->hasRole('superadmin')) {
            $canManage = true;
        } else {
            // Check business role for non-superadmins
            $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
            
            // Users cannot delete their own attendance records for security reasons
            // Only managers, owners, or users with attendances.delete permission can delete
            $canManage = in_array($userRole, ['owner']) || $user->can('attendances.delete');
        }

        if (!$canManage) {
            return response()->json(['error' => 'Unauthorized to delete attendance records.'], 403);
        }

        try {
            $attendance->delete();
            return response()->json(['message' => 'Attendance record deleted successfully.'], 200);
        } catch (\Exception $e) {
            \Log::error('Delete attendance failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'attendance_id' => $attendance->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json(['error' => 'Failed to delete attendance record.'], 500);
        }
    }
}
