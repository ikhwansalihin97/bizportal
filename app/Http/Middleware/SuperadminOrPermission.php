<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperadminOrPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // Check if user is superadmin (from profile role)
        if ($user->profile && $user->profile->role === 'superadmin') {
            return $next($request);
        }

        // Check if user has the specific permission
        if ($user->can($permission)) {
            return $next($request);
        }

        abort(403, 'This action is unauthorized.');
    }
}
