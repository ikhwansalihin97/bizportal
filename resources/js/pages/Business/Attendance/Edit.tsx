import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, User } from 'lucide-react';
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
  const { data, setData, put, processing, errors } = useForm({
    start_time: attendance.start_time ? format(new Date(attendance.start_time), 'yyyy-MM-dd\'T\'HH:mm') : '',
    end_time: attendance.end_time ? format(new Date(attendance.end_time), 'yyyy-MM-dd\'T\'HH:mm') : '',
    regular_units: attendance.regular_units?.toString() || '',
    overtime_units: attendance.overtime_units?.toString() || '',
    notes: attendance.notes || '',
    status: attendance.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/businesses/${business.slug}/attendance/records/${attendance.uuid}`);
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Not set';
    return format(new Date(time), 'HH:mm');
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
    <AppLayout>
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
                {isOwnRecord ? 'Edit your attendance record' : `Edit attendance for ${attendance.user.name}`}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regular_units">Regular Hours</Label>
                      <Input
                        id="regular_units"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.regular_units}
                        onChange={(e) => setData('regular_units', e.target.value)}
                        placeholder="8.00"
                        className={errors.regular_units ? 'border-red-500' : ''}
                      />
                      {errors.regular_units && (
                        <p className="text-sm text-red-500 mt-1">{errors.regular_units}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="overtime_units">Overtime Hours</Label>
                      <Input
                        id="overtime_units"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.overtime_units}
                        onChange={(e) => setData('overtime_units', e.target.value)}
                        placeholder="0.00"
                        className={errors.overtime_units ? 'border-red-500' : ''}
                      />
                      {errors.overtime_units && (
                        <p className="text-sm text-red-500 mt-1">{errors.overtime_units}</p>
                      )}
                    </div>
                  </div>

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
                    <span className="font-medium">{format(new Date(attendance.work_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Time:</span>
                    <span className="font-medium">{formatTime(attendance.start_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End Time:</span>
                    <span className="font-medium">{formatTime(attendance.end_time)}</span>
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
