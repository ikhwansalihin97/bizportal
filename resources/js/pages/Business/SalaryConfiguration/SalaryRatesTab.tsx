import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface SalaryType {
  id: number;
  uuid: string;
  name: string;
  code: string;
  unit: string;
  description: string | null;
  allows_overtime: boolean;
}

interface SalaryRate {
  id: number;
  uuid: string;
  user_id: number;
  business_id: number;
  salary_type_id: number;
  base_rate: number;
  additional_rates: any[] | null;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  notes: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    profile: {
      avatar_url: string | null;
    };
  };
  salaryType: SalaryType;
}

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  business: Business;
  salaryTypes: SalaryType[];
  salaryRates: SalaryRate[];
  canManage: boolean;
}

export default function SalaryRatesTab({
  business,
  salaryTypes,
  salaryRates,
  canManage,
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Salary Rates</h2>
          <p className="text-muted-foreground">
            Manage individual salary rates for employees
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Salary Rate
          </Button>
        )}
      </div>

      {/* Salary Rates List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Salary Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {salaryRates.length > 0 ? (
            <div className="space-y-4">
              {salaryRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(rate.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{rate.user.name}</div>
                      <div className="text-sm text-muted-foreground">{rate.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Salary Type</div>
                      <div className="font-semibold">{rate.salaryType.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Base Rate</div>
                      <div className="font-semibold">
                        {formatCurrency(rate.base_rate)}/{rate.salaryType.unit}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Effective From</div>
                      <div className="font-semibold">
                        {format(new Date(rate.effective_from), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex justify-center mt-1">
                        {rate.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Salary Rates</h3>
              <p className="text-muted-foreground mb-4">
                No salary rates have been configured yet.
              </p>
              {canManage && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Salary Rate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
