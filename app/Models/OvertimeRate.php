<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasUuid;
use App\Traits\HasUserStamps;

class OvertimeRate extends Model
{
    use HasFactory, HasUuid, HasUserStamps, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'business_id',
        'salary_type_id',
        'name',
        'code',
        'rate_type',
        'multiplier',
        'fixed_rate',
        'conditions',
        'description',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'multiplier' => 'decimal:2',
        'fixed_rate' => 'decimal:2',
        'conditions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the business that owns the overtime rate.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Get the salary type that owns the overtime rate.
     */
    public function salaryType(): BelongsTo
    {
        return $this->belongsTo(SalaryType::class);
    }

    /**
     * Get the attendance records for this overtime rate.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Scope to get active rates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
