<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\BusinessFeatureController;
use App\Http\Controllers\BusinessUserController;
use App\Http\Controllers\BusinessAdvanceController;
use App\Http\Controllers\BusinessClaimController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SalaryConfigurationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Business Management Routes
|--------------------------------------------------------------------------
|
| Routes for business management, user profiles, and business-user relationships.
| All routes require authentication.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Business routes
    Route::prefix('businesses')->name('businesses.')->group(function () {
        // Business CRUD
        Route::get('/', [BusinessController::class, 'index'])->name('index');
        Route::get('/create', [BusinessController::class, 'create'])->name('create');
        Route::post('/', [BusinessController::class, 'store'])->name('store');
        Route::get('/{business}', [BusinessController::class, 'show'])->name('show');
        Route::get('/{business}/edit', [BusinessController::class, 'edit'])->name('edit');
        Route::put('/{business}', [BusinessController::class, 'update'])->name('update');
        Route::delete('/{business}', [BusinessController::class, 'destroy'])->name('destroy');

        // Business Dashboard
        Route::get('/{business}/dashboard', [BusinessController::class, 'dashboard'])->name('dashboard');

        // Attendance Management
        Route::prefix('{business}/attendance')->group(function () {
            Route::get('/', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::get('/my-records', [AttendanceController::class, 'myRecords'])->name('attendance.myRecords');
            Route::get('/report', [AttendanceController::class, 'report'])->name('attendance.report');
            Route::get('/user/{user}/records', [AttendanceController::class, 'userRecords'])->name('attendance.userRecords');
            Route::post('/clock-in', [AttendanceController::class, 'clockIn'])->name('attendance.clockIn');
            Route::post('/clock-out', [AttendanceController::class, 'clockOut'])->name('attendance.clockOut');
            Route::get('/status', [AttendanceController::class, 'status'])->name('attendance.status');
            
            // Manual Attendance Record Management (Admin/Superadmin only)
            Route::middleware(['auth', 'superadmin.or.permission:attendances.create'])->group(function () {
                Route::get('/create', [AttendanceController::class, 'create'])->name('attendance.create');
                Route::post('/', [AttendanceController::class, 'store'])->name('attendance.store');
            });
            
            Route::get('/records/{attendance}/edit', [AttendanceController::class, 'edit'])->name('attendance.edit');
            Route::put('/records/{attendance}', [AttendanceController::class, 'update'])->name('attendance.update');
            Route::delete('/records/{attendance}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
        });

        // Salary configuration
        Route::prefix('{business}/salary-config')->group(function () {
            Route::get('/', [SalaryConfigurationController::class, 'index'])->name('salary-config.index');
            
            // Salary rates
            Route::post('/salary-rates', [SalaryConfigurationController::class, 'storeSalaryRate'])->name('salary-config.salary-rates.store');
            Route::put('/salary-rates/{salaryRate}', [SalaryConfigurationController::class, 'updateSalaryRate'])->name('salary-config.salary-rates.update');
            Route::delete('/salary-rates/{salaryRate}', [SalaryConfigurationController::class, 'destroySalaryRate'])->name('salary-config.salary-rates.destroy');
            
            // Overtime rates
            Route::post('/overtime-rates', [SalaryConfigurationController::class, 'storeOvertimeRate'])->name('salary-config.overtime-rates.store');
            Route::put('/overtime-rates/{overtimeRate}', [SalaryConfigurationController::class, 'updateOvertimeRate'])->name('salary-config.overtime-rates.update');
            Route::delete('/overtime-rates/{overtimeRate}', [SalaryConfigurationController::class, 'destroyOvertimeRate'])->name('salary-config.overtime-rates.destroy');
        });

        // Feature Management
        Route::prefix('{business}/features')->name('features.')->group(function () {
            Route::get('/', [BusinessFeatureController::class, 'index'])->name('index');
            Route::post('/assign', [BusinessFeatureController::class, 'assign'])->name('assign');
            Route::delete('/remove', [BusinessFeatureController::class, 'remove'])->name('remove');
            Route::get('/{feature}', [BusinessController::class, 'showFeature'])->name('show');
        });

        // Advances routes
        Route::prefix('{business}/advances')->name('advances.')->group(function () {
            Route::get('/', [BusinessAdvanceController::class, 'index'])->name('index');
            Route::get('/create', [BusinessAdvanceController::class, 'create'])->name('create');
            Route::post('/', [BusinessAdvanceController::class, 'store'])->name('store');
            Route::get('/{advance}', [BusinessAdvanceController::class, 'show'])->name('show');
            Route::get('/{advance}/edit', [BusinessAdvanceController::class, 'edit'])->name('edit');
            Route::put('/{advance}', [BusinessAdvanceController::class, 'update'])->name('update');
            Route::delete('/{advance}', [BusinessAdvanceController::class, 'destroy'])->name('destroy');
            Route::put('/{advance}/status', [BusinessAdvanceController::class, 'updateStatus'])->name('updateStatus');
            Route::put('/{advance}/paid', [BusinessAdvanceController::class, 'markAsPaid'])->name('markAsPaid');
        });

        // Claims routes
        Route::prefix('{business}/claims')->name('claims.')->group(function () {
            Route::get('/', [BusinessClaimController::class, 'index'])->name('index');
            Route::get('/create', [BusinessClaimController::class, 'create'])->name('create');
            Route::post('/', [BusinessClaimController::class, 'store'])->name('store');
            Route::get('/{claim}', [BusinessClaimController::class, 'show'])->name('show');
            Route::get('/{claim}/edit', [BusinessClaimController::class, 'edit'])->name('edit');
            Route::put('/{claim}', [BusinessClaimController::class, 'update'])->name('update');
            Route::delete('/{claim}', [BusinessClaimController::class, 'destroy'])->name('destroy');
            Route::put('/{claim}/status', [BusinessClaimController::class, 'updateStatus'])->name('updateStatus');
            Route::put('/{claim}/paid', [BusinessClaimController::class, 'markAsPaid'])->name('markAsPaid');
        });
        
        // Business User Management
        Route::prefix('{business}/users')->name('users.')->group(function () {
            Route::get('/', [BusinessUserController::class, 'index'])->name('index');
            Route::get('/invite', [BusinessUserController::class, 'invite'])->name('invite');
            Route::post('/invite', [BusinessUserController::class, 'sendInvite'])->name('sendInvite');
            Route::get('/{user}', [BusinessUserController::class, 'show'])->name('show');
            Route::put('/{user}', [BusinessUserController::class, 'update'])->name('update');
            Route::delete('/{user}', [BusinessUserController::class, 'destroy'])->name('destroy');
        });
    });
    
    // Business Invitation Management
    Route::prefix('invitations')->name('invitations.')->group(function () {
        Route::get('/pending', [BusinessUserController::class, 'pendingInvitations'])->name('pending');
        Route::post('/accept', [BusinessUserController::class, 'acceptInvitation'])->name('accept');
        Route::post('/decline', [BusinessUserController::class, 'declineInvitation'])->name('decline');
    });
    
    // Profile Management Routes
    Route::prefix('profile')->name('user.profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::put('/', [ProfileController::class, 'update'])->name('update');
        
        // Avatar management
        Route::post('/avatar', [ProfileController::class, 'updateAvatar'])->name('avatar.update');
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar'])->name('avatar.delete');
        
        // Profile data endpoints
        Route::get('/businesses', [ProfileController::class, 'businesses'])->name('businesses');
        Route::get('/stats', [ProfileController::class, 'stats'])->name('stats');
        Route::post('/last-login', [ProfileController::class, 'updateLastLogin'])->name('last-login');
    });
    
    // Admin routes for managing other users' profiles (superadmin only)
    Route::prefix('admin')->name('admin.')->middleware('can:viewAny,App\Models\User')->group(function () {
        Route::prefix('users/{user}')->name('users.')->group(function () {
            Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
            Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
            Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
            Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');
            Route::get('/profile/businesses', [ProfileController::class, 'businesses'])->name('profile.businesses');
            Route::get('/profile/stats', [ProfileController::class, 'stats'])->name('profile.stats');
        });
    });
});

