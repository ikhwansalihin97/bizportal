import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, User, Calculator, Calendar } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import type { BreadcrumbItem } from '@/types';

interface BusinessUser {
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
  businessUsers: BusinessUser[];
}

export default function AttendanceCreate({
  business,
  businessUsers,
}: Props) {
  const [calculatedHours, setCalculatedHours] = useState({
    regular: 0,
    overtime: 0,
    total: 0
  });

  // Define breadcrumbs for navigation
  const breadcrumbs: BreadcrumbItem[] = [
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
      title: 'Create Manual Record',
      href: `/businesses/${business.slug}/attendance/create`,
    },
  ];

  // Helper function to format datetime for datetime-local input
  const formatDateTimeForInput = (dateTimeString: string | null) => {
    if (!dateTimeString) return '';
    
    // Parse the datetime and format for datetime-local input
    // For new records, we'll use the current date/time as default
    const date = new Date(dateTimeString);
    
    // Format the date for datetime-local input in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to format date for date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Get current date in Malaysia timezone for default work date
  const getCurrentDate = () => {
    const now = new Date();
    // Adjust to Malaysia timezone (UTC+8)
    const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return formatDateForInput(malaysiaTime.toISOString());
  };

  const { data, setData, post, processing, errors } = useForm({
    user_id: '',
    work_date: getCurrentDate(),
    start_time: '',
    end_time: '',
    notes: '',
    status: 'pending',
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
    
    // Submit the form - hours will be calculated automatically on the backend
    post(`/businesses/${business.slug}/attendance`);
  };

  const handleCancel = () => {
    router.get(`/businesses/${business.slug}/attendance`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Manual Attendance Record" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Attendance
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Manual Attendance Record</h1>
                <p className="text-gray-600">Add a new attendance record for any employee</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="text-sm font-medium">
                      Employee <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={data.user_id}
                      onValueChange={(value) => setData('user_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {user.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.user_id && (
                      <p className="text-sm text-red-600">{errors.user_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="work_date" className="text-sm font-medium">
                      Work Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="work_date"
                      type="date"
                      value={data.work_date}
                      onChange={(e) => setData('work_date', e.target.value)}
                      className="w-full"
                    />
                    {errors.work_date && (
                      <p className="text-sm text-red-600">{errors.work_date}</p>
                    )}
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_time" className="text-sm font-medium">
                      Start Time
                    </Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={data.start_time}
                      onChange={(e) => setData('start_time', e.target.value)}
                      className="w-full"
                    />
                    {errors.start_time && (
                      <p className="text-sm text-red-600">{errors.start_time}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time" className="text-sm font-medium">
                      End Time
                    </Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={data.end_time}
                      onChange={(e) => setData('end_time', e.target.value)}
                      className="w-full"
                    />
                    {errors.end_time && (
                      <p className="text-sm text-red-600">{errors.end_time}</p>
                    )}
                  </div>
                </div>

                {/* Calculated Hours Display */}
                {(data.start_time && data.end_time && calculatedHours.total > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Calculated Hours</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-blue-600">Regular Hours</div>
                        <div className="text-lg font-semibold text-blue-900">{calculatedHours.regular}h</div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-600">Overtime Hours</div>
                        <div className="text-lg font-semibold text-blue-900">{calculatedHours.overtime}h</div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-600">Total Hours</div>
                        <div className="text-lg font-semibold text-blue-900">{calculatedHours.total}h</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value as 'pending' | 'approved' | 'rejected')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          {getStatusBadge('pending')}
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          {getStatusBadge('approved')}
                          Approved
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          {getStatusBadge('rejected')}
                          Rejected
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Add any additional notes about this attendance record..."
                    className="w-full"
                    rows={3}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing || !data.user_id || !data.work_date}
                  >
                    {processing ? 'Creating...' : 'Create Attendance Record'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
