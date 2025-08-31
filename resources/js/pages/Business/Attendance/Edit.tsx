import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, User, Calculator } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import type { BreadcrumbItem } from '@/types';

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
  };
}

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  business: Business;
  attendance: Attendance;
  canManage: boolean;
  isOwnRecord: boolean;
}

export default function AttendanceEdit({
  business,
  attendance,
  canManage,
  isOwnRecord,
}: Props) {
  const [calculatedHours, setCalculatedHours] = useState({
    regular: 0,
    overtime: 0,
    total: 0
  });

  // Define breadcrumbs for navigation
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
      title: 'Edit Record',
      href: `/businesses/${business.slug}/attendance/records/${attendance.uuid}/edit`,
    },
  ];

  // Helper function to format datetime for datetime-local input
  const formatDateTimeForInput = (dateTimeString: string | null) => {
    if (!dateTimeString) return '';
    
    // Parse the datetime and format for datetime-local input
    // Database stores times in Malaysia timezone, so we show them as-is
    const date = new Date(dateTimeString);
    
    // Format the date for datetime-local input in local timezone
    // This ensures the input shows the same time as stored in the database
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to format time for display (showing database values directly)
  const formatTimeForDisplay = (dateTimeString: string | null) => {
    if (!dateTimeString) return 'Not set';
    
    // Parse the datetime and show as stored in database (Malaysia time)
    const date = new Date(dateTimeString);
    return format(date, 'MMM dd, HH:mm');
  };

  // Helper function to format date for display (work date)
  const formatDateForDisplay = (dateString: string) => {
    // Parse the date and display as stored
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const { data, setData, put, processing, errors } = useForm({
    start_time: formatDateTimeForInput(attendance.start_time),
    end_time: formatDateTimeForInput(attendance.end_time),
    notes: attendance.notes || '',
    status: attendance.status,
  });

  // Calculate hours when start or end time changes
  useEffect(() => {
    if (data.start_time && data.end_time) {
      const startTime = parseISO(data.start_time);
      const endTime = parseISO(data.end_time);
      
      if (startTime < endTime) {
        const totalMinutes = differenceInMinutes(endTime, startTime);
        const totalHours = totalMinutes / 60;
        
        // Assuming 8 hours is regular time, anything over is overtime
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);
        
        setCalculatedHours({
          regular: Math.round(regularHours * 100) / 100,
          overtime: Math.round(overtimeHours * 100) / 100,
          total: Math.round(totalHours * 100) / 100
        });
      } else {
        setCalculatedHours({ regular: 0, overtime: 0, total: 0 });
      }
    } else {
      setCalculatedHours({ regular: 0, overtime: 0, total: 0 });
    }
  }, [data.start_time, data.end_time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit the form with start_time, end_time, notes, and status
    // Hours will be calculated automatically on the backend
    put(`/businesses/${business.slug}/attendance/records/${attendance.uuid}`);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Attendance - ${business.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" size="sm" asChild>
              <a href={`/businesses/${business.slug}/attendance`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Attendance
              </a>
            </Button>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Attendance Record</h1>
              <p className="text-muted-foreground">
                Edit attendance record for {attendance.user.name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Attendance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={data.start_time}
                        onChange={(e) => setData('start_time', e.target.value)}
                        className={errors.start_time ? 'border-red-500' : ''}
                      />
                      {errors.start_time && (
                        <p className="text-sm text-red-500 mt-1">{errors.start_time}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="datetime-local"
                        value={data.end_time}
                        onChange={(e) => setData('end_time', e.target.value)}
                        className={errors.end_time ? 'border-red-500' : ''}
                      />
                      {errors.end_time && (
                        <p className="text-sm text-red-500 mt-1">{errors.end_time}</p>
                      )}
                    </div>
                  </div>

                  {/* Calculated Hours Display */}
                  {(data.start_time && data.end_time) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Calculated Hours</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{calculatedHours.regular}h</div>
                          <div className="text-blue-500">Regular</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{calculatedHours.overtime}h</div>
                          <div className="text-blue-500">Overtime</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{calculatedHours.total}h</div>
                          <div className="text-blue-500">Total</div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        Based on 8-hour regular workday
                      </p>
                    </div>
                  )}

                  {canManage && (
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-red-500 mt-1">{errors.status}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Add any notes about this attendance record..."
                      rows={3}
                      className={errors.notes ? 'border-red-500' : ''}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={processing}>
                      {processing ? 'Updating...' : 'Update Attendance'}
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/businesses/${business.slug}/attendance`}>
                        Cancel
                      </a>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{attendance.user.name}</div>
                    <div className="text-sm text-muted-foreground">{attendance.user.email}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDateForDisplay(attendance.work_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Time:</span>
                    <span className="font-medium">{formatTimeForDisplay(attendance.start_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End Time:</span>
                    <span className="font-medium">{formatTimeForDisplay(attendance.end_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(attendance.status)}
                  </div>
                </div>

                {attendance.notes && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Notes:</div>
                    <div className="text-sm bg-gray-50 p-2 rounded border">
                      {attendance.notes}
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
