import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, TrendingUp, Filter, Download, ArrowLeft, Users } from 'lucide-react';
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
  user?: {
    id: number;
    name: string;
    email: string;
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
  filters: {
    start_date: string;
    end_date: string;
    status: string;
    user_id?: string;
  };
  summary: {
    total_days: number;
    present_days: number;
    approved_days: number;
    pending_days: number;
    total_hours: number;
    average_hours_per_day: number;
    total_records: number;
    records_per_day: number;
  };
  users?: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  canManageUsers?: boolean;
  selectedUser?: {
    id: number;
    name: string;
    email: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    isSuperAdmin?: boolean;
    permissions?: string[];
  };
}

export default function MyAttendance({
  business,
  attendance,
  filters,
  summary,
  users,
  canManageUsers,
  selectedUser,
  user,
}: Props) {
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  // Default to "me" (current user's records) instead of empty string
  const [selectedUserId, setSelectedUserId] = useState(filters.user_id || 'me');

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
      title: selectedUser ? `${selectedUser.name}'s Records` : 'My Attendance Records',
      href: `/businesses/${business.slug}/attendance/my-records`,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const formatTotalHours = (attendance: Attendance) => {
    const regularUnits = parseFloat(attendance.regular_units as string) || 0;
    const overtimeUnits = parseFloat(attendance.overtime_units as string) || 0;
    
    if (regularUnits === 0 && overtimeUnits === 0) {
      return '--:--';
    }
    
    const totalHours = regularUnits + overtimeUnits;
    
    if (isNaN(totalHours) || totalHours < 0) {
      return '--:--';
    }
    
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const getEmployeeName = (record: Attendance) => {
    if (record.user?.name) {
      return record.user.name;
    }
    // Fallback if user info is not loaded
    return `User ${record.user_id}`;
  };

  const shouldShowEmployeeColumn = () => {
    // Show employee column when viewing all employees or when user_id is not 'me'
    return filters.user_id && filters.user_id !== 'me';
  };

  const canViewAllEmployees = () => {
    // Only superadmins and users with attendances.view permission can see employee filter
    return canManageUsers && (user?.isSuperAdmin || user?.permissions?.includes('attendances.view'));
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    // Only send user_id if it's not "me" (current user's records)
    if (selectedUserId && selectedUserId !== 'me') params.set('user_id', selectedUserId);

    const queryString = params.toString();
    const url = queryString ? 
      `/businesses/${business.slug}/attendance/my-records?${queryString}` : 
      `/businesses/${business.slug}/attendance/my-records`;
      
    router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSelectedUserId('me');
    // Reset to current user's records (no user_id parameter)
    router.get(`/businesses/${business.slug}/attendance/my-records`, {}, { preserveState: true });
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export functionality
    alert('CSV export functionality coming soon!');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${selectedUser ? `${selectedUser.name}'s Attendance` : 'All Employees Attendance'} - ${business.name}`} />
      
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
              <h1 className="text-2xl font-bold tracking-tight">
                {selectedUser ? `${selectedUser.name}'s Attendance Records` : 'My Attendance Records'}
              </h1>
              <p className="text-muted-foreground">
                {selectedUser 
                  ? `Monitor attendance records for ${selectedUser.name} in ${business.name}`
                  : `Monitor your personal attendance records for ${business.name}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Days</span>
              </div>
              <p className="text-2xl font-bold">{summary.total_days}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.total_records} records ({summary.records_per_day} per day)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Present Days</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.present_days}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Days with clock-in records
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.floor(summary.total_hours)}h {Math.round((summary.total_hours % 1) * 60)}m
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across all records
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Avg/Day</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {Math.floor(summary.average_hours_per_day)}h {Math.round((summary.average_hours_per_day % 1) * 60)}m
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Per present day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Count Indicator for All Employees View */}
        {filters.user_id === 'all' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="h-5 w-5" />
                <span className="font-medium">
                  Viewing attendance records for all employees ({attendance.total} total records)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Employee Filter - Only show for superadmins and users with attendances.view permission */}
              {canViewAllEmployees() && (
                <div className="space-y-2">
                  <Label htmlFor="employee-filter">Employee</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="employee-filter">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me">My Records (Personal)</SelectItem>
                      <SelectItem value="all">All Employees</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Choose whose attendance records to view
                  </p>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.data.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
                <p className="text-muted-foreground">
                  {filters.start_date || filters.end_date || filters.status !== 'all' || (filters.user_id && filters.user_id !== 'me')
                    ? 'Try adjusting your filters or date range.'
                    : 'You haven\'t clocked in yet for the selected period.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {shouldShowEmployeeColumn() ? (
                        <th className="text-left p-3 font-medium">Employee</th>
                      ) : null}
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Start Time</th>
                      <th className="text-left p-3 font-medium">End Time</th>
                      <th className="text-left p-3 font-medium">Total Hours</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.data.map((record) => (
                      <tr key={record.uuid} className="border-b hover:bg-gray-50">
                        {shouldShowEmployeeColumn() ? (
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                                {getInitials(getEmployeeName(record))}
                              </div>
                              <span className="font-medium">{getEmployeeName(record)}</span>
                            </div>
                          </td>
                        ) : null}
                        <td className="p-3">{formatDate(record.work_date)}</td>
                        <td className="p-3">{formatTime(record.start_time)}</td>
                        <td className="p-3">{formatTime(record.end_time)}</td>
                        <td className="p-3">{formatTotalHours(record)}</td>
                        <td className="p-3">{getStatusBadge(record.status)}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {attendance.last_page > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((attendance.current_page - 1) * attendance.per_page) + 1} to{' '}
                  {Math.min(attendance.current_page * attendance.per_page, attendance.total)} of{' '}
                  {attendance.total} results
                </div>
                <div className="flex gap-2">
                  {attendance.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(`/businesses/${business.slug}/attendance/my-records?page=${attendance.current_page - 1}`, {}, { preserveState: true })}
                    >
                      Previous
                    </Button>
                  )}
                  {attendance.current_page < attendance.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(`/businesses/${business.slug}/attendance/my-records?page=${attendance.current_page + 1}`, {}, { preserveState: true })}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
