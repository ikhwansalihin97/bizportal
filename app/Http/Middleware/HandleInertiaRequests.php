<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? $request->user()->load(['roles', 'permissions', 'businesses', 'profile']) : null,
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name')->toArray() : [],
                'roles' => $request->user() ? $request->user()->getRoleNames()->toArray() : [],
                'isSuperAdmin' => $request->user() ? $request->user()->isSuperAdmin() : false,
                'businesses' => $request->user() ? $request->user()->businesses()->get()->map(function($business) {
                    return [
                        'id' => $business->id,
                        'name' => $business->name,
                        'slug' => $business->slug,
                        'role' => $business->pivot->business_role,
                        'status' => $business->pivot->employment_status,
                        'joined_date' => $business->pivot->joined_date,
                        'features' => $business->enabledFeatures()->get()->map(function($feature) {
                            return [
                                'id' => $feature->id,
                                'name' => $feature->name,
                                'slug' => $feature->slug,
                                'description' => $feature->description,
                                'category' => $feature->category,
                                'is_active' => $feature->is_active,
                                'pivot' => [
                                    'is_enabled' => $feature->pivot->is_enabled,
                                    'settings' => $feature->pivot->settings,
                                    'enabled_at' => $feature->pivot->enabled_at,
                                    'enabled_by' => $feature->pivot->enabled_by,
                                ],
                            ];
                        })->toArray(),
                    ];
                })->toArray() : [],
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Flash messages
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
