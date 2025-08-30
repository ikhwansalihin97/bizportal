import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, AlertCircle } from 'lucide-react';
import type { User as UserType } from '@/types';

interface DebugProps {
  auth: {
    user: UserType;
  };
  canCreateUsers: boolean;
  userRole: string;
  userStatus: string;
}

export default function AdminDebug({ auth, canCreateUsers, userRole, userStatus }: DebugProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Debug', href: '/admin/debug' }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin Debug" />
      
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Access Debug</h1>
              <p className="text-muted-foreground">
                Check your permissions and role status
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{auth.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{auth.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-lg">{auth.user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Verified</label>
                  <p className="text-lg">{auth.user.email_verified_at ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile & Role Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">System Role</label>
                  <p className="text-lg font-semibold">{userRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-lg font-semibold">{userStatus}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Job Title</label>
                  <p className="text-lg">{auth.user.profile?.job_title || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg">{auth.user.profile?.department || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Can Create Users</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    canCreateUsers 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {canCreateUsers ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Status */}
          {canCreateUsers ? (
            <Alert className="border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Access Granted:</strong> You have permission to access admin features.
                <br />
                <a href="/admin/users/create" className="underline hover:no-underline">
                  Try accessing the Create User page
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Access Denied:</strong> You don't have permission to create users.
                <br />
                You need to be logged in as a <strong>Superadmin</strong> or <strong>Business Admin</strong>.
                <br />
                <br />
                Try logging in with:
                <ul className="list-disc list-inside mt-2">
                  <li><strong>Superadmin:</strong> admin@bizportal.com (password: password)</li>
                  <li><strong>Business Admin:</strong> bizadmin@bizportal.com (password: password)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Data (Debug)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({
                  user: auth.user,
                  canCreateUsers,
                  userRole,
                  userStatus
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
