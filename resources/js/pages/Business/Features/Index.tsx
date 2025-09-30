import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface BusinessFeature {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  settings: any[] | null;
}

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  business: Business;
  availableFeatures: BusinessFeature[];
  assignedFeatures: BusinessFeature[];
  unassignedFeatures: BusinessFeature[];
  userRole: string;
  canManage: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    isSuperAdmin?: boolean;
    permissions?: string[];
  };
}

export default function FeaturesIndex({
  business,
  availableFeatures,
  assignedFeatures,
  unassignedFeatures,
  userRole,
  canManage,
  user,
}: Props) {
  const [activeTab, setActiveTab] = useState('assigned');

  const { post: assignFeature, processing: assigning } = useForm({
    feature_id: '',
  });

  const { delete: removeFeature, processing: removing } = useForm({
    feature_id: '',
  });

  const handleAssignFeature = (featureId: number) => {
    console.log('Assigning feature:', featureId);
    
    // Test if route function is working
    console.log('Route function available:', typeof route);
    console.log('Available routes:', window.route);
    
    try {
      const routeUrl = route('businesses.features.assign', business.slug);
      console.log('Route URL:', routeUrl);
      console.log('Business slug:', business.slug);
      
      // Log the form object to see what methods are available
      console.log('assignFeature object:', assignFeature);
      console.log('assignFeature methods:', Object.getOwnPropertyNames(assignFeature));
      
      // Try to submit with the form first
      if (typeof assignFeature.post === 'function') {
        assignFeature.post(routeUrl, {
          data: { feature_id: featureId },
          onSuccess: () => {
            console.log('Feature assigned successfully');
          },
          onError: (errors) => {
            console.error('Error assigning feature:', errors);
          },
          onFinish: () => {
            console.log('Form submission finished');
          },
        });
      } else {
        // Fallback to router.post
        console.log('Using router.post fallback');
        router.post(routeUrl, { feature_id: featureId }, {
          onSuccess: () => {
            console.log('Feature assigned successfully via router');
          },
          onError: (errors) => {
            console.error('Error assigning feature via router:', errors);
          },
        });
      }
    } catch (error) {
      console.error('Exception in handleAssignFeature:', error);
    }
  };

  const handleRemoveFeature = (featureId: number) => {
    removeFeature(route('businesses.features.remove', business.slug), {
      data: { feature_id: featureId },
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'attendance':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'payroll':
        return <Settings className="h-5 w-5 text-blue-600" />;
      case 'inventory':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      attendance: 'bg-green-100 text-green-800',
      payroll: 'bg-blue-100 text-blue-800',
      inventory: 'bg-orange-100 text-orange-800',
      default: 'bg-gray-100 text-gray-800',
    };

    return colors[category.toLowerCase() as keyof typeof colors] || colors.default;
  };

  const getStatusIcon = (feature: BusinessFeature) => {
    if (feature.is_active && feature.is_enabled) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (feature.is_enabled) {
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <AppLayout>
      <Head title={`${business.name} - Feature Management`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Feature Management</h1>
                <p className="text-muted-foreground">
                  Manage which features are available for {business.name}
                </p>
              </div>
            </div>
            
            {/* Create Features Button */}
            {canManage && user?.isSuperAdmin && (
              <Button asChild>
                <Link href="/admin/features/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Features
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Active Features</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{assignedFeatures.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Available Features</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{availableFeatures.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Unassigned</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{unassignedFeatures.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">Assigned Features</TabsTrigger>
            <TabsTrigger value="available">Available Features</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Currently Assigned Features</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedFeatures.length > 0 ? (
                  <div className="space-y-4">
                    {assignedFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getCategoryIcon(feature.category)}
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description || 'No description available'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getCategoryBadge(feature.category)}>
                            {feature.category}
                          </Badge>
                          {canManage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFeature(feature.id)}
                              disabled={removing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Features Assigned</h3>
                    <p className="text-muted-foreground">
                      This business doesn't have any features assigned yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Features to Assign</CardTitle>
              </CardHeader>
              <CardContent>
                {unassignedFeatures.length > 0 ? (
                  <div className="space-y-4">
                    {unassignedFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getCategoryIcon(feature.category)}
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description || 'No description available'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getCategoryBadge(feature.category)}>
                            {feature.category}
                          </Badge>
                          {canManage && (
                            <Button
                              onClick={() => handleAssignFeature(feature.id)}
                              disabled={assigning}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Features Assigned</h3>
                    <p className="text-muted-foreground">
                      This business has access to all available features.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
