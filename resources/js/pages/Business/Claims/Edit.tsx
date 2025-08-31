import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, X, Receipt, Calendar, User, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  description?: string;
  purpose?: string;
  expense_date: string;
  vendor?: string;
  invoice_number?: string;
  payment_method?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
}

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  claim: Claim;
  users: Record<string, string>;
  canManage: boolean;
  userRole: string;
}

export default function ClaimEdit({ business, claim, users, canManage, userRole }: Props) {
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
    user_id: claim.user.id.toString(),
    amount: claim.amount.toString(),
    category: claim.category,
    expense_type: claim.expense_type,
    description: claim.description || '',
    purpose: claim.purpose || '',
    expense_date: formatDateForInput(claim.expense_date),
    vendor: claim.vendor || '',
    invoice_number: claim.invoice_number || '',
    payment_method: claim.payment_method || '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Claims', href: `/businesses/${business.slug}/claims` },
    { title: 'Edit', href: `/businesses/${business.slug}/claims/${claim.uuid}/edit` }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    put(route('businesses.claims.update', [business.slug, claim.uuid]), {
      onSuccess: () => {
        // Success message will be shown via flash message
      },
    });
  };

  const handleCancel = () => {
    router.get(route('businesses.claims.index', business.slug));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Claim - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href={route('businesses.claims.show', [business.slug, claim.uuid])}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Claim
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Claim</h1>
              <p className="text-muted-foreground">
                Update claim details for {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
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
                      ? 'Select the employee for this claim'
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
                        // Fix floating point precision issues
                        const value = parseFloat(e.target.value);
                        
                        if (!isNaN(value)) {
                          // Round to 2 decimal places to avoid floating point errors
                          const roundedValue = Math.round(value * 100) / 100;
                          setData('amount', roundedValue.toString());
                        } else {
                          setData('amount', e.target.value);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure proper formatting on blur
                        const value = parseFloat(e.target.value);
                        
                        if (!isNaN(value)) {
                          const roundedValue = Math.round(value * 100) / 100;
                          setData('amount', roundedValue.toFixed(2));
                        }
                      }}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the amount claimed (maximum RM 999,999.99)
                  </p>
                </div>
              </div>

              {/* Category and Expense Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select
                    value={data.category}
                    onValueChange={(value) => setData('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="office_supplies">Office Supplies</SelectItem>
                      <SelectItem value="meals">Meals</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the expense category
                  </p>
                </div>

                <div>
                  <Label htmlFor="expense_type" className="text-sm font-medium">
                    Expense Type *
                  </Label>
                  <Select
                    value={data.expense_type}
                    onValueChange={(value) => setData('expense_type', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_expense">Business Expense</SelectItem>
                      <SelectItem value="personal_expense">Personal Expense</SelectItem>
                      <SelectItem value="reimbursement">Reimbursement</SelectItem>
                      <SelectItem value="advance_payment">Advance Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.expense_type && (
                    <p className="text-sm text-red-600 mt-1">{errors.expense_type}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the type of expense
                  </p>
                </div>
              </div>

              {/* Expense Date and Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="expense_date" className="text-sm font-medium">
                    Expense Date *
                  </Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={data.expense_date ? new Date(data.expense_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setData('expense_date', e.target.value)}
                    className="mt-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expense_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.expense_date}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Date when the expense was incurred (cannot be future date)
                  </p>
                </div>

                <div>
                  <Label htmlFor="payment_method" className="text-sm font-medium">
                    Payment Method
                  </Label>
                  <Select
                    value={data.payment_method}
                    onValueChange={(value) => setData('payment_method', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.payment_method && (
                    <p className="text-sm text-red-600 mt-1">{errors.payment_method}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    How the expense was paid (optional)
                  </p>
                </div>
              </div>

              {/* Purpose and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="purpose" className="text-sm font-medium">
                    Purpose
                  </Label>
                  <Input
                    id="purpose"
                    value={data.purpose}
                    onChange={(e) => setData('purpose', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Client meeting, Office supplies, Travel expenses"
                    maxLength={255}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Brief description of the expense purpose (optional)
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Additional Details
                  </Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="mt-1"
                    placeholder="Provide additional context or details..."
                    rows={3}
                    maxLength={1000}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional additional details to support your claim
                  </p>
                </div>
              </div>

              {/* Vendor and Invoice Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="vendor" className="text-sm font-medium">
                    Vendor/Supplier
                  </Label>
                  <Input
                    id="vendor"
                    value={data.vendor}
                    onChange={(e) => setData('vendor', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Office Depot, Uber, Restaurant Name"
                    maxLength={255}
                  />
                  {errors.vendor && (
                    <p className="text-sm text-red-600 mt-1">{errors.vendor}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Name of the vendor or supplier (optional)
                  </p>
                </div>

                <div>
                  <Label htmlFor="invoice_number" className="text-sm font-medium">
                    Invoice/Receipt Number
                  </Label>
                  <Input
                    id="invoice_number"
                    value={data.invoice_number}
                    onChange={(e) => setData('invoice_number', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., INV-001, RCPT-123"
                    maxLength={100}
                  />
                  {errors.invoice_number && (
                    <p className="text-sm text-red-600 mt-1">{errors.invoice_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Invoice or receipt number for reference (optional)
                  </p>
                </div>
              </div>

              {/* Important Notes */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> You can only edit claims that are still pending. 
                  Once a claim is approved, rejected, or paid, it cannot be modified.
                  {!canManage && ' You can only edit your own claims.'}
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
                  {processing ? 'Updating...' : 'Update Claim'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
