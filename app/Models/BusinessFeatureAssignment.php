<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessFeatureAssignment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'business_id',
        'feature_id',
        'is_enabled',
        'settings',
        'enabled_at',
        'enabled_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_enabled' => 'boolean',
        'settings' => 'array',
        'enabled_at' => 'datetime',
    ];

    /**
     * Get the business that owns the assignment.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Get the feature that is assigned.
     */
    public function feature(): BelongsTo
    {
        return $this->belongsTo(BusinessFeature::class);
    }

    /**
     * Get the user who enabled the feature.
     */
    public function enabledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enabled_by');
    }

    /**
     * Enable the feature for the business.
     */
    public function enable(?User $enabledBy = null): void
    {
        $this->update([
            'is_enabled' => true,
            'enabled_at' => now(),
            'enabled_by' => $enabledBy?->id,
        ]);
    }

    /**
     * Disable the feature for the business.
     */
    public function disable(): void
    {
        $this->update([
            'is_enabled' => false,
            'enabled_at' => null,
            'enabled_by' => null,
        ]);
    }
}
