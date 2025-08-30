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
        
        // Check if user can view attendance (superadmin, business member, or has attendance.view permission)
        $canView = $user->hasRole('superadmin') || 
                   $business->users()->where('user_id', $user->id)->exists() || 
                   $user->can('attendance.view');
        
        if (!$canView) {
            abort(403, 'Unauthorized to view attendance records.');
        }
        
        // Superadmins are always considered business members
        $isBusinessMember = $user->hasRole('superadmin') || $business->users()->where('user_id', $user->id)->exists();

        // Get today's attendance for the business
        $todayAttendance = Attendance::where('business_id', $business->id)
            ->where('work_date', Carbon::today())
            ->with(['user'])
            ->get();

        // Get current user's today attendance
        $currentUserAttendance = $todayAttendance->where('user_id', $user->id)->first();

        // Calculate stats
        $stats = [
            'total_employees' => $business->users()->count(),
            'present_today' => $todayAttendance->whereNotNull('start_time')->count(),
            'absent_today' => $business->users()->count() - $todayAttendance->whereNotNull('start_time')->count(),
            'pending_approval' => $todayAttendance->where('status', 'pending')->count(),
        ];

        return Inertia::render('Business/Attendance/Index', [
            'business' => $business,
            'isBusinessMember' => $isBusinessMember,
            'todayAttendance' => $todayAttendance,
            'currentUserAttendance' => $currentUserAttendance,
            'stats' => $stats,
            'userRole' => $userRole,
            'canManage' => $canManage,
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
                   $user->can('attendance.view');
        
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
        $attendance = Attendance::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->orderBy('work_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Calculate monthly stats
        $monthlyStats = [
            'total_days' => $attendance->total(),
            'present_days' => Attendance::where('business_id', $business->id)
                ->where('user_id', $user->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->whereNotNull('start_time')
                ->count(),
            'total_hours' => Attendance::where('business_id', $business->id)
                ->where('user_id', $user->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->sum('regular_units') + 
                Attendance::where('business_id', $business->id)
                ->where('user_id', $user->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->sum('overtime_units'),
        ];

        return Inertia::render('Business/Attendance/UserRecords', [
            'business' => $business,
            'user' => $user->load('profile'),
            'attendance' => $attendance,
            'monthlyStats' => $monthlyStats,
            'userRole' => $userRole,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Clock in for the current user.
     */
    public function clockIn(Request $request, Business $business)
    {
        $user = auth()->user();

        \Log::info('Clock-in attempt started', [
            'user_id' => $user->id,
            'business_id' => $business->id,
            'user_roles' => $user->getRoleNames()->toArray(),
        ]);

        // Check if user is already clocked in today
        if (Attendance::hasClockedInToday($user->id, $business->id)) {
            \Log::info('User already clocked in today', [
                'user_id' => $user->id,
                'business_id' => $business->id,
            ]);
            return back()->with('error', 'You have already clocked in today.');
        }

        try {
            // Check for any existing attendance record for today (even without start_time)
            $existingAttendance = Attendance::where('user_id', $user->id)
                ->where('business_id', $business->id)
                ->where('work_date', Carbon::today())
                ->first();

            if ($existingAttendance) {
                \Log::info('Found existing attendance record, updating start_time', [
                    'attendance_id' => $existingAttendance->id,
                    'user_id' => $user->id,
                    'business_id' => $business->id,
                ]);

                // Update existing record with start_time
                $existingAttendance->update([
                    'start_time' => Carbon::now(),
                    'status' => 'pending',
                ]);

                return back()->with('success', 'Successfully clocked in at ' . Carbon::now()->format('H:i'));
            }

            // Get current salary rate for the user (optional for superadmins)
            $salaryRate = null;
            if (!$user->hasRole('superadmin')) {
                $salaryRate = $user->getCurrentSalaryRate($business->id);
                \Log::info('Salary rate retrieved', [
                    'user_id' => $user->id,
                    'salary_rate_id' => $salaryRate?->id,
                ]);
            }

            // Prepare attendance data
            $attendanceData = [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'salary_rate_id' => $salaryRate?->id,
                'work_date' => Carbon::today(),
                'start_time' => Carbon::now(),
                'status' => 'pending',
            ];

            \Log::info('Creating new attendance record', $attendanceData);

            // Create attendance record
            $attendance = Attendance::create($attendanceData);

            \Log::info('Attendance record created successfully', [
                'attendance_id' => $attendance->id,
                'uuid' => $attendance->uuid,
            ]);

            return back()->with('success', 'Successfully clocked in at ' . Carbon::now()->format('H:i'));
        } catch (\Exception $e) {
            \Log::error('Clock-in failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'attendance_data' => $attendanceData ?? 'not set',
            ]);
            
            return back()->with('error', 'Failed to clock in. Please try again.');
        }
    }

    /**
     * Clock out for the current user.
     */
    public function clockOut(Request $request, Business $business)
    {
        $user = auth()->user();

        try {
            // Get today's attendance record
            $attendance = Attendance::getTodayRecord($user->id, $business->id);

            if (!$attendance) {
                return back()->with('error', 'No clock-in record found for today.');
            }

            if ($attendance->end_time) {
                return back()->with('error', 'You have already clocked out today.');
            }

            // Calculate hours worked
            $endTime = Carbon::now();
            $startTime = Carbon::parse($attendance->start_time);
            
            if ($startTime < $endTime) {
                $totalMinutes = $endTime->diffInMinutes($startTime);
                $totalHours = $totalMinutes / 60;
                
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
                'end_time' => $endTime,
                'regular_units' => $regularUnits,
                'overtime_units' => $overtimeUnits,
            ]);

            return back()->with('success', 'Successfully clocked out at ' . $endTime->format('H:i'));
        } catch (\Exception $e) {
            \Log::error('Clock-out failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'Failed to clock out. Please try again.');
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
            
            // Users can edit if they are owners, have attendance.edit permission, or are editing their own record
            $canManage = in_array($userRole, ['owner']) || 
                        $user->can('attendance.edit') || 
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
     * Update attendance record (for managers, users with attendance.edit permission, or users editing their own records).
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
            
            // Users can edit if they are owners, have attendance.edit permission, or are editing their own record
            $canManage = in_array($userRole, ['owner']) || 
                        $user->can('attendance.edit') || 
                        $canEditOwn;
        }

        if (!$canManage) {
            abort(403, 'Unauthorized to update attendance records.');
        }

        $validated = $request->validate([
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'notes' => 'nullable|string|max:500',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        // Calculate hours automatically if both start and end times are provided
        if (!empty($validated['start_time']) && !empty($validated['end_time'])) {
            $startTime = \Carbon\Carbon::parse($validated['start_time']);
            $endTime = \Carbon\Carbon::parse($validated['end_time']);
            
            \Log::info('Attendance update calculation:', [
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'startTime_parsed' => $startTime->toISOString(),
                'endTime_parsed' => $endTime->toISOString(),
            ]);
            
            if ($startTime < $endTime) {
                $totalMinutes = $endTime->diffInMinutes($startTime);
                $totalHours = $totalMinutes / 60;
                
                // Assuming 8 hours is regular time, anything over is overtime
                $regularHours = min($totalHours, 8);
                $overtimeHours = max(0, $totalHours - 8);
                
                $validated['regular_units'] = round($regularHours, 2);
                $validated['overtime_units'] = round($overtimeHours, 2);
                
                \Log::info('Hours calculated:', [
                    'totalMinutes' => $totalMinutes,
                    'totalHours' => $totalHours,
                    'regularHours' => $regularHours,
                    'overtimeHours' => $overtimeHours,
                    'regular_units' => $validated['regular_units'],
                    'overtime_units' => $validated['overtime_units'],
                ]);
            } else {
                $validated['regular_units'] = 0;
                $validated['overtime_units'] = 0;
                
                \Log::info('Invalid time range - resetting hours to 0');
            }
        } else {
            // If times are not provided, reset hours
            $validated['regular_units'] = 0;
            $validated['overtime_units'] = 0;
            
            \Log::info('No times provided - resetting hours to 0');
        }

        $attendance->update($validated);

        return back()->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Delete attendance record (for managers and users with attendance.delete permission).
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
            // Only managers, owners, or users with attendance.delete permission can delete
            $canManage = in_array($userRole, ['owner']) || $user->can('attendance.delete');
        }

        if (!$canManage) {
            abort(403, 'Unauthorized to delete attendance records.');
        }

        $attendance->delete();

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
