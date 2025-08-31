import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  ArrowLeft, 
  Crown,
  Shield,
  Settings,
  User,
  Eye,
  Mail,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { PermissionManager } from '@/components/business/permission-manager';
import type { Business, BusinessRole } from '@/types';

interface AvailableUser {
  id: number;
  name: string;
  email: string;
  job_title?: string;
  department?: string;
  role?: string;
  status?: string;
}

interface AvailableRole {
  value: string;
  label: string;
  description: string;
  permissions_count: number;
}

interface BusinessUserInviteProps {
  business: Business;
  availableUsers: AvailableUser[];
  availableRoles: AvailableRole[];
}

interface FormData {
  user_id: string;
  business_role: BusinessRole;
  notes: string;
  permissions: string[];
}

interface FormErrors {
  user_id?: string;
  business_role?: string;
  notes?: string;
}

// Helper function to get icon and color for role
const getRoleIconAndColor = (roleName: string) => {
  switch (roleName) {
    case 'business-admin':
      return { icon: Shield, color: 'text-red-600' };
    case 'manager':
      return { icon: Settings, color: 'text-blue-600' };
    case 'employee':
      return { icon: User, color: 'text-green-600' };
    case 'viewer':
      return { icon: Eye, color: 'text-gray-600' };
    default:
      return { icon: User, color: 'text-gray-600' };
  }
};

export default function BusinessUserInvite({ business, availableUsers, availableRoles }: BusinessUserInviteProps) {
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    business_role: 'employee', // Default to employee role
    notes: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Users', href: `/businesses/${business.slug}/users` },
    { title: 'Invite User', href: `/businesses/${business.slug}/users/invite` }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    router.post(`/businesses/${business.slug}/users/invite`, formData, {
      onSuccess: () => {
        setSubmitSuccess(true);
        setFormData({
          user_id: '',
          business_role: 'employee',
          notes: '',
          permissions: [],
        });
        setTimeout(() => {
          router.get(`/businesses/${business.slug}/users`);
        }, 2000);
      },
      onError: (errors) => {
        setErrors(errors as FormErrors);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleCancel = () => {
    router.get(`/businesses/${business.slug}/users`);
  };

  const selectedRole = availableRoles.find(role => role.value === formData.business_role);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Invite User - ${business.name}`} />
      
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Invite User</h1>
              <p className="text-muted-foreground">
                Add a new team member to {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {submitSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              User invited successfully! They will receive an email notification.
              Redirecting to users list...
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* No Available Users Notice */}
              {availableUsers.length === 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>No users available to invite.</strong> All existing users are already members of this business.{' '}
                    <a 
                      href="/admin/users/create" 
                      className="underline hover:no-underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Create a new user
                    </a>
                    {' '}to invite them to this business.
                  </AlertDescription>
                </Alert>
              )}

              {/* New User Notice */}
              {availableUsers.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Don't see the user you want to invite?</strong> You can{' '}
                    <a 
                      href="/admin/users/create" 
                      className="underline hover:no-underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      create a new user
                    </a>
                    {' '}first, then return here to invite them to this business.
                  </AlertDescription>
                </Alert>
              )}

              {/* User Selection */}
              {availableUsers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="user_id">Select User *</Label>
                  <Select 
                    value={formData.user_id} 
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger className={errors.user_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a user to invite" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">({user.email})</span>
                            </div>
                            {(user.job_title || user.department) && (
                              <div className="text-xs text-muted-foreground">
                                {user.job_title}
                                {user.job_title && user.department && ' • '}
                                {user.department}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.user_id && (
                    <p className="text-sm text-red-600">{errors.user_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {availableUsers.length} user{availableUsers.length !== 1 ? 's' : ''} available to invite
                  </p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="business_role">Role *</Label>
                <Select 
                  value={formData.business_role} 
                  onValueChange={(value) => setFormData({ ...formData, business_role: value })}
                >
                  <SelectTrigger className={errors.business_role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => {
                      const { icon: Icon, color } = getRoleIconAndColor(role.value);
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span>{role.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({role.permissions_count} permissions)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.business_role && (
                  <p className="text-sm text-red-600">{errors.business_role}</p>
                )}
              </div>

              {/* Role Description */}
              {selectedRole && (
                <Alert>
                  {(() => {
                    const { icon: Icon, color } = getRoleIconAndColor(selectedRole.value);
                    return <Icon className={`h-4 w-4 ${color}`} />;
                  })()}
                  <AlertDescription>
                    <strong>{selectedRole.label}:</strong> {selectedRole.description}
                    <div className="text-sm text-muted-foreground mt-1">
                      This role has {selectedRole.permissions_count} permissions
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Permission Management */}
              <PermissionManager
                selectedRole={formData.business_role}
                selectedPermissions={formData.permissions}
                onPermissionsChange={(permissions) => setFormData({ ...formData, permissions })}
                showRoleDefaults={true}
                disabled={isSubmitting}
              />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this user's role or responsibilities..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={errors.notes ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600">{errors.notes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum 500 characters
                </p>
              </div>

              {/* Warning for Owner Role */}
              {formData.business_role === 'owner' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Warning:</strong> Business owners have full access including the ability to delete the business.
                    Only assign this role to trusted users.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || submitSuccess || availableUsers.length === 0}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Invitation...
                    </>
                  ) : availableUsers.length === 0 ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      No Users Available
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How Invitations Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Email Invitation</p>
                <p className="text-sm text-muted-foreground">
                  The user will receive an email invitation to join {business.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Account Verification</p>
                <p className="text-sm text-muted-foreground">
                  The user must already have an account in the system to accept the invitation
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Access Granted</p>
                <p className="text-sm text-muted-foreground">
                  Once accepted, they'll have access to the business with the assigned role
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
