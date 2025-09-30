import React, { useState, useCallback, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Shield, Users, Key, Trash2, Edit, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';
import type { RolePaginatedResponse, RoleFilters, RoleStats, Role, formatRoleName } from '@/types';

interface Props {
  roles: RolePaginatedResponse;
  filters: RoleFilters;
  stats: RoleStats;
}

export default function Index({ roles, filters, stats }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    const params: Record<string, any> = {};
    
    if (query) params.search = query;

    router.get('/admin/roles', params, {
      preserveState: true,
      preserveScroll: true,
      only: ['roles', 'filters', 'stats'],
    });
  }, []);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery !== filters.search) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.search, handleSearch, isInitialized]);

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      router.delete(`/admin/roles/${roleToDelete.id}`, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setRoleToDelete(null);
        },
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (filters.search) {
      router.get('/admin/roles', {}, {
        preserveState: true,
        preserveScroll: true,
        only: ['roles', 'filters', 'stats'],
      });
    }
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
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Role Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Manage system roles and their permissions
            </p>
          </div>
          <Link href="/admin/roles/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.with_permissions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Roles</CardTitle>
            <CardDescription>Find roles by name or guard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {filters.search && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: {filters.search}</span>
                  <button onClick={clearSearch} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Roles ({roles.total})</CardTitle>
            <CardDescription>
              Showing {roles.from} to {roles.to} of {roles.total} roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{formatRoleName(role.name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.guard_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.permissions_count || 0} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{role.users_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/roles/${role.id}`} className="flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/roles/${role.id}/edit`} className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(role)}
                            className="text-destructive focus:text-destructive"
                            disabled={(role.users_count || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {roles.data.length === 0 && (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No roles found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filters.search ? 'Try adjusting your search criteria.' : 'Get started by creating a new role.'}
                </p>
                {!filters.search && (
                  <div className="mt-6">
                    <Link href="/admin/roles/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Role
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {roles.last_page > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {roles.from} to {roles.to} of {roles.total} results
                </div>
                <div className="flex items-center space-x-2">
                  {roles.links.prev && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(roles.links.prev!, filters, { preserveState: true })}
                    >
                      Previous
                    </Button>
                  )}
                  <span className="text-sm">
                    Page {roles.current_page} of {roles.last_page}
                  </span>
                  {roles.links.next && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(roles.links.next!, filters, { preserveState: true })}
                    >
                      Next
                    </Button>
                  )}
                </div>
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
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
              {(roleToDelete?.users_count || 0) > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  Warning: This role is assigned to {roleToDelete?.users_count} user(s). 
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
              onClick={confirmDelete}
              disabled={(roleToDelete?.users_count || 0) > 0}
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
