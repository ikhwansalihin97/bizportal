import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Key, Save } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/error-boundary';
import type { Permission, Role, PermissionFormData } from '@/types';

interface Props {
  permission: Permission;
  roles: Role[];
}

export default function Edit({ permission, roles }: Props) {
  const [formData, setFormData] = useState<PermissionFormData>({
    name: permission.name,
    guard_name: permission.guard_name,
    roles: permission.roles?.map(r => r.id) || [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof PermissionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...(prev.roles || []), roleId]
        : (prev.roles || []).filter(id => id !== roleId),
    }));
  };

  const handleSelectAllRoles = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked ? roles.map(role => role.id) : [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    router.put(`/admin/permissions/${permission.id}`, formData, {
      onError: (errors) => {
        setErrors(errors);
        setIsSubmitting(false);
      },
      onSuccess: () => {
        setIsSubmitting(false);
      },
    });
  };

  const formatRoleName = (name: string): string => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPermissionName = (permissionName: string): string => {
    return permissionName
      .split('.')
      .map(part => part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '))
      .join(' - ');
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Permission Management', href: '/admin/permissions' },
    { title: permission.name, href: `/admin/permissions/${permission.id}` },
    { title: 'Edit', href: `/admin/permissions/${permission.id}/edit` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Permission: ${permission.name}`} />

      <ErrorBoundary>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href={`/admin/permissions/${permission.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Permission
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Edit Permission</h1>
              <p className="text-muted-foreground">
                Update permission "{permission.name}" and its role assignments
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Permission Information</span>
                </CardTitle>
                <CardDescription>
                  Basic permission details and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Permission Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., users.create or posts.delete"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use dot notation (e.g., category.action like users.create)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guard_name">Guard Name</Label>
                    <Input
                      id="guard_name"
                      value={formData.guard_name}
                      onChange={(e) => handleInputChange('guard_name', e.target.value)}
                      placeholder="web"
                      className={errors.guard_name ? 'border-destructive' : ''}
                    />
                    {errors.guard_name && (
                      <p className="text-sm text-destructive">{errors.guard_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Usually 'web' for web applications
                    </p>
                  </div>
                </div>

                {/* Current Permission Display */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium">Formatted Name:</Label>
                  <div className="mt-1 text-sm">{formatPermissionName(formData.name)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Roles Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Assign to Roles</CardTitle>
                <CardDescription>
                  Select which roles should have this permission ({formData.roles?.length || 0} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      checked={formData.roles?.length === roles.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = (formData.roles?.length || 0) > 0 && formData.roles?.length !== roles.length;
                        }
                      }}
                      onCheckedChange={(checked) => handleSelectAllRoles(checked as boolean)}
                    />
                    <div>
                      <div className="font-medium">Select All Roles</div>
                      <div className="text-sm text-muted-foreground">
                        Assign this permission to all {roles.length} roles
                      </div>
                    </div>
                  </div>

                  {/* Individual Roles */}
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          checked={formData.roles?.includes(role.id)}
                          onCheckedChange={(checked) =>
                            handleRoleChange(role.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{formatRoleName(role.name)}</div>
                          <div className="text-sm text-muted-foreground">
                            {role.permissions_count || 0} permissions
                          </div>
                          {role.users_count !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              {role.users_count} users
                            </div>
                          )}
                        </div>
                        {permission.roles?.some(r => r.id === role.id) && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {errors.roles && (
                  <p className="text-sm text-destructive mt-2">{errors.roles}</p>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4">
              <Link href={`/admin/permissions/${permission.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Permission'}
              </Button>
            </div>
          </form>
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
