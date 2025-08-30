import React, { useState, useCallback, useEffect } from 'react';
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
  X,
  Mail,
  Phone,
  Calendar,
  Building2,
  Crown,
  Shield,
  User,
  Eye,
  Settings,
  UserX,
  UserCheck,
  MailCheck,
  MailX,
} from 'lucide-react';
import type { User as UserType, PaginatedResponse } from '@/types';

interface UserWithProfile extends UserType {
  businesses_count?: number;
  created_businesses_count?: number;
}

interface AdminUsersIndexProps {
  users: PaginatedResponse<UserWithProfile>;
  filters: {
    role?: string;
    status?: string;
    verified?: string;
    search?: string;
  };
  stats: {
    total: number;
    active: number;
    verified: number;
    superadmins: number;
  };
}

const roleIcons = {
  superadmin: Crown,
  'business-admin': Shield,
  manager: Settings,
  employee: User,
  viewer: Eye,
};

const roleColors = {
  superadmin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'business-admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  employee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Helper function to get user's primary role (prioritizing Spatie roles over profile role)
const getUserPrimaryRole = (user: any): string => {
  // If user has Spatie roles, use the first one (they should only have one role anyway)
  if (user.roles && user.roles.length > 0) {
    return user.roles[0].name;
  }
  
  // Fallback to profile role if no Spatie roles
  return user.profile?.role || 'employee';
};

// Helper function to get role icon
const getRoleIcon = (role: string) => {
  const Icon = roleIcons[role as keyof typeof roleIcons] || User;
  return <Icon className="h-4 w-4" />;
};

export default function AdminUsersIndex({ users, filters, stats }: AdminUsersIndexProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [verifiedFilter, setVerifiedFilter] = useState(filters.verified || 'all');
  
  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Users', href: '/admin/users' }
  ];

  // Debounced search handler
  const handleSearch = useCallback((query: string) => {
    setSearchValue(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
      
      const queryString = params.toString();
      const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
      
      router.get(url, {}, { 
        preserveState: true, 
        preserveScroll: true, 
        only: ['users', 'filters', 'stats'],
        preserveUrl: false
      });
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout, roleFilter, statusFilter, verifiedFilter]);

  const handleFormSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);

    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
      
    router.get(url, {}, { 
      preserveState: true,
      preserveScroll: true,
      only: ['users', 'filters', 'stats']
    });
  };

  const clearFilters = () => {
    setSearchValue('');
    setRoleFilter('all');
    setStatusFilter('all');
    setVerifiedFilter('all');
    router.get('/admin/users', {}, { 
      preserveState: true,
      preserveScroll: true,
      only: ['users', 'filters', 'stats']
    });
  };

  const handleToggleStatus = (userId: number) => {
    router.patch(`/admin/users/${userId}/toggle-status`, {}, {
      preserveState: true,
      onSuccess: () => {
        // Success message will be shown via flash message
      }
    });
  };

  const handleSendVerification = (userId: number) => {
    router.post(`/admin/users/${userId}/send-verification`, {}, {
      preserveState: true,
      onSuccess: () => {
        // Success message will be shown via flash message
      }
    });
  };

  const handleVerifyEmail = (userId: number) => {
    router.post(`/admin/users/${userId}/verify-email`, {}, {
      preserveState: true,
      onSuccess: () => {
        // Success message will be shown via flash message
      }
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      router.delete(`/admin/users/${userId}`, {
        preserveState: true,
        onSuccess: () => {
          // Success message will be shown via flash message
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

  const activeFiltersCount = [searchValue, roleFilter !== 'all' ? roleFilter : null, statusFilter !== 'all' ? statusFilter : null, verifiedFilter !== 'all' ? verifiedFilter : null].filter(Boolean).length;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                  Manage system users and their permissions
                </p>
              </div>
            </div>
            
            <Button asChild>
              <Link href="/admin/users/create">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Users</span>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <p className="text-2xl font-bold">{stats.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MailCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Verified</span>
                </div>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Admins</span>
                </div>
                <p className="text-2xl font-bold">{stats.superadmins}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleFormSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or job title..."
                      value={searchValue}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={(value) => {
                    setRoleFilter(value);
                    const params = new URLSearchParams();
                    if (searchValue.trim()) params.set('search', searchValue.trim());
                    if (value !== 'all') params.set('role', value);
                    if (statusFilter !== 'all') params.set('status', statusFilter);
                    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
                    const queryString = params.toString();
                    const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                    router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                      <SelectItem value="business_admin">Business Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    const params = new URLSearchParams();
                    if (searchValue.trim()) params.set('search', searchValue.trim());
                    if (roleFilter !== 'all') params.set('role', roleFilter);
                    if (value !== 'all') params.set('status', value);
                    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
                    const queryString = params.toString();
                    const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                    router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={verifiedFilter} onValueChange={(value) => {
                    setVerifiedFilter(value);
                    const params = new URLSearchParams();
                    if (searchValue.trim()) params.set('search', searchValue.trim());
                    if (roleFilter !== 'all') params.set('role', roleFilter);
                    if (statusFilter !== 'all') params.set('status', statusFilter);
                    if (value !== 'all') params.set('verified', value);
                    const queryString = params.toString();
                    const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                    router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Verified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type="submit" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>

                  {(searchValue || roleFilter !== 'all' || statusFilter !== 'all' || verifiedFilter !== 'all') && (
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </form>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {searchValue && (
                      <Badge variant="secondary" className="gap-1">
                        Search: {searchValue}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            setSearchValue('');
                            handleSearch('');
                          }}
                        />
                      </Badge>
                    )}
                    {roleFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        Role: {roleFilter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            setRoleFilter('all');
                            const params = new URLSearchParams();
                            if (searchValue.trim()) params.set('search', searchValue.trim());
                            if (statusFilter !== 'all') params.set('status', statusFilter);
                            if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
                            const queryString = params.toString();
                            const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                            router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                          }}
                        />
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {statusFilter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            setStatusFilter('all');
                            const params = new URLSearchParams();
                            if (searchValue.trim()) params.set('search', searchValue.trim());
                            if (roleFilter !== 'all') params.set('role', roleFilter);
                            if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
                            const queryString = params.toString();
                            const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                            router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                          }}
                        />
                      </Badge>
                    )}
                    {verifiedFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        Verified: {verifiedFilter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            setVerifiedFilter('all');
                            const params = new URLSearchParams();
                            if (searchValue.trim()) params.set('search', searchValue.trim());
                            if (roleFilter !== 'all') params.set('role', roleFilter);
                            if (statusFilter !== 'all') params.set('status', statusFilter);
                            const queryString = params.toString();
                            const url = queryString ? `/admin/users?${queryString}` : `/admin/users`;
                            router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters', 'stats'] });
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
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
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No users found</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/users/create">
                          Create User
                        </Link>
                      </Button>
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
                        {getRoleIcon(getUserPrimaryRole(user))}
                        <Badge className={roleColors[getUserPrimaryRole(user) as keyof typeof roleColors]}>
                          {getUserPrimaryRole(user)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[(user.profile?.status || 'active') as keyof typeof statusColors]}>
                        {user.profile?.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.email_verified_at ? (
                          <>
                            <MailCheck className="h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <MailX className="h-3 w-3 text-red-600" />
                            <span className="text-sm text-red-600">Unverified</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(user.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{user.businesses_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.uuid}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.uuid}/edit`}>
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.uuid)}>
                            {user.profile?.status === 'active' ? 'Deactivate' : 'Activate'} User
                          </DropdownMenuItem>
                          {!user.email_verified_at && (
                            <>
                              <DropdownMenuItem onClick={() => handleSendVerification(user.uuid)}>
                                Send Verification
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleVerifyEmail(user.uuid)}>
                                Mark as Verified
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.uuid)}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
    </AppLayout>
  );
}
