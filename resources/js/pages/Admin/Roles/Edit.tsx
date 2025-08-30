import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import type { Role, Permission, RoleFormData } from '@/types';
import { getPermissionCategory, getPermissionAction, formatPermissionName } from '@/types';

interface Props {
  role: Role;
  permissions: Permission[];
}

export default function Edit({ role, permissions }: Props) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: role.name,
    guard_name: role.guard_name,
    permissions: role.permissions?.map(p => p.id) || [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group permissions by category
  const permissionGroups = permissions.reduce((groups, permission) => {
    const category = getPermissionCategory(permission.name);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.keys(permissionGroups).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {})
  );

  const handleInputChange = (field: keyof RoleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter(id => id !== permissionId),
    }));
  };

  const handleSelectAllInGroup = (groupPermissions: Permission[], checked: boolean) => {
    const groupIds = groupPermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...(prev.permissions || []), ...groupIds])]
        : (prev.permissions || []).filter(id => !groupIds.includes(id)),
    }));
  };

  const isGroupFullySelected = (groupPermissions: Permission[]): boolean => {
    const groupIds = groupPermissions.map(p => p.id);
    return groupIds.every(id => formData.permissions?.includes(id));
  };

  const isGroupPartiallySelected = (groupPermissions: Permission[]): boolean => {
    const groupIds = groupPermissions.map(p => p.id);
    return groupIds.some(id => formData.permissions?.includes(id)) && !isGroupFullySelected(groupPermissions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    router.put(`/admin/roles/${role.id}`, formData, {
      onError: (errors) => {
        setErrors(errors);
        setIsSubmitting(false);
      },
      onSuccess: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Using imported functions from @/types

  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatRoleName = (name: string): string => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Role Management', href: '/admin/roles' },
    { title: formatRoleName(role.name), href: `/admin/roles/${role.id}` },
    { title: 'Edit', href: `/admin/roles/${role.id}/edit` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Role: ${formatRoleName(role.name)}`} />

      <ErrorBoundary>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href={`/admin/roles/${role.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Role
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Edit Role</h1>
              <p className="text-muted-foreground">
                Update role "{formatRoleName(role.name)}" and its permissions
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Role Information</span>
                </CardTitle>
                <CardDescription>
                  Basic role details and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., content-manager"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use lowercase with hyphens (e.g., content-manager)
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
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Select the permissions this role should have ({formData.permissions?.length || 0} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(permissionGroups).map(([category, groupPermissions]) => (
                    <Collapsible
                      key={category}
                      open={openGroups[category]}
                      onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, [category]: open }))}
                    >
                      <div className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isGroupFullySelected(groupPermissions)}
                            ref={(el) => {
                              if (el) el.indeterminate = isGroupPartiallySelected(groupPermissions);
                            }}
                            onCheckedChange={(checked) => 
                              handleSelectAllInGroup(groupPermissions, checked as boolean)
                            }
                          />
                          <div className="text-left">
                            <div className="font-medium">{formatCategoryName(category)}</div>
                            <div className="text-sm text-muted-foreground">
                              {groupPermissions.length} permissions
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {groupPermissions.filter(p => formData.permissions?.includes(p.id)).length} / {groupPermissions.length}
                          </span>
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center space-x-1 p-1 rounded hover:bg-muted/50">
                              {openGroups[category] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent className="mt-2">
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 pl-6">
                          {groupPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30">
                              <Checkbox
                                checked={formData.permissions?.includes(permission.id)}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(permission.id, checked as boolean)
                                }
                              />
                              <div className="text-sm">
                                <div className="font-medium">{formatPermissionName(permission.name)}</div>
                                <div className="text-muted-foreground text-xs">{permission.name}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
                
                {errors.permissions && (
                  <p className="text-sm text-destructive mt-2">{errors.permissions}</p>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4">
              <Link href={`/admin/roles/${role.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
          </form>
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
