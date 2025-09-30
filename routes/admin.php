<?php

use App\Http\Controllers\AdminFeatureController;
use App\Http\Controllers\BusinessFeatureController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Management Routes
|--------------------------------------------------------------------------
|
| Routes for system administration including user management.
| All routes require authentication and admin privileges.
|
*/

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    
    // Debug route
    Route::get('/debug', function () {
        $user = Auth::user();
        return Inertia::render('Admin/Users/Debug', [
            'canCreateUsers' => $user->can('create', App\Models\User::class),
            'userRole' => $user->profile?->role ?? 'none',
            'userStatus' => $user->profile?->status ?? 'none',
        ]);
    })->name('debug');
    
    // User Management Routes
    Route::prefix('users')->name('users.')->group(function () {
        
        // User CRUD
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/create', [UserController::class, 'create'])->name('create');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}', [UserController::class, 'show'])->name('show');
        Route::get('/{user}/edit', [UserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
        
        // User restoration (for soft deletes)
        Route::post('/{user}/restore', [UserController::class, 'restore'])->name('restore');
        
        // User status management
        Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('toggle-status');
        
        // Email verification management
        Route::post('/{user}/send-verification', [UserController::class, 'sendVerification'])->name('send-verification');
        Route::post('/{user}/verify-email', [UserController::class, 'verifyEmail'])->name('verify-email');
        
        // Statistics
        Route::get('/stats', [UserController::class, 'stats'])->name('stats');
    });
    
    // Role Management Routes
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::get('/create', [RoleController::class, 'create'])->name('create');
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::get('/{role}', [RoleController::class, 'show'])->name('show');
        Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('edit');
        Route::put('/{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
    });
    
    // Permission Management Routes
    Route::prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->name('index');
        Route::get('/create', [PermissionController::class, 'create'])->name('create');
        Route::post('/', [PermissionController::class, 'store'])->name('store');
        Route::get('/{permission}', [PermissionController::class, 'show'])->name('show');
        Route::get('/{permission}/edit', [PermissionController::class, 'edit'])->name('edit');
        Route::put('/{permission}', [PermissionController::class, 'update'])->name('update');
        Route::delete('/{permission}', [PermissionController::class, 'destroy'])->name('destroy');
    });

    // Business Features Management Routes
    Route::prefix('features')->name('features.')->group(function () {
        Route::get('/', [AdminFeatureController::class, 'index'])->name('index');
        Route::get('/create', [AdminFeatureController::class, 'create'])->name('create');
        Route::post('/', [AdminFeatureController::class, 'store'])->name('store');
        Route::get('/{feature}', [AdminFeatureController::class, 'show'])->name('show');
        Route::get('/{feature}/edit', [AdminFeatureController::class, 'edit'])->name('edit');
        Route::put('/{feature}', [AdminFeatureController::class, 'update'])->name('update');
        Route::delete('/{feature}', [AdminFeatureController::class, 'destroy'])->name('destroy');
        
        // Feature assignment to businesses
        Route::post('/{feature}/assign/{business}', [AdminFeatureController::class, 'assignToBusiness'])->name('assign')->where('business', '[0-9]+');
        Route::get('/business/{business}', [AdminFeatureController::class, 'getBusinessFeatures'])->name('business');
    });
});

// API Routes for AJAX calls (same authentication required)
Route::middleware(['auth', 'verified'])->prefix('api/admin')->name('api.admin.')->group(function () {
    
    // User API endpoints
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/restore', [UserController::class, 'restore']);
        Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('/{user}/send-verification', [UserController::class, 'sendVerification']);
        Route::post('/{user}/verify-email', [UserController::class, 'verifyEmail']);
        Route::get('/stats', [UserController::class, 'stats']);
    });
    
    // Role API endpoints
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/{role}', [RoleController::class, 'show']);
        Route::put('/{role}', [RoleController::class, 'update']);
        Route::delete('/{role}', [RoleController::class, 'destroy']);
    });
    
    // Permission API endpoints
    Route::prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::get('/{permission}', [PermissionController::class, 'show']);
        Route::put('/{permission}', [PermissionController::class, 'update']);
        Route::delete('/{permission}', [PermissionController::class, 'destroy']);
    });
});
