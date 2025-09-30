import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Attendance {
  id: number;
  uuid: string;
  user_id: number;
  business_id: number;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  regular_units: number | null;
  overtime_units: number | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface User {
  id: number;
  name: string;
  email: string;
  profile: {
    avatar_url: string | null;
  };
}

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  business: Business;
  user: User;
  attendance: {
    data: Attendance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  monthlyStats: {
    total_days: number;
    present_days: number;
    total_hours: number;
  };
  userRole: string;
  canManage: boolean;
}

export default function UserRecords({
  business,
  user,
  attendance,
  monthlyStats,
  userRole,
  canManage,
}: Props) {
  const breadcrumbs = [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: business.name,
      href: `/businesses/${business.slug}`,
    },
    {
      title: 'Attendance',
      href: `/businesses/${business.slug}/attendance`,
    },
    {
      title: `${user.name}'s Records`,
      href: `/businesses/${business.slug}/attendance/user/${user.id}/records`,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    
    // Parse the datetime - data is stored in Malaysia timezone in database
    const date = new Date(time);
    
    // Format the time as stored in the database (Malaysia timezone)
    // No conversion needed since database already stores correct time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Format as "HH:mm" in Malaysia time
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
      <Head title={`${user.name} - Attendance Records - ${business.name}`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/businesses/${business.slug}/attendance`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Attendance
              </Link>
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-muted-foreground">
                  Attendance records for {business.name}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Days</span>
                </div>
                <p className="text-2xl font-bold">{monthlyStats.total_days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Present Days</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{monthlyStats.present_days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(monthlyStats.total_hours)}h {Math.round((monthlyStats.total_hours % 1) * 60)}m
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.data.length > 0 ? (
                <div className="space-y-3">
                  {attendance.data.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Date</div>
                          <div className="font-semibold">
                            {format(new Date(record.work_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Clock In</div>
                          <div className="font-mono">{formatTime(record.start_time)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Clock Out</div>
                          <div className="font-mono">{formatTime(record.end_time)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Hours</div>
                          <div className="font-mono">
                            {record.regular_units 
                              ? `${Math.floor(record.regular_units)}h ${Math.round((record.regular_units % 1) * 60)}m`
                              : '--'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {record.notes && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
                  <p className="text-muted-foreground">
                    No attendance records found for this user.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
