<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasUuid;
use App\Traits\HasUserStamps;
use Carbon\Carbon;

class Attendance extends Model
{
    use HasFactory, HasUuid, HasUserStamps;

    /**
     * The table associated with the model.
     */
    protected $table = 'attendances';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'business_id',
        'salary_rate_id',
        'overtime_rate_id',
        'work_date',
        'start_time',
        'end_time',
        'regular_units',
        'overtime_units',
        'break_times',
        'notes',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'work_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'regular_units' => 'decimal:2',
        'overtime_units' => 'decimal:2',
        'break_times' => 'array',
    ];

    /**
     * Get the user that owns the attendance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the business that owns the attendance record.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Get the salary rate for this attendance record.
     */
    public function salaryRate(): BelongsTo
    {
        return $this->belongsTo(SalaryRate::class);
    }

    /**
     * Get the overtime rate for this attendance record.
     */
    public function overtimeRate(): BelongsTo
    {
        return $this->belongsTo(OvertimeRate::class);
    }

    /**
     * Scope to get attendance for a specific date range.
     */
    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('work_date', [$startDate, $endDate]);
    }

    /**
     * Scope to get attendance for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get attendance for a specific business.
     */
    public function scopeForBusiness($query, $businessId)
    {
        return $query->where('business_id', $businessId);
    }

    /**
     * Scope to get today's attendance records.
     */
    public function scopeToday($query)
    {
        return $query->where('work_date', Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->toDateString());
    }

    /**
     * Scope to get this week's attendance.
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('work_date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ]);
    }

    /**
     * Scope to get this month's attendance records.
     */
    public function scopeThisMonth($query)
    {
        return $query->whereBetween('work_date', [
            Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->startOfMonth(),
            Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->endOfMonth()
        ]);
    }

    /**
     * Check if user has already clocked in today.
     */
    public static function hasClockedInToday($userId, $businessId): bool
    {
        return static::where('user_id', $userId)
            ->where('business_id', $businessId)
            ->where('work_date', Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->toDateString())
            ->whereNotNull('start_time')
            ->exists();
    }

    /**
     * Check if user has already clocked out today.
     */
    public static function hasClockedOutToday($userId, $businessId): bool
    {
        return static::where('user_id', $userId)
            ->where('business_id', $businessId)
            ->where('work_date', Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->toDateString())
            ->whereNotNull('end_time')
            ->exists();
    }

    /**
     * Get today's attendance record for a user.
     */
    public static function getTodayRecord($userId, $businessId)
    {
        return static::where('user_id', $userId)
            ->where('business_id', $businessId)
            ->where('work_date', Carbon::now()->setTimezone('Asia/Kuala_Lumpur')->toDateString())
            ->first();
    }

    /**
     * Calculate total hours worked in a human-readable format.
     */
    public function getTotalHoursFormattedAttribute(): string
    {
        $totalUnits = ($this->regular_units ?? 0) + ($this->overtime_units ?? 0);
        if ($totalUnits == 0) {
            return '0h 0m';
        }

        $hours = floor($totalUnits);
        $minutes = round(($totalUnits - $hours) * 60);

        return "{$hours}h {$minutes}m";
    }

    /**
     * Check if attendance is complete (both clock in and out).
     */
    public function getIsCompleteAttribute(): bool
    {
        return !is_null($this->start_time) && !is_null($this->end_time);
    }

    /**
     * Check if user is currently clocked in.
     */
    public function getIsClockedInAttribute(): bool
    {
        return !is_null($this->start_time) && is_null($this->end_time);
    }

    /**
     * Get the status badge for the attendance record.
     */
    public function getStatusBadgeAttribute(): string
    {
        switch ($this->status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'pending':
            default:
                return 'Pending';
        }
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
