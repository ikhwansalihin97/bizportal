<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasUserStamps;
use App\Traits\HasUuid;

class UserProfile extends Model
{
    use HasFactory, SoftDeletes, HasUserStamps, HasUuid;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'user_id',
        'phone',
        'address',
        'date_of_birth',
        'avatar',
        'gender',
        'job_title',
        'department',
        'employee_id',
        'role',
        'status',
        'last_login',
        'preferences',
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
        'date_of_birth' => 'date',
        'last_login' => 'datetime',
        'preferences' => 'array',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the user is a superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if the user is a business admin.
     */
    public function isBusinessAdmin(): bool
    {
        return $this->role === 'business_admin';
    }

    /**
     * Check if the user is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get the user's full name with job title.
     */
    public function getFullTitleAttribute(): string
    {
        $name = $this->user->name;
        return $this->job_title ? "{$name} - {$this->job_title}" : $name;
    }

    /**
     * Get the user's initials for avatar fallback.
     */
    public function getInitialsAttribute(): string
    {
        $name = $this->user->name;
        $words = explode(' ', $name);
        $initials = '';
        
        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        
        return substr($initials, 0, 2);
    }

    /**
     * Update the last login timestamp.
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login' => now()]);
    }
}
