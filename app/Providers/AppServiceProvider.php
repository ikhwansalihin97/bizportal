<?php

namespace App\Providers;

use App\Models\Business;
use App\Models\User;
use App\Policies\BusinessPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set the application timezone consistently
        date_default_timezone_set('Asia/Kuala_Lumpur');
                
        // Register policies
        Gate::policy(Business::class, BusinessPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
