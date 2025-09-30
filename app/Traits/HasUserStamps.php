<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait HasUserStamps
{
    /**
     * Boot the trait.
     */
    protected static function bootHasUserStamps()
    {
        // Set created_by when creating a record
        static::creating(function ($model) {
            if (Auth::check() && empty($model->created_by)) {
                $model->created_by = Auth::id();
            }
        });

        // Set updated_by when updating a record
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        // Set deleted_by when soft deleting a record
        static::deleting(function ($model) {
            if (Auth::check() && method_exists($model, 'bootSoftDeletes')) {
                $model->deleted_by = Auth::id();
                $model->save();
            }
        });
    }

    /**
     * Get the user who created this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who deleted this record.
     */
    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Check if the current user created this record.
     */
    public function wasCreatedByCurrentUser(): bool
    {
        return Auth::check() && $this->created_by === Auth::id();
    }

    /**
     * Check if the current user last updated this record.
     */
    public function wasUpdatedByCurrentUser(): bool
    {
        return Auth::check() && $this->updated_by === Auth::id();
    }

    /**
     * Check if the current user deleted this record.
     */
    public function wasDeletedByCurrentUser(): bool
    {
        return Auth::check() && $this->deleted_by === Auth::id();
    }
}
