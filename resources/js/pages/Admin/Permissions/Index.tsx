import React, { useState, useCallback, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Key, Shield, Trash2, Edit, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { PermissionPaginatedResponse, PermissionFilters, PermissionStats, Permission } from '@/types';
import { getPermissionCategory } from '@/types';

interface Props {
  permissions: PermissionPaginatedResponse;
  categories: string[];
  filters: PermissionFilters;
  stats: PermissionStats;
}

export default function Index({ permissions, categories, filters, stats }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  // Simple search function
  const handleSearch = useCallback((query: string, category?: string) => {
    const params: Record<string, any> = {};
    
    if (query) params.search = query;
    if (category) params.category = category;

    router.get('/admin/permissions', params, {
      preserveState: true,
      preserveScroll: true,
      only: ['permissions', 'filters', 'stats'],
    });
  }, []);

  // Debounced search with timeout management
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((query: string, category?: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSearch(query, category);
    }, 300);
    
    setSearchTimeout(timeout);
  }, [handleSearch, searchTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleCategoryChange = (category: string) => {
    const newCategory = category === 'all' ? '' : category;
    setCategoryFilter(newCategory);
    handleSearch(searchQuery, newCategory);
  };

  const handleDelete = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (permissionToDelete) {
      router.delete(`/admin/permissions/${permissionToDelete.id}`, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPermissionToDelete(null);
        },
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    router.get('/admin/permissions', {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['permissions', 'filters', 'stats'],
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (filters.search) {
      const params: Record<string, any> = {};
      if (categoryFilter) params.category = categoryFilter;
      
      router.get('/admin/permissions', params, {
        preserveState: true,
        preserveScroll: true,
        only: ['permissions', 'filters', 'stats'],
      });
    }
  };

  const clearCategory = () => {
    setCategoryFilter('');
    if (filters.category) {
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;
      
      router.get('/admin/permissions', params, {
        preserveState: true,
        preserveScroll: true,
        only: ['permissions', 'filters', 'stats'],
      });
    }
  };

  const formatPermissionName = (permissionName: string): string => {
    return permissionName
      .split('.')
      .map(part => part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '))
      .join(' - ');
  };

  // getPermissionCategory is imported from @/types

  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Permission Management', href: '/admin/permissions' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permission Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Permission Management</h1>
            <p className="text-muted-foreground">
              Manage system permissions and their assignments
            </p>
          </div>
          <Link href="/admin/permissions/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Permission
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned to Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assigned}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Permissions</CardTitle>
            <CardDescription>Find permissions by name, category, or guard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchQuery(newValue);
                    debouncedSearch(newValue, categoryFilter);
                  }}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || categoryFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {(filters.search || filters.category) && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Search: {filters.search}</span>
                    <button onClick={clearSearch} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Category: {formatCategoryName(filters.category)}</span>
                    <button onClick={clearCategory} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions ({permissions.total})</CardTitle>
            <CardDescription>
              Showing {permissions.from} to {permissions.to} of {permissions.total} permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.data.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{formatPermissionName(permission.name)}</div>
                          <div className="text-xs text-muted-foreground">{permission.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCategoryName(getPermissionCategory(permission.name))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{permission.guard_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{permission.roles?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(permission.created_at).toLocaleDateString()}
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
                            <Link href={`/admin/permissions/${permission.id}`} className="flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/permissions/${permission.id}/edit`} className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permission
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(permission)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {permissions.data.length === 0 && (
              <div className="text-center py-8">
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No permissions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filters.search || filters.category ? 'Try adjusting your search criteria.' : 'Get started by creating a new permission.'}
                </p>
                {!filters.search && !filters.category && (
                  <div className="mt-6">
                    <Link href="/admin/permissions/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Permission
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {permissions.last_page > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {permissions.from} to {permissions.to} of {permissions.total} results
                </div>
                <div className="flex items-center space-x-2">
                  {permissions.links.prev && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(permissions.links.prev!, filters, { preserveState: true })}
                    >
                      Previous
                    </Button>
                  )}
                  <span className="text-sm">
                    Page {permissions.current_page} of {permissions.last_page}
                  </span>
                  {permissions.links.next && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(permissions.links.next!, filters, { preserveState: true })}
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
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the permission "{permissionToDelete?.name}"? This action cannot be undone and will remove this permission from all roles that currently have it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
