import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, ArrowLeft, Filter, Download } from 'lucide-react';
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
  user: {
    id: number;
    name: string;
    email: string;
    profile: {
      avatar_url: string | null;
    };
  };
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
  attendance: {
    data: Attendance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total_days: number;
    present_days: number;
    pending_days: number;
    total_hours: number;
  };
  filters: {
    start_date: string;
    end_date: string;
    user_id: string;
  };
  users: User[];
  userRole: string;
  canManage: boolean;
}

export default function Report({
  business,
  attendance,
  summary,
  filters,
  users,
  userRole,
  canManage,
}: Props) {
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [selectedUser, setSelectedUser] = useState(filters.user_id);

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
      title: 'Report',
      href: `/businesses/${business.slug}/attendance/report`,
    },
  ];

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (selectedUser) params.append('user_id', selectedUser);
    
    window.location.href = `/businesses/${business.slug}/attendance/report?${params.toString()}`;
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${business.name} - Attendance Report`} />
      
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
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
              <p className="text-muted-foreground">
                View and analyze attendance data for {business.name}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Records</span>
                </div>
                <p className="text-2xl font-bold">{summary.total_days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Present Days</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{summary.present_days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pending Approval</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending_days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(summary.total_hours)}h {Math.round((summary.total_hours % 1) * 60)}m
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {canManage && (
                  <div>
                    <Label htmlFor="user">Employee</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Employees</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-end">
                  <Button onClick={handleFilter} className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Records</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attendance.data.length > 0 ? (
                <div className="space-y-3">
                  {attendance.data.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Employee</div>
                          <div className="font-semibold">{record.user.name}</div>
                        </div>
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
                    No attendance records found for the selected filters.
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
