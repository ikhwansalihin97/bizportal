import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';

interface SalaryType {
  id: number;
  uuid: string;
  name: string;
  code: string;
  unit: string;
  description: string | null;
  allows_overtime: boolean;
}

interface OvertimeRate {
  id: number;
  uuid: string;
  business_id: number;
  salary_type_id: number;
  name: string;
  code: string;
  rate_type: 'multiplier' | 'fixed';
  multiplier: number | null;
  fixed_rate: number | null;
  conditions: any[] | null;
  description: string | null;
  is_active: boolean;
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
  overtimeRates: OvertimeRate[];
  canManage: boolean;
}

export default function OvertimeRatesTab({
  business,
  salaryTypes,
  overtimeRates,
  canManage,
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRate = (rate: OvertimeRate) => {
    if (rate.rate_type === 'multiplier' && rate.multiplier) {
      return `${rate.multiplier}x`;
    } else if (rate.rate_type === 'fixed' && rate.fixed_rate) {
      return formatCurrency(rate.fixed_rate);
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Overtime Rates</h2>
          <p className="text-muted-foreground">
            Configure overtime rates for different salary types
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Overtime Rate
          </Button>
        )}
      </div>

      {/* Overtime Rates List */}
      <Card>
        <CardHeader>
          <CardTitle>Overtime Rate Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {overtimeRates.length > 0 ? (
            <div className="space-y-4">
              {overtimeRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{rate.name}</div>
                      <div className="text-sm text-muted-foreground">{rate.code}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Salary Type</div>
                      <div className="font-semibold">{rate.salaryType.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Rate Type</div>
                      <div className="font-semibold capitalize">{rate.rate_type}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Rate</div>
                      <div className="font-semibold">{formatRate(rate)}</div>
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
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Overtime Rates</h3>
              <p className="text-muted-foreground mb-4">
                No overtime rates have been configured yet.
              </p>
              {canManage && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Overtime Rate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
