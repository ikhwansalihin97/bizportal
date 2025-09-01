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
  Calendar,
  Receipt
} from 'lucide-react';

interface Claim {
  id: number;
  uuid: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  category: string;
  expense_type: string;
  description: string;
  expense_date: string;
  vendor?: string;
  invoice_number?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  submitted_at: string;
  approved_amount?: number;
  remaining_amount: number;
  is_fully_reimbursed: boolean;
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  claims: {
    data: Claim[];
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
    category?: string;
    expense_type?: string;
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

export default function ClaimsIndex({
  business,
  claims,
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
  const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState(filters.expense_type || 'all');
  const [monthFilter, setMonthFilter] = useState(filters.month || '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Claims', href: `/businesses/${business.slug}/claims` }
  ];

  const handleSearch = () => {
    router.get(
      route('businesses.claims.index', business.slug),
      {
        search: searchValue,
        status: statusFilter === 'all' ? '' : statusFilter,
        user_id: userFilter === 'all' ? '' : userFilter,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        expense_type: expenseTypeFilter === 'all' ? '' : expenseTypeFilter,
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
    } else if (filterType === 'category') {
      newFilters.category = value === 'all' ? '' : value;
      setCategoryFilter(value);
    } else if (filterType === 'expense_type') {
      newFilters.expense_type = value === 'all' ? '' : value;
      setExpenseTypeFilter(value);
    } else if (filterType === 'month') {
      newFilters.month = value;
      setMonthFilter(value);
    }

    router.get(
      route('businesses.claims.index', business.slug),
      newFilters,
      { preserveState: true }
    );
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    setUserFilter('all');
    setCategoryFilter('all');
    setExpenseTypeFilter('all');
    setMonthFilter('');
    
    router.get(
      route('businesses.claims.index', business.slug),
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

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      travel: { color: 'bg-blue-100 text-blue-800' },
      meals: { color: 'bg-green-100 text-green-800' },
      office_supplies: { color: 'bg-purple-100 text-purple-800' },
      transportation: { color: 'bg-orange-100 text-orange-800' },
      utilities: { color: 'bg-red-100 text-red-800' },
      general: { color: 'bg-gray-100 text-gray-800' },
      other: { color: 'bg-gray-100 text-gray-800' },
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
    const displayName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <Badge className={config.color}>
        {displayName}
      </Badge>
    );
  };

  const getExpenseTypeBadge = (type: string) => {
    const typeConfig = {
      reimbursement: { color: 'bg-green-100 text-green-800' },
      petty_cash: { color: 'bg-blue-100 text-blue-800' },
      direct_payment: { color: 'bg-purple-100 text-purple-800' },
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
      <Head title={`${business.name} - Claim Management`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Claim Management</h1>
                <p className="text-muted-foreground">
                  Manage employee expense claims for {business.name}
                </p>
              </div>
            </div>
            {canCreate && (
              <Link href={route('businesses.claims.create', business.slug)}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Claim
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
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
                Awaiting reimbursement
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Search description, vendor..."
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
                      <SelectItem value="me">My Claims</SelectItem>
                      {Object.entries(users)
                        .filter(([id, name]) => {
                          // Filter out the current user since "My Claims" already covers them
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
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Expense Type</label>
                <Select value={expenseTypeFilter} onValueChange={(value) => handleFilterChange('expense_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="reimbursement">Reimbursement</SelectItem>
                    <SelectItem value="petty_cash">Petty Cash</SelectItem>
                    <SelectItem value="direct_payment">Direct Payment</SelectItem>
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

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Claims ({claims.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow key="header-row">
                    <TableHead key="employee">Employee</TableHead>
                    <TableHead key="amount">Amount</TableHead>
                    <TableHead key="category">Category</TableHead>
                    <TableHead key="description">Description</TableHead>
                    <TableHead key="expense-date">Expense Date</TableHead>
                    <TableHead key="status">Status</TableHead>
                    <TableHead key="submitted">Submitted</TableHead>
                    <TableHead key="remaining">Remaining</TableHead>
                    <TableHead key="actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.data.length === 0 ? (
                    <TableRow key="no-data">
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No claims found
                      </TableCell>
                    </TableRow>
                  ) : (
                    claims.data.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {claim.user.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{claim.user.name}</div>
                              <div className="text-sm text-muted-foreground">{claim.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(claim.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getCategoryBadge(claim.category)}
                            {getExpenseTypeBadge(claim.expense_type)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={claim.description}>
                            {claim.description}
                          </div>
                          {claim.vendor && (
                            <div key={`vendor-${claim.id}`} className="text-xs text-muted-foreground">
                              Vendor: {claim.vendor}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(claim.expense_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(claim.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(claim.submitted_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(claim.submitted_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(claim.remaining_amount)}
                          </div>
                          {claim.is_fully_reimbursed && (
                            <Badge key={`reimbursed-${claim.id}`} variant="secondary" className="text-xs">
                              Fully Reimbursed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link key={`view-${claim.id}`} href={route('businesses.claims.show', [business.slug, claim.uuid])}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            {canEdit && claim.status === 'pending' && (
                              <Link key={`edit-${claim.id}`} href={route('businesses.claims.edit', [business.slug, claim.uuid])}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            
                            {canDelete && claim.status === 'pending' && (
                              <Button 
                                key={`delete-${claim.id}`}
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this claim?')) {
                                    router.delete(route('businesses.claims.destroy', [business.slug, claim.uuid]));
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
            {claims.last_page > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((claims.current_page - 1) * claims.per_page) + 1} to{' '}
                  {Math.min(claims.current_page * claims.per_page, claims.total)} of{' '}
                  {claims.total} results
                </div>
                
                <div className="flex gap-2">
                  {claims.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFilters = { ...filters, page: claims.current_page - 1 };
                        router.get(route('businesses.claims.index', business.slug), newFilters);
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {claims.current_page < claims.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFilters = { ...filters, page: claims.current_page + 1 };
                        router.get(route('businesses.claims.index', business.slug), newFilters);
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
