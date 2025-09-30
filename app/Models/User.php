<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasUserStamps;
use App\Traits\HasUuid;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, HasUserStamps, HasUuid, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically create user profile when user is created
        static::created(function ($user) {
            $user->profile()->create();
        });
    }

    /**
     * Get the user's profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Get businesses created by this user.
     */
    public function createdBusinesses(): HasMany
    {
        return $this->hasMany(Business::class, 'created_by');
    }

    /**
     * Get businesses this user belongs to.
     */
    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_users')
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
     * Get active businesses only.
     */
    public function activeBusinesses(): BelongsToMany
    {
        return $this->businesses()->wherePivot('employment_status', 'active');
    }

    /**
     * Get businesses where user is owner (business_role = 'owner').
     */
    public function ownedBusinesses(): BelongsToMany
    {
        return $this->businesses()->wherePivot('business_role', 'owner');
    }

    /**
     * Get the salary rates for this user.
     */
    public function salaryRates(): HasMany
    {
        return $this->hasMany(SalaryRate::class);
    }

    /**
     * Get the current active salary rate for this user in a specific business.
     */
    public function getCurrentSalaryRate($businessId)
    {
        return $this->salaryRates()
            ->where('business_id', $businessId)
            ->active()
            ->current()
            ->first();
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Check if user is a superadmin.
     * Only 'superadmin' role grants superadmin status.
     */
    public function isSuperAdmin(): bool
    {
        // Check Spatie roles
        $spatieRoles = $this->getRoleNames()->toArray();
        if (in_array('superadmin', $spatieRoles)) {
            return true;
        }
        
        // Check profile role
        $profileRole = $this->profile?->role;
        if ($profileRole === 'superadmin') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->profile?->status === 'active';
    }

    /**
     * Check if user belongs to a specific business.
     */
    public function belongsToBusiness(Business $business): bool
    {
        return $this->businesses()->where('business_id', $business->id)->exists();
    }

    /**
     * Get user's role in a specific business.
     */
    public function getRoleInBusiness(Business $business): ?string
    {
        $pivot = $this->businesses()->where('business_id', $business->id)->first()?->pivot;
        return $pivot?->business_role;
    }

    /**
     * Check if user has a specific role in a business.
     */
    public function hasRoleInBusiness(Business $business, string $role): bool
    {
        return $this->getRoleInBusiness($business) === $role;
    }

    /**
     * Check if user can manage a specific business.
     */
    public function canManageBusiness(Business $business): bool
    {
        // Superadmin can manage all businesses
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if user is owner of this business
        $role = $business->users()->where('user_id', $this->id)->first()?->pivot->business_role;
        if ($role === 'owner') {
            return true;
        }

        // Check if user has relevant permissions for managing users
        if ($this->can('users.create') || $this->can('users.view') || $this->can('users.edit')) {
            return true;
        }

        return false;
    }

    /**
     * Get user's avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        $avatar = $this->profile?->avatar;
        return $avatar ? asset('storage/' . $avatar) : null;
    }

    /**
     * Get user's full name with job title.
     */
    public function getFullTitleAttribute(): string
    {
        $jobTitle = $this->profile?->job_title;
        return $jobTitle ? "{$this->name} - {$jobTitle}" : $this->name;
    }

    /**
     * Get user's initials for avatar fallback.
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';
        
        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        
        return substr($initials, 0, 2);
    }

    /**
     * Get advances requested by this user.
     */
    public function advances()
    {
        return $this->hasMany(Advance::class);
    }

    /**
     * Get claims submitted by this user.
     */
    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Get advances approved by this user.
     */
    public function approvedAdvances()
    {
        return $this->hasMany(Advance::class, 'approved_by');
    }

    /**
     * Get claims approved by this user.
     */
    public function approvedClaims()
    {
        return $this->hasMany(Claim::class, 'approved_by');
    }
}
