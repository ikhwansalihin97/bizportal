import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  MapPin, 
  ExternalLink, 
  Mail, 
  Phone,
  Calendar,
  Edit,
  Settings,
  Crown,
  Shield,
  Eye,
  Trash2,
  Power,
  PowerOff,
  MoreVertical
} from 'lucide-react';
import type { Business, BusinessRole } from '@/types';
import { SUBSCRIPTION_PLANS, BUSINESS_ROLES } from '@/types';

interface BusinessShowProps {
  business: Business;
  userRole?: BusinessRole;
  canManage: boolean;
}

export default function BusinessShow({ business, userRole, canManage }: BusinessShowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` }
  ];
  
  const businessInitials = business.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getRoleIcon = (role?: BusinessRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSubscriptionBadgeColor = (plan: Business['subscription_plan']) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleToggleStatus = () => {
    router.patch(route('businesses.toggle-status', business.slug), {}, {
      preserveScroll: true,
    });
  };

  const handleDelete = () => {
    router.delete(route('businesses.destroy', business.slug));
    setDeleteDialogOpen(false);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={business.name} />
      
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Businesses
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {business.logo_url && (
                  <AvatarImage src={business.logo_url} alt={business.name} />
                )}
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {businessInitials}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge 
                    variant="outline" 
                    className={getSubscriptionBadgeColor(business.subscription_plan)}
                  >
                    {SUBSCRIPTION_PLANS[business.subscription_plan]}
                  </Badge>
                  {userRole && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getRoleIcon(userRole)}
                      {BUSINESS_ROLES[userRole]}
                    </Badge>
                  )}
                  <Badge variant={business.is_active ? "default" : "secondary"}>
                    {business.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {canManage && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/businesses/${business.slug}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Business
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/businesses/${business.slug}/users`}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </a>
                </Button>
                
                {/* More Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleToggleStatus}>
                      {business.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate Business
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate Business
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Business
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.description && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{business.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {business.industry && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Industry</h4>
                      <p className="text-sm">{business.industry}</p>
                    </div>
                  )}
                  
                  {business.established_date && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Established</h4>
                      <p className="text-sm">{new Date(business.established_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {business.employee_count && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Employees</h4>
                      <p className="text-sm">{business.employee_count.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {business.registration_number && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Registration</h4>
                      <p className="text-sm">{business.registration_number}</p>
                    </div>
                  )}
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
                  {business.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.email}`} className="text-sm text-blue-600 hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.phone}`} className="text-sm text-blue-600 hover:underline">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {business.full_address && (
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">{business.full_address}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">{business.users?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                
                {/* Team Members List */}
                {business.users && business.users.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {business.users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {user.profile?.avatar && (
                            <AvatarImage src={user.profile.avatar} alt={user.name} />
                          )}
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.pivot?.business_role}
                          </div>
                        </div>
                      </div>
                    ))}
                    {business.users.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{business.users.length - 5} more members
                      </div>
                    )}
                  </div>
                )}
                
                {business.users?.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">No active members</div>
                  </div>
                )}
                
                {canManage && (
                  <Button className="w-full" asChild>
                    <a href={`/businesses/${business.slug}/users`}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-4">
                  Activity feed coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action will soft delete "{business.name}" and deactivate all user relationships. 
              The business can be restored later by a superadmin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
