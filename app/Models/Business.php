<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Traits\HasUserStamps;
use App\Traits\HasUuid;

class Business extends Model
{
    use HasFactory, SoftDeletes, HasUserStamps, HasUuid;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'description',
        'industry',
        'website',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'logo',
        'tax_id',
        'registration_number',
        'established_date',
        'employee_count',
        'subscription_plan',
        'settings',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'established_date' => 'date',
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically generate slug when creating a business
        static::creating(function ($business) {
            if (empty($business->slug)) {
                $business->slug = Str::slug($business->name);
                
                // Ensure slug is unique
                $originalSlug = $business->slug;
                $counter = 1;
                
                while (static::where('slug', $business->slug)->exists()) {
                    $business->slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // Note: creator() relationship is provided by HasUserStamps trait

    /**
     * Get all users associated with this business.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_users')
            ->withPivot([
                'business_role',
                'permissions',
                'joined_date',
                'left_date',
                'employment_status',
                'notes',
                'invitation_token',
                'invitation_sent_at',
                'invitation_accepted_at',
                'invited_by',
                'created_by',
                'updated_by',
                'deleted_by',
                'deleted_at'
            ])
            ->withTimestamps();
    }

    /**
     * Get active users only.
     */
    public function activeUsers(): BelongsToMany
    {
        return $this->users()->wherePivot('employment_status', 'active');
    }

    /**
     * Get business owners (users with business_role = 'owner').
     */
    public function owners(): BelongsToMany
    {
        return $this->users()->wherePivot('business_role', 'owner');
    }

    /**
     * Get business employees (users who are not owners).
     */
    public function employees(): BelongsToMany
    {
        return $this->users()->wherePivot('business_role', '!=', 'owner');
    }

    /**
     * Get features assigned to this business.
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(BusinessFeature::class, 'business_feature_assignments', 'business_id', 'feature_id')
            ->withPivot(['is_enabled', 'settings', 'enabled_at', 'enabled_by'])
            ->withTimestamps();
    }

    /**
     * Get enabled features for this business.
     */
    public function enabledFeatures(): BelongsToMany
    {
        return $this->features()->wherePivot('is_enabled', true);
    }

    /**
     * Check if the business has a specific feature enabled.
     */
    public function hasFeature(string $featureSlug): bool
    {
        return $this->enabledFeatures()
            ->where('slug', $featureSlug)
            ->exists();
    }

    /**
     * Get a specific feature's settings for this business.
     */
    public function getFeatureSettings(string $featureSlug): array
    {
        $feature = $this->features()
            ->where('slug', $featureSlug)
            ->first();

        return $feature?->pivot?->settings ?? [];
    }

    /**
     * Scope to get active businesses only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if business is active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Get the business logo URL.
     */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }

    /**
     * Get full business address.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Add a user to the business with a specific role.
     */
    public function addUser(User $user, string $role = 'employee', array $permissions = [], ?User $invitedBy = null): void
    {
        $this->users()->attach($user->id, [
            'business_role' => $role,
            'permissions' => json_encode($permissions),
            'joined_date' => now(),
            'employment_status' => 'active',
            'invited_by' => $invitedBy?->id,
            'invitation_accepted_at' => now(),
        ]);
    }

    /**
     * Remove a user from the business.
     */
    public function removeUser(User $user): void
    {
        $this->users()->updateExistingPivot($user->id, [
            'employment_status' => 'terminated',
            'left_date' => now(),
        ]);
    }

    /**
     * Check if a user belongs to this business.
     */
    public function hasUser(User $user): bool
    {
        return $this->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Get user's role in this business.
     */
    public function getUserRole(User $user): ?string
    {
        $pivot = $this->users()->where('user_id', $user->id)->first()?->pivot;
        return $pivot?->business_role;
    }

    /**
     * Check if user has a specific role in this business.
     */
    public function userHasRole(User $user, string $role): bool
    {
        return $this->getUserRole($user) === $role;
    }

    /**
     * Get advances for this business.
     */
    public function advances()
    {
        return $this->hasMany(Advance::class);
    }

    /**
     * Get claims for this business.
     */
    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Get pending advances for this business.
     */
    public function pendingAdvances()
    {
        return $this->advances()->pending();
    }

    /**
     * Get pending claims for this business.
     */
    public function pendingClaims()
    {
        return $this->claims()->pending();
    }

    /**
     * Get total advances amount for this business.
     */
    public function getTotalAdvancesAmountAttribute(): float
    {
        return $this->advances()->sum('amount');
    }

    /**
     * Get total claims amount for this business.
     */
    public function getTotalClaimsAmountAttribute(): float
    {
        return $this->claims()->sum('amount');
    }

    /**
     * Get total pending advances amount for this business.
     */
    public function getTotalPendingAdvancesAmountAttribute(): float
    {
        return $this->pendingAdvances()->sum('amount');
    }

    /**
     * Get total pending claims amount for this business.
     */
    public function getTotalPendingClaimsAmountAttribute(): float
    {
        return $this->pendingClaims()->sum('amount');
    }
}
