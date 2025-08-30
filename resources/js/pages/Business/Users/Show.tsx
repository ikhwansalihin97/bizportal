import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  UserMinus,
  Clock,
  Users,
} from 'lucide-react';
import type { Business, User as UserType } from '@/types';

interface BusinessUser extends UserType {
  pivot: {
    business_role: string;
    employment_status: string;
    joined_date: string;
    left_date?: string;
    invited_by?: number;
    notes?: string;
    invitation_sent_at?: string;
    invitation_accepted_at?: string;
  };
}

interface BusinessUserShowProps {
  business: Business;
  user: BusinessUser;
  canManage: boolean;
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
  employee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function BusinessUserShow({ business, user, canManage }: BusinessUserShowProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    business_role: user.pivot.business_role,
    employment_status: user.pivot.employment_status,
    notes: user.pivot.notes || '',
  });

  const breadcrumbs = [
    { title: 'Businesses', href: '/businesses' },
    { title: business.name, href: `/businesses/${business.slug}` },
    { title: 'Users', href: `/businesses/${business.slug}/users` },
    { title: user.name, href: `/businesses/${business.slug}/users/${user.uuid}` }
  ];

  const handleBack = () => {
    router.get(`/businesses/${business.slug}/users`);
  };

  const handleUpdateUser = () => {
    router.put(`/businesses/${business.slug}/users/${user.uuid}`, editFormData, {
      onSuccess: () => {
        setEditDialogOpen(false);
      },
    });
  };

  const handleRemoveUser = () => {
    router.delete(`/businesses/${business.slug}/users/${user.uuid}`, {
      onSuccess: () => {
        router.get(`/businesses/${business.slug}/users`);
      },
    });
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
      <Head title={`${user.name} - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
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
                  {getRoleIcon(user.pivot.business_role)}
                  <Badge className={roleColors[user.pivot.business_role as keyof typeof roleColors]}>
                    {user.pivot.business_role}
                  </Badge>
                  <Badge className={statusColors[user.pivot.employment_status as keyof typeof statusColors]}>
                    {user.pivot.employment_status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {canManage && (
              <div className="flex gap-2">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User Role</DialogTitle>
                      <DialogDescription>
                        Update {user.name}'s role and status in {business.name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="business_role">Role</Label>
                        <Select 
                          value={editFormData.business_role} 
                          onValueChange={(value) => setEditFormData({ ...editFormData, business_role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="employment_status">Status</Label>
                        <Select 
                          value={editFormData.employment_status} 
                          onValueChange={(value) => setEditFormData({ ...editFormData, employment_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          placeholder="Add notes about this user's role..."
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateUser}>
                        Update User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove User</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove {user.name} from {business.name}?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleRemoveUser}>
                        Remove User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{user.profile.employee_id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {user.pivot.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{user.pivot.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Role Info */}
            <Card>
              <CardHeader>
                <CardTitle>Role in {business.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.pivot.business_role)}
                  <Badge className={roleColors[user.pivot.business_role as keyof typeof roleColors]}>
                    {user.pivot.business_role}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[user.pivot.employment_status as keyof typeof statusColors]}>
                    {user.pivot.employment_status}
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
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(user.pivot.joined_date)}</p>
                  </div>
                </div>

                {user.pivot.invitation_sent_at && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Invited</p>
                      <p className="font-medium">{formatDateTime(user.pivot.invitation_sent_at)}</p>
                    </div>
                  </div>
                )}

                {user.pivot.invitation_accepted_at && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Accepted</p>
                      <p className="font-medium">{formatDateTime(user.pivot.invitation_accepted_at)}</p>
                    </div>
                  </div>
                )}

                {user.pivot.left_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Left</p>
                      <p className="font-medium text-red-600">{formatDate(user.pivot.left_date)}</p>
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
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Role</span>
                  <span className="text-sm font-medium">{user.profile?.role || 'employee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <span className="text-sm font-medium">{user.profile?.status || 'active'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email Verified</span>
                  <span className="text-sm font-medium">
                    {user.email_verified_at ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
