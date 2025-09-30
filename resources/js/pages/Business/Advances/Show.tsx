import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, FileText, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Advance {
  id: number;
  uuid: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  requestedBy: {
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
  type: string;
  purpose: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  requested_at: string;
  approved_at?: string;
  paid_at?: string;
  due_date?: string;
  advance_date?: string;
  remaining_amount: number;
  is_fully_repaid: boolean;
  approval_notes?: string;
  rejection_reason?: string;
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  advance: Advance;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  canViewAll: boolean;
  userRole: string;
}

export default function AdvanceShow({ business, advance, canEdit, canDelete, canManage, canViewAll, userRole }: Props) {
  // Safety check: ensure all required data is available
  if (!advance || !business) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600">Error Loading Advance</h1>
          <p className="text-muted-foreground">Unable to load advance data. Please try again.</p>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Advances', href: `/businesses/${business.slug}/advances` },
    { title: 'View', href: `/businesses/${business.slug}/advances/${advance.uuid}` }
  ];

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this advance? This action cannot be undone.')) {
      router.delete(route('businesses.advances.destroy', [business.slug, advance.uuid]));
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
      <Head title={`Advance Details - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href={route('businesses.advances.index', business.slug)}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Advances
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Advance Details</h1>
                <p className="text-muted-foreground">
                  View advance information for {business.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canEdit && advance.status === 'pending' && (
                <Link href={route('businesses.advances.edit', [business.slug, advance.uuid])}>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              
              {canDelete && advance.status === 'pending' && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with Error Boundary */}
        {(() => {
          try {
            return (
              <>
                {/* Status and Amount Summary */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(advance.status)}
                        {getTypeBadge(advance.type)}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatCurrency(advance.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested Amount
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {formatCurrency(advance.remaining_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Outstanding Amount
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {advance.is_fully_repaid ? 'Yes' : 'No'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Fully Repaid
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {formatDate(advance.requested_at)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested Date
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advance Details */}
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
                        <p className="text-sm">{advance.purpose}</p>
                      </div>
                      
                      {advance.description && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Description</label>
                          <p className="text-sm">{advance.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <div className="mt-1">{getTypeBadge(advance.type)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <div className="mt-1">{getStatusBadge(advance.status)}</div>
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
                        <label className="text-sm font-medium text-muted-foreground">Requested</label>
                        <p className="text-sm">{formatDateTime(advance.requested_at)}</p>
                      </div>
                      
                      {advance.approved_at && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Approved</label>
                          <p className="text-sm">{formatDateTime(advance.approved_at)}</p>
                        </div>
                      )}
                      
                      {advance.paid_at && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Paid</label>
                          <p className="text-sm">{formatDateTime(advance.paid_at)}</p>
                        </div>
                      )}
                      
                      {advance.due_date && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                          <p className="text-sm">{formatDate(advance.due_date)}</p>
                        </div>
                      )}
                      
                      {advance.advance_date && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Advance Date</label>
                          <p className="text-sm">{formatDate(advance.advance_date)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

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
                            {advance.user?.name ? advance.user.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{advance.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{advance.user?.email || 'No email'}</div>
                          <div className="text-xs text-muted-foreground">Employee</div>
                        </div>
                      </div>

                      {/* Requested By */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {advance.requestedBy?.name ? advance.requestedBy.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase() : 'R'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{advance.requestedBy?.name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{advance.requestedBy?.email || 'No email'}</div>
                          <div className="text-xs text-muted-foreground">Requested By</div>
                        </div>
                      </div>

                      {/* Approved By (if applicable) */}
                      {advance.approvedBy && advance.approvedBy.name && advance.approvedBy.email && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {advance.approvedBy.name.split(' ').reduce((initials, name) => initials + name[0], '').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{advance.approvedBy.name}</div>
                            <div className="text-sm text-muted-foreground">{advance.approvedBy.email}</div>
                            <div className="text-xs text-muted-foreground">Approved By</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Notes (if applicable) */}
                {(advance.approval_notes || advance.rejection_reason) && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Approval Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {advance.approval_notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Approval Notes</label>
                          <p className="text-sm">{advance.approval_notes}</p>
                        </div>
                      )}
                      
                      {advance.rejection_reason && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                          <p className="text-sm text-red-600">{advance.rejection_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            );
          } catch (error) {
            console.error('Error rendering advance content:', error);
            return (
              <Card className="mb-6">
                <CardContent className="p-6 text-center">
                  <h2 className="text-lg font-semibold text-red-600 mb-2">Error Displaying Advance</h2>
                  <p className="text-muted-foreground">There was an error displaying the advance details. Please try refreshing the page.</p>
                </CardContent>
              </Card>
            );
          }
        })()}
      </div>
    </AppLayout>
  );
}
