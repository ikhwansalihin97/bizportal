import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Crown,
  Shield,
  Settings,
  User,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  Edit,
  UserX,
  UserCheck,
  MailCheck,
  MailX,
  Users,
  Clock,
  FileText,
} from 'lucide-react';
import type { User as UserType } from '@/types';

interface UserWithDetails extends UserType {
  businesses_count?: number;
  created_businesses_count?: number;
  businesses?: any[];
  created_businesses?: any[];
}

interface AdminUserShowProps {
  user: UserWithDetails;
  canEdit: boolean;
  canDelete: boolean;
}

const roleIcons = {
  superadmin: Crown,
  'business-admin': Shield,
  manager: Settings,
  employee: User,
  viewer: Eye,
};

const roleColors = {
  superadmin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'business-admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  employee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Helper function to get user's primary role (prioritizing Spatie roles over profile role)
const getUserPrimaryRole = (user: any): string => {
  // If user has Spatie roles, use the first one (they should only have one role anyway)
  if (user.roles && user.roles.length > 0) {
    return user.roles[0].name;
  }
  
  // Fallback to profile role if no Spatie roles
  return user.profile?.role || 'employee';
};

export default function AdminUserShow({ user, canEdit, canDelete }: AdminUserShowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administration', href: '/admin/users' },
    { title: 'Users', href: '/admin/users' },
    { title: user.name, href: `/admin/users/${user.uuid}` }
  ];

  const handleBack = () => {
    router.get('/admin/users');
  };

  const handleToggleStatus = () => {
    router.patch(`/admin/users/${user.uuid}/toggle-status`, {}, {
      onSuccess: () => {
        // Success handled by page refresh
      }
    });
  };

  const handleSendVerification = () => {
    router.post(`/admin/users/${user.uuid}/send-verification`, {}, {
      onSuccess: () => {
        // Success handled by page refresh
      }
    });
  };

  const handleVerifyEmail = () => {
    router.post(`/admin/users/${user.uuid}/verify-email`, {}, {
      onSuccess: () => {
        // Success handled by page refresh
      }
    });
  };

  const handleDeleteUser = () => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      router.delete(`/admin/users/${user.uuid}`, {
        onSuccess: () => {
          router.get('/admin/users');
        }
      });
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${user.name} - User Details`} />
      
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile?.avatar_url} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                {user.profile?.job_title && (
                  <p className="text-sm text-muted-foreground">{user.profile.job_title}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {getRoleIcon(user.profile?.role || 'employee')}
                  <Badge className={roleColors[(user.profile?.role || 'employee') as keyof typeof roleColors]}>
                    {user.profile?.role || 'employee'}
                  </Badge>
                  <Badge className={statusColors[(user.profile?.status || 'active') as keyof typeof statusColors]}>
                    {user.profile?.status || 'active'}
                  </Badge>
                  {user.email_verified_at ? (
                    <Badge className="bg-green-100 text-green-800">
                      <MailCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <MailX className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/admin/users/${user.uuid}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Link>
                </Button>
                
                <Button variant="outline" onClick={handleToggleStatus}>
                  {user.profile?.status === 'active' ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
                
                {!user.email_verified_at && (
                  <>
                    <Button variant="outline" onClick={handleSendVerification}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Verification
                    </Button>
                    <Button variant="outline" onClick={handleVerifyEmail}>
                      <MailCheck className="h-4 w-4 mr-2" />
                      Mark Verified
                    </Button>
                  </>
                )}
                
                {canDelete && (
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        <UserX className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete {user.name}? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                          Delete User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
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
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{user.profile.department}</p>
                    </div>
                  </div>
                )}

                {user.profile?.employee_id && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{user.profile.employee_id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Associations */}
            <Card>
              <CardHeader>
                <CardTitle>Business Associations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{user.businesses_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Member of Businesses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{user.created_businesses_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Created Businesses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Memberships */}
            {user.businesses && user.businesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Business Memberships</span>
                    <Badge variant="secondary">{user.businesses.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Businesses this user is a member of
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.businesses.map((business: any) => (
                      <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{business.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {business.industry} • {business.city || 'No location'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {business.pivot?.business_role || 'member'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Joined {business.pivot?.joined_date ? new Date(business.pivot.joined_date).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Created Businesses */}
            {user.created_businesses && user.created_businesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Created Businesses</span>
                    <Badge variant="secondary">{user.created_businesses.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Businesses created by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.created_businesses.map((business: any) => (
                      <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Crown className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="font-medium">{business.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {business.industry} • {business.city || 'No location'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={business.is_active ? "default" : "secondary"}>
                            {business.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Created {new Date(business.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getRoleIcon(getUserPrimaryRole(user))}
                  <Badge className={roleColors[getUserPrimaryRole(user) as keyof typeof roleColors]}>
                    {getUserPrimaryRole(user)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[(user.profile?.status || 'active') as keyof typeof statusColors]}>
                    {user.profile?.status || 'active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {user.email_verified_at && (
                  <div className="flex items-center gap-3">
                    <MailCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email Verified</p>
                      <p className="font-medium">{formatDateTime(user.email_verified_at)}</p>
                    </div>
                  </div>
                )}

                {user.profile?.last_login && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p className="font-medium">{formatDateTime(user.profile.last_login)}</p>
                    </div>
                  </div>
                )}

                {user.updated_at !== user.created_at && (
                  <div className="flex items-center gap-3">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formatDateTime(user.updated_at)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information */}
            {(user.profile?.date_of_birth || user.profile?.gender) && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user.profile?.date_of_birth && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date of Birth</span>
                      <span className="text-sm font-medium">{formatDate(user.profile.date_of_birth)}</span>
                    </div>
                  )}
                  {user.profile?.gender && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gender</span>
                      <span className="text-sm font-medium capitalize">{user.profile.gender}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
