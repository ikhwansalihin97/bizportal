import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BusinessList } from '@/components/business/business-list';
import type { 
  Business, 
  BusinessFilters, 
  PaginatedResponse,
  BusinessRole 
} from '@/types';

interface BusinessIndexProps {
  businesses: PaginatedResponse<Business>;
  filters: BusinessFilters;
  canCreateBusiness: boolean;
  userRole?: BusinessRole;
}

export default function BusinessIndex({
  businesses,
  filters,
  canCreateBusiness,
  userRole,
}: BusinessIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Businesses" />
      
      <div className="p-6">
        <BusinessList
          initialBusinesses={businesses}
          userRole={userRole}
          canCreateBusiness={canCreateBusiness}
          filters={filters}
        />
      </div>
    </AppLayout>
  );
}
