import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, X, Receipt, User, DollarSign, Calendar, FileText, Building2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  users: Record<string, string>;
  canManage: boolean;
}

export default function Create({ business, users, canManage }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    user_id: '',
    amount: '',
    category: 'general',
    expense_type: 'reimbursement',
    description: '',
    purpose: '',
    expense_date: '',
    vendor: '',
    invoice_number: '',
    payment_method: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Claims', href: `/businesses/${business.slug}/claims` },
    { title: 'Create', href: `/businesses/${business.slug}/claims/create` }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('businesses.claims.store', business.slug), {
      onSuccess: () => {
        reset();
      },
    });
  };

  const handleCancel = () => {
    router.get(route('businesses.claims.index', business.slug));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Create Claim - ${business.name}`} />
      
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Submit Expense Claim</h1>
              <p className="text-muted-foreground">
                Submit a new expense claim for {business.name}
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
                      ? 'Select the employee submitting the claim'
                      : 'You can only submit claims for yourself'
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
                      onChange={(e) => setData('amount', e.target.value)}
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
                      <SelectItem value="meals">Meals</SelectItem>
                      <SelectItem value="office_supplies">Office Supplies</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="general">General</SelectItem>
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
                      <SelectItem value="reimbursement">Reimbursement</SelectItem>
                      <SelectItem value="petty_cash">Petty Cash</SelectItem>
                      <SelectItem value="direct_payment">Direct Payment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.expense_type && (
                    <p className="text-sm text-red-600 mt-1">{errors.expense_type}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select how the expense was handled
                  </p>
                </div>
              </div>

              {/* Expense Date and Vendor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="expense_date" className="text-sm font-medium">
                    Expense Date *
                  </Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={data.expense_date}
                    onChange={(e) => setData('expense_date', e.target.value)}
                    className="mt-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expense_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.expense_date}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    When the expense occurred (cannot be future date)
                  </p>
                </div>

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
              </div>

              {/* Invoice and Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    maxLength={255}
                  />
                  {errors.invoice_number && (
                    <p className="text-sm text-red-600 mt-1">{errors.invoice_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Invoice or receipt number (optional)
                  </p>
                </div>

                <div>
                  <Label htmlFor="payment_method" className="text-sm font-medium">
                    Payment Method
                  </Label>
                  <Input
                    id="payment_method"
                    value={data.payment_method}
                    onChange={(e) => setData('payment_method', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Cash, Credit Card, Bank Transfer"
                    maxLength={255}
                  />
                  {errors.payment_method && (
                    <p className="text-sm text-red-600 mt-1">{errors.payment_method}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    How you paid for the expense (optional)
                  </p>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium">
                  Business Purpose *
                </Label>
                <Input
                  id="purpose"
                  value={data.purpose}
                  onChange={(e) => setData('purpose', e.target.value)}
                  className="mt-1"
                  placeholder="e.g., Client meeting lunch, Office supplies for project, Travel to client site"
                  maxLength={500}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Explain the business purpose of this expense
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="mt-1"
                  placeholder="Provide detailed description of the expense, what was purchased, why it was needed, and any supporting context..."
                  rows={4}
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Detailed description to support your claim
                </p>
              </div>

              {/* Important Notes */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Expense claims will be reviewed by management. 
                  Please ensure all information is accurate and complete. 
                  {!canManage && ' You can only submit claims for yourself.'}
                  <br />
                  <strong>Note:</strong> Keep all receipts and supporting documents for your records.
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
                  {processing ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
