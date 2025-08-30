import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BusinessForm } from '@/components/business/business-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { Business } from '@/types';

interface BusinessEditProps {
  business: Business;
}

export default function BusinessEdit({ business }: BusinessEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Edit', href: `/businesses/${business.slug}/edit` }
  ];

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {business.name}
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Business</h1>
              <p className="text-muted-foreground">
                Update information for {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <BusinessForm 
          business={business}
          onCancel={handleCancel}
          submitUrl={`/businesses/${business.slug}`}
          method="put"
        />
      </div>
    </AppLayout>
  );
}
