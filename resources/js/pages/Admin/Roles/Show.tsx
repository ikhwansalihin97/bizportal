import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Shield, Edit, Trash2, Users, Key, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Role, formatRoleName, formatPermissionName, getPermissionCategory } from '@/types';

interface Props {
  role: Role;
  canEdit: boolean;
  canDelete: boolean;
}

export default function Show({ role, canEdit, canDelete }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    router.delete(`/admin/roles/${role.id}`);
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

  const getPermissionCategory = (permissionName: string): string => {
    const parts = permissionName.split('.');
    return parts[0] || 'general';
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Group permissions by category
  const permissionGroups = (role.permissions || []).reduce((groups, permission) => {
    const category = getPermissionCategory(permission.name);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, typeof role.permissions>);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Role Management', href: '/admin/roles' },
    { title: formatRoleName(role.name), href: `/admin/roles/${role.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Role: ${formatRoleName(role.name)}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/roles">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span>{formatRoleName(role.name)}</span>
              </h1>
              <p className="text-muted-foreground">
                Role details and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Link href={`/admin/roles/${role.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                disabled={(role.users_count || 0) > 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>Basic role details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Role Name</Label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatRoleName(role.name)}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Internal Name</Label>
                <Badge variant="outline">{role.name}</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Guard</Label>
                <Badge variant="secondary">{role.guard_name}</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Created</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(role.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Role usage statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{role.permissions?.length || 0} permissions</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Users</Label>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{role.users_count || 0} users</span>
                </div>
              </div>
              {(role.users_count || 0) > 0 && (
                <div className="mt-4">
                  <Link href={`/admin/users?role=${role.name}`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      View Users
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions ({role.permissions?.length || 0})</CardTitle>
            <CardDescription>
              All permissions assigned to this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(permissionGroups).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-medium">
                        {formatCategoryName(category)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 pl-4">
                      {permissions.map((permission) => (
                        <div 
                          key={permission.id} 
                          className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50"
                        >
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {formatPermissionName(permission.name)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {permission.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No permissions assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This role doesn't have any permissions assigned yet.
                </p>
                {canEdit && (
                  <div className="mt-6">
                    <Link href={`/admin/roles/${role.id}/edit`}>
                      <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
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
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{formatRoleName(role.name)}"? This action cannot be undone.
              {(role.users_count || 0) > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  Warning: This role is assigned to {role.users_count} user(s). 
                  You cannot delete a role that is currently assigned to users.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={(role.users_count || 0) > 0}
            >
              Delete Role
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
