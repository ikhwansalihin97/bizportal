import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Users, Calendar, TrendingUp, User, CheckCircle, XCircle, AlertCircle, Hourglass } from 'lucide-react';
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
  break_times: any[] | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user: {
    id: number;
    name: string;
    email: string;
    profile: {
      avatar_url: string | null;
    };
  };
}

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  business: Business;
  isBusinessMember: boolean;
  todayAttendance: Attendance[];
  currentUserAttendance: Attendance | null;
  stats: {
    total_employees: number;
    present_today: number;
    absent_today: number;
    pending_approval: number;
  };
  recentAttendance: Record<string, Attendance[]>;
  userRole: string;
  canManage: boolean;
}

export default function AttendanceIndex({
  business,
  isBusinessMember,
  todayAttendance,
  currentUserAttendance,
  stats,
  recentAttendance,
  userRole,
  canManage,
}: Props) {
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    setIsClockingIn(true);
    try {
      const response = await fetch(`/businesses/${business.slug}/attendance/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to clock in');
      }
    } catch (error) {
      alert('Failed to clock in');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setIsClockingOut(true);
    try {
      const response = await fetch(`/businesses/${business.slug}/attendance/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          notes: clockOutNotes,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to clock out');
      }
    } catch (error) {
      alert('Failed to clock out');
    } finally {
      setIsClockingOut(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Hourglass className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

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
    return format(new Date(time), 'HH:mm');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isBusinessMember) {
    return (
      <AppLayout>
        <Head title={`${business.name} - Attendance`} />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need to be a member of this business to access attendance features.
            </p>
            <Button asChild>
              <Link href={`/businesses/${business.slug}`}>
                Back to Business Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title={`${business.name} - Attendance`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">
                  Track and manage attendance for {business.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Current Time</div>
                <div className="text-lg font-mono font-semibold">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Employees</span>
                </div>
                <p className="text-2xl font-bold">{stats.total_employees}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Present Today</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.present_today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Absent Today</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.absent_today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pending Approval</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_approval}</p>
              </CardContent>
            </Card>
          </div>

          {/* Clock In/Out Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Attendance Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUserAttendance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Clock In</div>
                      <div className="text-lg font-semibold">
                        {formatTime(currentUserAttendance.start_time)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Clock Out</div>
                      <div className="text-lg font-semibold">
                        {formatTime(currentUserAttendance.end_time)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                      <div className="text-lg font-semibold">
                        {currentUserAttendance.total_hours_formatted}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex justify-center mt-1">
                        {getStatusBadge(currentUserAttendance.status)}
                      </div>
                    </div>
                  </div>
                  
                  {!currentUserAttendance.end_time && (
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={handleClockOut}
                        disabled={isClockingOut}
                        className="flex-1"
                      >
                        {isClockingOut ? 'Clocking Out...' : 'Clock Out'}
                      </Button>
                      <input
                        type="text"
                        placeholder="Add notes (optional)"
                        value={clockOutNotes}
                        onChange={(e) => setClockOutNotes(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Not Clocked In Today</h3>
                  <p className="text-muted-foreground mb-4">
                    Click the button below to start your work day
                  </p>
                  <Button 
                    onClick={handleClockIn}
                    disabled={isClockingIn}
                    size="lg"
                  >
                    {isClockingIn ? 'Clocking In...' : 'Clock In'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Attendance ({format(new Date(), 'EEEE, MMMM d, yyyy')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance.length > 0 ? (
                <div className="space-y-3">
                  {todayAttendance.map((attendance) => (
                    <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(attendance.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{attendance.user.name}</div>
                          <div className="text-sm text-muted-foreground">{attendance.user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">In</div>
                          <div className="font-mono">{formatTime(attendance.start_time)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Out</div>
                          <div className="font-mono">{formatTime(attendance.end_time)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Hours</div>
                          <div className="font-mono">
                            {attendance.total_hours_formatted}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attendance.status)}
                          {getStatusBadge(attendance.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Attendance Records Today</h3>
                  <p className="text-muted-foreground">
                    No one has clocked in yet today
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/businesses/${business.slug}/attendance/report`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Reports
              </Link>
            </Button>
            {canManage && (
              <Button asChild variant="outline">
                <Link href={`/businesses/${business.slug}/users`}>
                  <User className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
