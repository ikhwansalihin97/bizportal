import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, FileText, CheckCircle, XCircle, Clock, CreditCard, Receipt } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Claim {
  id: number;
  uuid: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  submittedBy: {
    id: number;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  category: string;
  expense_type: string;
  description?: string;
  purpose?: string;
  expense_date: string;
  vendor?: string;
  invoice_number?: string;
  payment_method?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  submitted_at: string;
  approved_at?: string;
  paid_at?: string;
  approved_amount?: number;
  reimbursed_amount?: number;
  remaining_amount: number;
  is_fully_reimbursed: boolean;
  approval_notes?: string;
  rejection_reason?: string;
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  claim: Claim;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  userRole: string;
}

export default function ClaimShow({ business, claim, canEdit, canDelete, canManage, userRole }: Props) {
  // Safety check: ensure all required data is available
  if (!claim || !business) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600">Error Loading Claim</h1>
          <p className="text-muted-foreground">Unable to load claim data. Please try again.</p>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Claims', href: `/businesses/${business.slug}/claims` },
    { title: 'View', href: `/businesses/${business.slug}/claims/${claim.uuid}` }
  ];

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      router.delete(route('businesses.claims.destroy', [business.slug, claim.uuid]));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      paid: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
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
      office_supplies: { color: 'bg-green-100 text-green-800' },
      meals: { color: 'bg-orange-100 text-orange-800' },
      transportation: { color: 'bg-purple-100 text-purple-800' },
      training: { color: 'bg-indigo-100 text-indigo-800' },
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
      <Head title={`Claim Details - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href={route('businesses.claims.index', business.slug)}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Claims
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Claim Details</h1>
                <p className="text-muted-foreground">
                  View claim information for {business.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canEdit && claim.status === 'pending' && (
                <Link href={route('businesses.claims.edit', [business.slug, claim.uuid])}>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              
              {canDelete && claim.status === 'pending' && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status and Amount Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(claim.status)}
                {getCategoryBadge(claim.category)}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(claim.amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed Amount
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {claim.approved_amount ? formatCurrency(claim.approved_amount) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Approved Amount
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatCurrency(claim.reimbursed_amount || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Reimbursed
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatCurrency(claim.remaining_amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Outstanding
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatDate(claim.expense_date)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expense Date
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                <p className="text-sm">{claim.purpose || 'N/A'}</p>
              </div>
              
              {claim.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{claim.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="mt-1">{getCategoryBadge(claim.category)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(claim.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expense Type</label>
                  <p className="text-sm">{claim.expense_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-sm">{claim.payment_method || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                <p className="text-sm">{formatDateTime(claim.submitted_at)}</p>
              </div>
              
              {claim.approved_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approved</label>
                  <p className="text-sm">{formatDateTime(claim.approved_at)}</p>
                </div>
              )}
              
              {claim.paid_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Paid</label>
                  <p className="text-sm">{formatDateTime(claim.paid_at)}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expense Date</label>
                <p className="text-sm">{formatDate(claim.expense_date)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor and Invoice Information */}
        {(claim.vendor || claim.invoice_number) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Vendor & Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {claim.vendor && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                    <p className="text-sm">{claim.vendor}</p>
                  </div>
                )}
                
                {claim.invoice_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                    <p className="text-sm">{claim.invoice_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* People Involved */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              People Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {claim.user?.name ? claim.user.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{claim.user?.name || 'Unknown User'}</div>
                  <div className="text-sm text-muted-foreground">{claim.user?.email || 'No email'}</div>
                  <div className="text-xs text-muted-foreground">Employee</div>
                </div>
              </div>

              {/* Submitted By */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {claim.submittedBy?.name ? claim.submittedBy.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase() : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{claim.submittedBy?.name || 'Unknown User'}</div>
                  <div className="text-sm text-muted-foreground">{claim.submittedBy?.email || 'No email'}</div>
                  <div className="text-xs text-muted-foreground">Submitted By</div>
                </div>
              </div>

              {/* Approved By (if applicable) */}
              {claim.approvedBy && claim.approvedBy.name && claim.approvedBy.email && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {claim.approvedBy.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{claim.approvedBy.name}</div>
                    <div className="text-sm text-muted-foreground">{claim.approvedBy.email}</div>
                    <div className="text-xs text-muted-foreground">Approved By</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval Notes (if applicable) */}
        {(claim.approval_notes || claim.rejection_reason) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Approval Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {claim.approval_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approval Notes</label>
                  <p className="text-sm">{claim.approval_notes}</p>
                </div>
              )}
              
              {claim.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                  <p className="text-sm text-red-600">{claim.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
