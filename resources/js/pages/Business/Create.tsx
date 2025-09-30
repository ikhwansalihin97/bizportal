import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BusinessForm } from '@/components/business/business-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function BusinessCreate() {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: 'Create Business', href: '/businesses/create' }
  ];

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Business" />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Businesses
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create New Business</h1>
              <p className="text-muted-foreground">
                Set up a new business account to manage users and operations
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <BusinessForm 
          onCancel={handleCancel}
          submitUrl="/businesses"
          method="post"
        />
      </div>
    </AppLayout>
  );
}
