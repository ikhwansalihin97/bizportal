import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Settings, 
  BarChart3, 
  Calendar,
  TrendingUp,
  Activity,
  Crown
} from 'lucide-react';
import type { Business } from '@/types';
import { getFeatureIcon } from '@/lib/feature-icons';
import { Link } from '@inertiajs/react';

interface BusinessDashboardProps {
  business: Business;
  userRole: string;
  canManage: boolean;
  stats: {
    total_users: number;
    active_users: number;
    owners: number;
    admins: number;
    managers: number;
    employees: number;
  };
  recent_users: any[];
  enabled_features?: any[];
}

export default function BusinessDashboard({ 
  business, 
  userRole, 
  canManage, 
  stats, 
  recent_users,
  enabled_features = []
}: BusinessDashboardProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Business Dashboard', href: `/businesses/${business.slug}/dashboard` }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'employee': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${business.name} - Dashboard`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
            <p className="text-muted-foreground">
              Business Dashboard • You are a {userRole || 'member'}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_users} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.owners}</div>
              <p className="text-xs text-muted-foreground">
                Business owners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.employees}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Members</CardTitle>
            <CardDescription>
              Latest users who joined {business.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent_users.length > 0 ? (
              <div className="space-y-4">
                {recent_users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(user.pivot.business_role)}>
                        {user.pivot.business_role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.pivot.joined_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No team members yet</p>
                {canManage && (
                  <Button className="mt-2" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite First User
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enabled Features */}
        {enabled_features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Enabled Features</CardTitle>
              <CardDescription>
                Features available for {business.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enabled_features.map((feature) => {
                  const FeatureIcon = getFeatureIcon(feature.slug);
                  
                  return (
                    <Link
                      key={feature.id}
                      href={`/businesses/${business.slug}/features/${feature.slug}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FeatureIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{feature.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {feature.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {feature.category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Click to open
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/businesses/${business.slug}/features`}>
                    View All Features
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your business and team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <UserPlus className="h-6 w-6" />
                  <span>Invite User</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Team</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Reports</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Settings className="h-6 w-6" />
                  <span>Business Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
