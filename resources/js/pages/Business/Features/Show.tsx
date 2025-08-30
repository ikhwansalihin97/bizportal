import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFeatureIcon } from '@/lib/feature-icons';
import type { Business } from '@/types';

interface BusinessFeature {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  is_active: boolean;
  settings: Record<string, any>;
  pivot: {
    is_enabled: boolean;
    settings: Record<string, any>;
    enabled_at: string;
    enabled_by: number;
  };
}

interface FeatureShowProps {
  business: Business;
  feature: BusinessFeature;
  userRole: string;
  canManage: boolean;
}

export default function FeatureShow({ 
  business, 
  feature, 
  userRole, 
  canManage 
}: FeatureShowProps) {
  const FeatureIcon = getFeatureIcon(feature.slug);
  
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Features', href: `/businesses/${business.slug}/features` },
    { title: feature.name, href: `/businesses/${business.slug}/features/${feature.slug}` }
  ];

  const getFeatureContent = () => {
    switch (feature.slug) {
      case 'leave-management':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>
                  Manage employee leave requests, approvals, and leave balances.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Approved This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Leave days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">With leave balances</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'payroll-management':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Management</CardTitle>
                <CardDescription>
                  Calculate and process employee payroll, taxes, and deductions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Payroll</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">On payroll</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Next Payday</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">-</div>
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'project-management':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Manage projects, tasks, and team collaboration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Open Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">To be completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Assigned to projects</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'inventory-management':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Track inventory levels, stock movements, and generate reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">In inventory</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Low Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Items need reorder</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-xs text-muted-foreground">Inventory worth</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'crm':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Relationship Management</CardTitle>
                <CardDescription>
                  Manage customer relationships, leads, and sales pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">In database</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Active Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">In pipeline</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">This Month Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Store, organize, and manage business documents and files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Stored files</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Storage Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0 MB</div>
                      <p className="text-xs text-muted-foreground">Of available space</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Uploads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reporting & Analytics</CardTitle>
                <CardDescription>
                  Generate business reports and analytics dashboards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Available Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Pre-built templates</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Custom Dashboards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Created by users</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Data Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Connected systems</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <Button disabled>
                    <span>Coming Soon</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{feature.name}</CardTitle>
                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{feature.category}</Badge>
                    <Badge variant={feature.is_active ? "default" : "secondary"}>
                      {feature.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-6">
                    <Button disabled>
                      <span>Feature Coming Soon</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${feature.name} - ${business.name}`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FeatureIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{feature.name}</h1>
              <p className="text-muted-foreground">
                {business.name} • {feature.category} • You are a {userRole || 'member'}
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <span>Feature Settings</span>
              </Button>
            </div>
          )}
        </div>

        {/* Feature Content */}
        {getFeatureContent()}
      </div>
    </AppLayout>
  );
}
