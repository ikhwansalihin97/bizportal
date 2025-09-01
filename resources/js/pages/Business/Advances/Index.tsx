import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';

interface Advance {
  id: number;
  uuid: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  type: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  requested_at: string;
  due_date?: string;
  remaining_amount: number;
  is_fully_repaid: boolean;
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  advances: {
    data: Advance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  users: Record<string, string>;
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    total_amount: number;
    pending_amount: number;
    total_remaining: number;
  };
  filters: {
    status?: string;
    user_id?: string;
    type?: string;
    search?: string;
    month?: string;
  };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  userRole: string;
  currentUserId: number;
}

export default function AdvancesIndex({
  business,
  advances,
  users,
  summary,
  filters,
  canCreate,
  canEdit,
  canDelete,
  canManage,
  userRole,
  currentUserId,
}: Props) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [userFilter, setUserFilter] = useState(filters.user_id || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [monthFilter, setMonthFilter] = useState(filters.month || '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Advances', href: `/businesses/${business.slug}/advances` }
  ];

  const handleSearch = () => {
    router.get(
      route('businesses.advances.index', business.slug),
      {
        search: searchValue,
        status: statusFilter === 'all' ? '' : statusFilter,
        user_id: userFilter === 'all' ? '' : userFilter,
        type: typeFilter === 'all' ? '' : typeFilter,
        month: monthFilter,
      },
      { preserveState: true }
    );
  };

  const handleFilterChange = (filterType: string, value: string) => {
    let newFilters = { ...filters };
    
    if (filterType === 'status') {
      newFilters.status = value === 'all' ? '' : value;
      setStatusFilter(value);
    } else if (filterType === 'user_id') {
      newFilters.user_id = value === 'all' ? '' : value;
      setUserFilter(value);
    } else if (filterType === 'type') {
      newFilters.type = value === 'all' ? '' : value;
      setTypeFilter(value);
    } else if (filterType === 'month') {
      newFilters.month = value;
      setMonthFilter(value);
    }

    router.get(
      route('businesses.advances.index', business.slug),
      newFilters,
      { preserveState: true }
    );
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    setUserFilter('all');
    setTypeFilter('all');
    setMonthFilter('');
    
    router.get(
      route('businesses.advances.index', business.slug),
      {},
      { preserveState: true }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      cash: { color: 'bg-green-100 text-green-800' },
      bank_transfer: { color: 'bg-blue-100 text-blue-800' },
      check: { color: 'bg-purple-100 text-purple-800' },
      other: { color: 'bg-gray-100 text-gray-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    const displayName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <Badge className={config.color}>
        {displayName}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${business.name} - Advance Management`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Advance Management</h1>
                <p className="text-muted-foreground">
                  Manage employee advances for {business.name}
                </p>
              </div>
            </div>
            {canCreate && (
              <Link href={route('businesses.advances.create', business.slug)}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Advance
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.total_amount)} total amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pending}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.pending_amount)} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.approved}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_remaining)}</div>
              <p className="text-xs text-muted-foreground">
                Total remaining amount
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Search purpose, description..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canManage && (
                <div>
                  <label className="text-sm font-medium">Employee</label>
                  <Select value={userFilter} onValueChange={(value) => handleFilterChange('user_id', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      <SelectItem value="me">My Advances</SelectItem>
                      {Object.entries(users)
                        .filter(([id, name]) => {
                          // Filter out the current user since "My Advances" already covers them
                          return parseInt(id) !== currentUserId;
                        })
                        .map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Month</label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advances Table */}
        <Card>
          <CardHeader>
            <CardTitle>Advances ({advances.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow key="header-row">
                    <TableHead key="employee">Employee</TableHead>
                    <TableHead key="amount">Amount</TableHead>
                    <TableHead key="type">Type</TableHead>
                    <TableHead key="purpose">Purpose</TableHead>
                    <TableHead key="status">Status</TableHead>
                    <TableHead key="requested">Requested</TableHead>
                    <TableHead key="due-date">Due Date</TableHead>
                    <TableHead key="advance-date">Advance Date</TableHead>
                    <TableHead key="remaining">Remaining</TableHead>
                    <TableHead key="actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.data.length === 0 ? (
                    <TableRow key="no-data">
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No advances found
                      </TableCell>
                    </TableRow>
                  ) : (
                    advances.data.map((advance) => (
                      <TableRow key={advance.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {advance.user.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{advance.user.name}</div>
                              <div className="text-sm text-muted-foreground">{advance.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(advance.amount)}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(advance.type)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={advance.purpose}>
                            {advance.purpose}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(advance.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(advance.requested_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(advance.requested_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {advance.due_date ? (
                            <div key={`due-date-${advance.id}`} className="text-sm">
                              {formatDate(advance.due_date)}
                            </div>
                          ) : (
                            <span key={`no-due-date-${advance.id}`} className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {advance.advance_date ? (
                            <div key={`advance-date-${advance.id}`} className="text-sm">
                              {formatDate(advance.advance_date)}
                            </div>
                          ) : (
                            <span key={`no-advance-date-${advance.id}`} className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(advance.remaining_amount)}
                          </div>
                          {advance.is_fully_repaid && (
                            <Badge key={`repaid-${advance.id}`} variant="secondary" className="text-xs">
                              Fully Repaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link key={`view-${advance.id}`} href={route('businesses.advances.show', [business.slug, advance.uuid])}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            {canEdit && advance.status === 'pending' && (
                              <Link key={`edit-${advance.id}`} href={route('businesses.advances.edit', [business.slug, advance.uuid])}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            
                            {canDelete && advance.status === 'pending' && (
                              <Button 
                                key={`delete-${advance.id}`}
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this advance?')) {
                                    router.delete(route('businesses.advances.destroy', [business.slug, advance.uuid]));
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {advances.last_page > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((advances.current_page - 1) * advances.per_page) + 1} to{' '}
                  {Math.min(advances.current_page * advances.per_page, advances.total)} of{' '}
                  {advances.total} results
                </div>
                
                <div className="flex gap-2">
                  {advances.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFilters = { ...filters, page: advances.current_page - 1 };
                        router.get(route('businesses.advances.index', business.slug), newFilters);
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {advances.current_page < advances.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFilters = { ...filters, page: advances.current_page + 1 };
                        router.get(route('businesses.advances.index', business.slug), newFilters);
                      }}
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
    </AppLayout>
  );
}
