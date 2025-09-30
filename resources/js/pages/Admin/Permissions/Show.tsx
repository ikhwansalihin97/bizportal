import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Key, Edit, Trash2, Shield, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Permission } from '@/types';

interface Props {
  permission: Permission;
  canEdit: boolean;
  canDelete: boolean;
}

export default function Show({ permission, canEdit, canDelete }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    router.delete(`/admin/permissions/${permission.id}`);
  };

  const formatPermissionName = (permissionName: string): string => {
    return permissionName
      .split('.')
      .map(part => part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '))
      .join(' - ');
  };

  const getPermissionCategory = (permissionName: string): string => {
    const parts = permissionName.split('.');
    return parts[0] || 'general';
  };

  const getPermissionAction = (permissionName: string): string => {
    const parts = permissionName.split('.');
    return parts[1] || 'unknown';
  };

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
    { title: 'Permission Management', href: '/admin/permissions' },
    { title: permission.name, href: `/admin/permissions/${permission.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Permission: ${permission.name}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/permissions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Permissions
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center space-x-2">
                <Key className="h-6 w-6" />
                <span>{permission.name}</span>
              </h1>
              <p className="text-muted-foreground">
                Permission details and role assignments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Link href={`/admin/permissions/${permission.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Permission
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Permission Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Permission Information</CardTitle>
              <CardDescription>Basic permission details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Permission Name</Label>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatPermissionName(permission.name)}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Internal Name</Label>
                <Badge variant="outline">{permission.name}</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Badge variant="secondary">
                  {formatCategoryName(getPermissionCategory(permission.name))}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label>Action</Label>
                <Badge variant="outline">
                  {getPermissionAction(permission.name)}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label>Guard</Label>
                <Badge variant="secondary">{permission.guard_name}</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Created</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(permission.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Permission usage statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Assigned Roles</Label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{permission.roles?.length || 0} roles</span>
                </div>
              </div>
              {(permission.roles?.length || 0) > 0 && (
                <div className="mt-4">
                  <Link href={`/admin/roles?permission=${permission.name}`}>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      View Roles
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Roles ({permission.roles?.length || 0})</CardTitle>
            <CardDescription>
              All roles that have this permission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(permission.roles?.length || 0) > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {permission.roles?.map((role) => (
                  <Link 
                    key={role.id}
                    href={`/admin/roles/${role.id}`}
                    className="block"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
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
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No roles assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This permission is not assigned to any roles yet.
                </p>
                {canEdit && (
                  <div className="mt-6">
                    <Link href={`/admin/permissions/${permission.id}/edit`}>
                      <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Permission
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the permission "{permission.name}"? This action cannot be undone and will remove this permission from all roles that currently have it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-medium leading-none" {...props}>
      {children}
    </label>
  );
}
