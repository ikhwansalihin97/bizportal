<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BusinessFeature extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'is_active',
        'settings',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically generate slug when creating a feature
        static::creating(function ($feature) {
            if (empty($feature->slug)) {
                $feature->slug = \Illuminate\Support\Str::slug($feature->name);
                
                // Ensure slug is unique
                $originalSlug = $feature->slug;
                $counter = 1;
                
                while (static::where('slug', $feature->slug)->exists()) {
                    $feature->slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }
        });
    }

    /**
     * Get businesses that have this feature assigned.
     */
    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_feature_assignments', 'feature_id', 'business_id')
            ->withPivot(['is_enabled', 'settings', 'enabled_at', 'enabled_by'])
            ->withTimestamps();
    }

    /**
     * Get enabled businesses for this feature.
     */
    public function enabledBusinesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_feature_assignments', 'feature_id', 'business_id')
            ->withPivot(['is_enabled', 'settings', 'enabled_at', 'enabled_by'])
            ->withTimestamps()
            ->wherePivot('is_enabled', true);
    }

    /**
     * Check if a business has this feature enabled.
     */
    public function isEnabledForBusiness(Business $business): bool
    {
        return $this->businesses()
            ->where('business_id', $business->id)
            ->wherePivot('is_enabled', true)
            ->exists();
    }

    /**
     * Get the feature's settings for a specific business.
     */
    public function getSettingsForBusiness(Business $business): array
    {
        $assignment = $this->businesses()
            ->where('business_id', $business->id)
            ->first();

        return $assignment?->pivot?->settings ?? [];
    }

}
