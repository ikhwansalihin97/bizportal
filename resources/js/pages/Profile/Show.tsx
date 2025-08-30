import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Building2,
  MapPin,
  Edit,
  Crown,
  Shield,
  Settings,
  Eye,
  Briefcase,
  Users,
} from 'lucide-react';
import type { User as UserType } from '@/types';

interface ProfileShowProps {
  user: UserType & {
    businesses_count?: number;
    created_businesses_count?: number;
    businesses?: Array<{
      id: number;
      name: string;
      slug: string;
      industry?: string;
      pivot?: {
        business_role: string;
        employment_status: string;
        joined_date: string;
      };
    }>;
    createdBusinesses?: Array<{
      id: number;
      name: string;
      slug: string;
      industry?: string;
      created_at: string;
    }>;
  };
  canEdit: boolean;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  manager: Settings,
  employee: User,
  contractor: User,
  viewer: Eye,
};

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  employee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  contractor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function ProfileShow({ user, canEdit }: ProfileShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Profile', href: '/profile' }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${user.name} - Profile`} />
      
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile?.avatar} alt={user.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                {user.profile?.job_title && (
                  <p className="text-sm text-muted-foreground mt-1">{user.profile.job_title}</p>
                )}
              </div>
            </div>
            
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/profile">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Associations */}
            <Card>
              <CardHeader>
                <CardTitle>Business Associations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{user.businesses_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Member of Businesses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{user.created_businesses_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Created Businesses</div>
                  </div>
                </div>

                {/* Business Memberships */}
                {user.businesses && user.businesses.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Current Business Memberships</h4>
                    <div className="space-y-2">
                      {user.businesses.map((business) => (
                        <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Link 
                                href={`/businesses/${business.slug}`}
                                className="font-medium hover:underline"
                              >
                                {business.name}
                              </Link>
                              {business.industry && (
                                <p className="text-xs text-muted-foreground">{business.industry}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {business.pivot && (
                              <Badge className={roleColors[business.pivot.business_role as keyof typeof roleColors]}>
                                <span className="flex items-center gap-1">
                                  {getRoleIcon(business.pivot.business_role)}
                                  {business.pivot.business_role}
                                </span>
                              </Badge>
                            )}
                            {business.pivot?.joined_date && (
                              <span className="text-xs text-muted-foreground">
                                Joined {formatDate(business.pivot.joined_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Created Businesses */}
                {user.createdBusinesses && user.createdBusinesses.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h4 className="font-medium text-sm">Created Businesses</h4>
                    <div className="space-y-2">
                      {user.createdBusinesses.map((business) => (
                        <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Link 
                                href={`/businesses/${business.slug}`}
                                className="font-medium hover:underline"
                              >
                                {business.name}
                              </Link>
                              {business.industry && (
                                <p className="text-xs text-muted-foreground">{business.industry}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800">
                              <Crown className="h-3 w-3 mr-1" />
                              Creator
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Created {formatDate(business.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!user.businesses || user.businesses.length === 0) && (!user.createdBusinesses || user.createdBusinesses.length === 0) && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No business associations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.profile.phone}</p>
                    </div>
                  </div>
                )}

                {user.profile?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{user.profile.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Information */}
            {(user.profile?.job_title || user.profile?.department || user.profile?.employee_id) && (
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.profile?.job_title && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Job Title</p>
                        <p className="font-medium">{user.profile.job_title}</p>
                      </div>
                    </div>
                  )}

                  {user.profile?.department && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{user.profile.department}</p>
                      </div>
                    </div>
                  )}

                  {user.profile?.employee_id && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Employee ID</p>
                        <p className="font-medium">{user.profile.employee_id}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {user.profile?.last_login && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p className="font-medium">{formatDate(user.profile.last_login)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
