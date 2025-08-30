import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  FileText,
  Save,
  ArrowLeft
} from 'lucide-react';
import InputError from '@/components/input-error';
import type { BusinessFormData, Business } from '@/types';
import { INDUSTRIES, SUBSCRIPTION_PLANS } from '@/types';

interface BusinessFormProps {
  business?: Business;
  onCancel?: () => void;
  submitUrl?: string;
  method?: 'post' | 'put';
}

export function BusinessForm({ 
  business, 
  onCancel, 
  submitUrl, 
  method = 'post' 
}: BusinessFormProps) {
  const isEditing = !!business;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm<BusinessFormData>({
    name: business?.name || '',
    description: business?.description || '',
    industry: business?.industry || '',
    website: business?.website || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
    city: business?.city || '',
    state: business?.state || '',
    country: business?.country || '',
    postal_code: business?.postal_code || '',
    tax_id: business?.tax_id || '',
    registration_number: business?.registration_number || '',
    established_date: business?.established_date ? new Date(business.established_date).toISOString().split('T')[0] : '',
    employee_count: business?.employee_count || undefined,
    subscription_plan: business?.subscription_plan || 'free',
    is_active: business?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = submitUrl || (isEditing ? `/businesses/${business.slug}` : '/businesses');
    
    const onSuccess = () => {
      setIsSubmitting(false);
      if (!isEditing) {
        reset();
      }
    };

    const onError = () => {
      setIsSubmitting(false);
    };

    if (method === 'put') {
      put(url, { onSuccess, onError });
    } else {
      post(url, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Enter business name"
                required
              />
              <InputError message={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={data.industry}
                onValueChange={(value) => setData('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError message={errors.industry} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Brief description of your business"
              rows={3}
            />
            <InputError message={errors.description} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="established_date">Established Date</Label>
              <Input
                id="established_date"
                type="date"
                value={data.established_date}
                onChange={(e) => setData('established_date', e.target.value)}
              />
              <InputError message={errors.established_date} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Number of Employees</Label>
              <Input
                id="employee_count"
                type="number"
                min="1"
                value={data.employee_count || ''}
                onChange={(e) => setData('employee_count', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 50"
              />
              <InputError message={errors.employee_count} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="contact@company.com"
              />
              <InputError message={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <InputError message={errors.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={data.website}
              onChange={(e) => setData('website', e.target.value)}
              placeholder="https://www.company.com"
            />
            <InputError message={errors.website} />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => setData('address', e.target.value)}
              placeholder="123 Business Street"
            />
            <InputError message={errors.address} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => setData('city', e.target.value)}
                placeholder="New York"
              />
              <InputError message={errors.city} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => setData('state', e.target.value)}
                placeholder="NY"
              />
              <InputError message={errors.state} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={data.postal_code}
                onChange={(e) => setData('postal_code', e.target.value)}
                placeholder="10001"
              />
              <InputError message={errors.postal_code} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={data.country}
              onChange={(e) => setData('country', e.target.value)}
              placeholder="United States"
            />
            <InputError message={errors.country} />
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                value={data.tax_id}
                onChange={(e) => setData('tax_id', e.target.value)}
                placeholder="12-3456789"
              />
              <InputError message={errors.tax_id} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                value={data.registration_number}
                onChange={(e) => setData('registration_number', e.target.value)}
                placeholder="REG-123456"
              />
              <InputError message={errors.registration_number} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription_plan">Subscription Plan</Label>
            <Select
              value={data.subscription_plan}
              onValueChange={(value) => setData('subscription_plan', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.subscription_plan} />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Please correct the errors above and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={processing || isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Business' : 'Create Business'}
          </Button>
        </div>
      </div>
    </form>
  );
}
