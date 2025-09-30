<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasUuid
{
    /**
     * Boot the trait.
     */
    protected static function bootHasUuid()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the UUID attribute.
     */
    public function getUuidAttribute(): string
    {
        return $this->attributes['uuid'] ?? '';
    }

    /**
     * Set the UUID attribute.
     */
    public function setUuidAttribute($value): void
    {
        $this->attributes['uuid'] = $value;
    }

    /**
     * Find a model by its UUID.
     */
    public static function findByUuid(string $uuid)
    {
        return static::where('uuid', $uuid)->first();
    }

    /**
     * Find a model by its UUID or fail.
     */
    public static function findByUuidOrFail(string $uuid)
    {
        return static::where('uuid', $uuid)->firstOrFail();
    }
}