// API Routes for AJAX calls (same authentication required)
Route::middleware(['auth', 'verified'])->prefix('api')->name('api.')->group(function () {
    
    // Business API endpoints
    Route::prefix('businesses')->name('businesses.')->group(function () {
        Route::get('/', [BusinessController::class, 'index']);
        Route::post('/', [BusinessController::class, 'store']);
        Route::get('/{business}', [BusinessController::class, 'show']);
        Route::put('/{business}', [BusinessController::class, 'update']);
        Route::delete('/{business}', [BusinessController::class, 'destroy']);
        Route::post('/{business}/restore', [BusinessController::class, 'restore']);
        Route::get('/{business}/dashboard', [BusinessController::class, 'dashboard']);
        
        // Business users API
        Route::prefix('{business}/users')->name('users.')->group(function () {
            Route::get('/', [BusinessUserController::class, 'index']);
            Route::post('/', [BusinessUserController::class, 'store']);
            Route::get('/{user}', [BusinessUserController::class, 'show']);
            Route::put('/{user}', [BusinessUserController::class, 'update']);
            Route::delete('/{user}', [BusinessUserController::class, 'destroy']);
        });
        
        // Business features API
        Route::get('/{business}/features', [BusinessController::class, 'features'])->name('features.index');
        Route::get('/{business}/features/{feature}', [BusinessController::class, 'showFeature'])->name('features.show');
    });
    
    // Profile API endpoints
    Route::prefix('profile')->name('api.profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);
        Route::get('/businesses', [ProfileController::class, 'businesses']);
        Route::get('/stats', [ProfileController::class, 'stats']);
        Route::post('/last-login', [ProfileController::class, 'updateLastLogin']);
    });
    
    // Invitation API endpoints
    Route::prefix('invitations')->name('invitations.')->group(function () {
        Route::get('/pending', [BusinessUserController::class, 'pendingInvitations']);
        Route::post('/accept', [BusinessUserController::class, 'acceptInvitation']);
        Route::post('/decline', [BusinessUserController::class, 'declineInvitation']);
    });
    
    // Utility API endpoints
    Route::get('/industries', [BusinessController::class, 'industries'])->name('industries');
    Route::get('/roles', [BusinessUserController::class, 'roles'])->name('roles');
});

// Public invitation acceptance routes (for email links)
Route::prefix('invitations')->name('invitations.')->group(function () {
    Route::get('/accept/{token}', function ($token) {
        return redirect()->route('login')->with('invitation_token', $token);
    })->name('accept.link');
    
    Route::get('/decline/{token}', function ($token) {
        return redirect()->route('login')->with([
            'invitation_token' => $token,
            'action' => 'decline'
        ]);
    })->name('decline.link');
});
