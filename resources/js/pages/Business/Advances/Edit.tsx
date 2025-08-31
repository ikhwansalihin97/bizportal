import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, X, DollarSign, Calendar, User, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  due_date?: string;
  advance_date?: string;
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  advance: Advance;
  users: Record<string, string>;
  canManage: boolean;
  canViewAll: boolean;
  userRole: string;
}

export default function AdvanceEdit({ business, advance, users, canManage, canViewAll, userRole }: Props) {
  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Fix timezone issue: Use local date methods instead of toISOString()
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const { data, setData, put, processing, errors, reset } = useForm({
    user_id: advance.user.id.toString(),
    amount: advance.amount.toString(),
    type: advance.type,
    purpose: advance.purpose,
    description: advance.description || '',
    due_date: formatDateForInput(advance.due_date),
    advance_date: formatDateForInput(advance.advance_date),
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Advances', href: `/businesses/${business.slug}/advances` },
    { title: 'Edit', href: `/businesses/${business.slug}/advances/${advance.uuid}/edit` }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    put(route('businesses.advances.update', [business.slug, advance.uuid]), {
      onSuccess: () => {
        // Success message will be shown via flash message
      },
    });
  };

  const handleCancel = () => {
    router.get(route('businesses.advances.index', business.slug));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Advance - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href={route('businesses.advances.show', [business.slug, advance.uuid])}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Advance
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Advance</h1>
              <p className="text-muted-foreground">
                Update advance details for {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Advance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="user_id" className="text-sm font-medium">
                    Employee *
                  </Label>
                  <Select
                    value={data.user_id}
                    onValueChange={(value) => setData('user_id', value)}
                    disabled={!canManage} // Only managers can change employee
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(users).map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.user_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {canManage 
                      ? 'Select the employee for this advance'
                      : 'Employee cannot be changed'
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount (MYR) *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      RM
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="999999.99"
                      value={data.amount}
                      onChange={(e) => {
                        setData('amount', e.target.value);
                      }}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the amount requested (maximum RM 999,999.99)
                  </p>
                </div>
              </div>

              {/* Advance Type and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="type" className="text-sm font-medium">
                    Advance Type *
                  </Label>
                  <Select
                    value={data.type}
                    onValueChange={(value) => setData('type', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600 mt-1">{errors.type}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select how the advance will be provided
                  </p>
                </div>

                <div>
                  <Label htmlFor="due_date" className="text-sm font-medium">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={data.due_date}
                    onChange={(e) => setData('due_date', e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.due_date}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    When the advance should be repaid (optional)
                  </p>
                </div>
              </div>

              {/* Advance Date */}
              <div>
                <Label htmlFor="advance_date" className="text-sm font-medium">
                  Advance Date
                </Label>
                <Input
                  id="advance_date"
                  type="date"
                  value={data.advance_date}
                  onChange={(e) => setData('advance_date', e.target.value)}
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.advance_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.advance_date}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Date when the advance was actually taken/disbursed (optional, cannot be future date)
                </p>
              </div>

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium">
                  Purpose *
                </Label>
                <Input
                  id="purpose"
                  value={data.purpose}
                  onChange={(e) => setData('purpose', e.target.value)}
                  className="mt-1"
                  placeholder="e.g., Office supplies, Travel expenses, Emergency funds"
                  maxLength={255}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Briefly describe the purpose of this advance request
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Additional Details
                </Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="mt-1"
                  placeholder="Provide additional context, specific requirements, or supporting information..."
                  rows={4}
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Optional additional details to support your request
                </p>
              </div>

              {/* Important Notes */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> You can only edit advances that are still pending. 
                  Once an advance is approved, rejected, or paid, it cannot be modified.
                  {!canManage && ' You can only edit your own advances.'}
                </AlertDescription>
              </Alert>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={processing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  <Save className="w-4 h-4 mr-2" />
                  {processing ? 'Updating...' : 'Update Advance'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
