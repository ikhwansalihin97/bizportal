<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasUuid;
use App\Traits\HasUserStamps;

class SalaryType extends Model
{
    use HasFactory, HasUuid, HasUserStamps, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'code',
        'unit',
        'description',
        'allows_overtime',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'allows_overtime' => 'boolean',
    ];

    /**
     * Get the salary rates for this salary type.
     */
    public function salaryRates(): HasMany
    {
        return $this->hasMany(SalaryRate::class);
    }

    /**
     * Get the overtime rates for this salary type.
     */
    public function overtimeRates(): HasMany
    {
        return $this->hasMany(OvertimeRate::class);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
