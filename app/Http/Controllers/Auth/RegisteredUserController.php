<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/register', [
            'invitation_token' => $request->session()->get('invitation_token'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            
            // Optional profile fields during registration
            'job_title' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            
            // Invitation token for business membership
            'invitation_token' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Update profile with additional fields
        if ($request->filled(['job_title', 'phone'])) {
            $user->profile->update([
                'job_title' => $request->job_title,
                'phone' => $request->phone,
            ]);
        }

        // Handle business invitation if token provided
        if ($request->filled('invitation_token')) {
            $this->handleBusinessInvitation($user, $request->invitation_token);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Handle business invitation during registration.
     */
    private function handleBusinessInvitation(User $user, string $token): void
    {
        try {
            // Find business with this invitation token for this user email
            $business = \App\Models\Business::whereHas('users', function ($query) use ($user, $token) {
                $query->where('email', $user->email)
                      ->where('invitation_token', $token)
                      ->whereNull('invitation_accepted_at');
            })->first();

            if ($business) {
                // Update the invitation as accepted
                $business->users()->updateExistingPivot($user->id, [
                    'invitation_accepted_at' => now(),
                    'invitation_token' => null,
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail registration
            Log::error('Failed to handle business invitation during registration', [
                'user_id' => $user->id,
                'token' => $token,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
