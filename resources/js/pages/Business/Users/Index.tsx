import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Building2,
  Crown,
  Shield,
  User,
  Eye,
  Settings,
  UserMinus,
  UserPlus,
  RotateCcw,
} from 'lucide-react';
import type { Business, User as UserType, PaginatedResponse } from '@/types';
import { usePage } from '@inertiajs/react';

interface BusinessUser extends UserType {
  pivot: {
    business_role: string;
    employment_status: string;
    joined_date: string;
    left_date?: string;
    invited_by?: number;
  };
}

interface BusinessUsersIndexProps {
  business: Business;
  users: PaginatedResponse<BusinessUser>;
  filters: {
    role?: string;
    status?: string;
    search?: string;
  };
  canManageUsers: boolean;
  canCreateUsers: boolean;
}

const roleIcons = {
  owner: Crown,
  employee: User,
};

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  employee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function BusinessUsersIndex({ 
  business, 
  users, 
  filters, 
  canManageUsers,
  canCreateUsers
}: BusinessUsersIndexProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<BusinessUser | null>(null);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Users', href: `/businesses/${business.slug}/users` }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const queryString = params.toString();
    const url = queryString ? 
      `/businesses/${business.slug}/users?${queryString}` : 
      `/businesses/${business.slug}/users`;
      
    router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  const clearFilters = () => {
    setSearchValue('');
    setRoleFilter('all');
    setStatusFilter('all');
    router.get(`/businesses/${business.slug}/users`, {}, { preserveState: true });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    router.put(`/businesses/${business.slug}/users/${userId}`, {
      business_role: newRole
    }, {
      preserveState: true,
      onSuccess: () => {
        // Success message will be shown via flash message
      }
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    router.put(`/businesses/${business.slug}/users/${userId}`, {
      employment_status: newStatus
    }, {
      preserveState: true,
      onSuccess: () => {
        // Success message will be shown via flash message
      }
    });
  };

  const handleRemoveUser = (user: BusinessUser) => {
    setUserToRemove(user);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveUser = () => {
    if (userToRemove) {
      router.delete(`/businesses/${business.slug}/users/${userToRemove.uuid}`, {
        preserveState: true,
        onSuccess: () => {
          setRemoveDialogOpen(false);
          setUserToRemove(null);
          // Success message will be shown via flash message
        },
        onError: () => {
          // Keep dialog open on error so user can retry
        }
      });
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${business.name} - Users`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
                <p className="text-muted-foreground">
                  Manage users and roles for {business.name}
                </p>
              </div>
            </div>
            
            {canManageUsers && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href={`/businesses/${business.slug}/users/invite`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Invite User
                    </Link>
                  </Button>
                  
                  {canCreateUsers && (
                    <Button asChild className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Link href={`/admin/users/create`}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Users</span>
                </div>
                <p className="text-2xl font-bold">{users.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Owners</span>
                </div>
                <p className="text-2xl font-bold">
                  {users.data.filter(user => user.pivot.business_role === 'owner').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <p className="text-2xl font-bold">
                  {users.data.filter(user => user.pivot.employment_status === 'active').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or job title..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type="submit" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>

                  {(searchValue || roleFilter !== 'all' || statusFilter !== 'all') && (
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Contact</TableHead>
                {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No users found</p>
                      {canManageUsers && (
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/businesses/${business.slug}/users/invite`}>
                              Invite Users
                            </Link>
                          </Button>
                          {canCreateUsers && (
                            <Button asChild variant="outline" size="sm">
                              <Link href="/admin/users/create">
                                Create User
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.profile?.avatar_url} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.profile?.job_title && (
                            <p className="text-xs text-muted-foreground">{user.profile.job_title}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.pivot.business_role)}
                        <Badge className={roleColors[user.pivot.business_role as keyof typeof roleColors]}>
                          {user.pivot.business_role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.pivot.employment_status as keyof typeof statusColors]}>
                        {user.pivot.employment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(user.pivot.joined_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{user.email}</span>
                          </div>
                        )}
                        {user.profile?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{user.profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/businesses/${business.slug}/users/${user.uuid}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* Role Management - Only show for active/inactive users */}
                            {user.pivot.employment_status !== 'terminated' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRoleChange(user.uuid, 'owner')}>
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Owner
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.uuid, 'employee')}>
                                  <User className="h-4 w-4 mr-2" />
                                  Make Employee
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Status Management */}
                            <DropdownMenuSeparator />
                            {user.pivot.employment_status === 'terminated' ? (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(user.uuid, 'active')}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reactivate User
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {user.pivot.employment_status !== 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(user.uuid, 'active')}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Mark Active
                                  </DropdownMenuItem>
                                )}
                                {user.pivot.employment_status !== 'inactive' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(user.uuid, 'inactive')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Mark Inactive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveUser(user)}
                                  className="text-red-600"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {users.total > users.per_page && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {users.from} to {users.to} of {users.total} users
            </p>
            
            <div className="flex gap-2">
              {users.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  onClick={() => link.url && router.get(link.url)}
                  disabled={!link.url}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User from Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-semibold">{userToRemove?.name}</span> from{' '}
              <span className="font-semibold">{business.name}</span>?
              <br />
              <br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove their access to this business</li>
                <li>Set their employment status to terminated</li>
                <li>Keep their user account intact for other businesses</li>
              </ul>
              <br />
              This action can be undone by re-inviting the user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveUser}>
              <UserMinus className="h-4 w-4 mr-2" />
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
