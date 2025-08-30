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

        // Check if user is already clocked in today
        if (Attendance::hasClockedInToday($user->id, $business->id)) {
            return back()->with('error', 'You have already clocked in today.');
        }

        // Get current salary rate for the user
        $salaryRate = $user->getCurrentSalaryRate($business->id);

        // Create attendance record
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'salary_rate_id' => $salaryRate?->id,
            'work_date' => Carbon::today(),
            'start_time' => Carbon::now(),
            'status' => 'pending',
        ]);

        return back()->with('success', 'Successfully clocked in at ' . Carbon::now()->format('H:i'));
    }

    /**
     * Clock out for the current user.
     */
    public function clockOut(Request $request, Business $business)
    {
        $user = auth()->user();

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
        $regularUnits = $endTime->diffInHours($startTime) + ($endTime->diffInMinutes($startTime) % 60) / 60;

        // Update attendance record
        $attendance->update([
            'end_time' => $endTime,
            'regular_units' => $regularUnits,
        ]);

        return back()->with('success', 'Successfully clocked out at ' . $endTime->format('H:i'));
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
     * Update attendance record (for managers).
     */
    public function update(Request $request, Business $business, Attendance $attendance)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to update attendance records.');
        }

        $validated = $request->validate([
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'regular_units' => 'nullable|numeric|min:0',
            'overtime_units' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $attendance->update($validated);

        return back()->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Delete attendance record (for managers).
     */
    public function destroy(Business $business, Attendance $attendance)
    {
        $user = auth()->user();
        $userRole = $business->users()->where('user_id', $user->id)->first()->pivot->business_role ?? null;
        $canManage = in_array($userRole, ['owner']) || $user->hasRole('superadmin');

        if (!$canManage) {
            abort(403, 'Unauthorized to delete attendance records.');
        }

        $attendance->delete();

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
