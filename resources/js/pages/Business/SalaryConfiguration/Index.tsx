import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Clock, TrendingUp } from 'lucide-react';
import SalaryRatesTab from './SalaryRatesTab';
import OvertimeRatesTab from './OvertimeRatesTab';

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
  salaryRates: SalaryRate[];
  overtimeRates: OvertimeRate[];
  stats: {
    total_employees: number;
    employees_with_rates: number;
    active_overtime_rates: number;
    total_salary_types: number;
  };
  userRole: string;
  canManage: boolean;
}

export default function SalaryConfiguration({
  business,
  salaryTypes,
  salaryRates,
  overtimeRates,
  stats,
  userRole,
  canManage,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AppLayout>
      <Head title={`${business.name} - Salary Configuration`} />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Salary Configuration</h1>
              <p className="text-muted-foreground">
                Manage salary rates and overtime configurations for {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Employees</span>
              </div>
              <p className="text-2xl font-bold">{stats.total_employees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">With Salary Rates</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.employees_with_rates}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Overtime Rates</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.active_overtime_rates}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Salary Types</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.total_salary_types}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="salary-rates">Salary Rates</TabsTrigger>
            <TabsTrigger value="overtime-rates">Overtime Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Salary Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Salary Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salaryTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Unit: {type.unit} • {type.allows_overtime ? 'Allows Overtime' : 'No Overtime'}
                          </div>
                        </div>
                        <Badge variant="outline">{type.code}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salaryRates.slice(0, 3).map((rate) => (
                      <div key={rate.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{rate.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rate.salaryType.name} • ${rate.base_rate}/{rate.salaryType.unit}
                          </div>
                        </div>
                        <Badge variant={rate.is_active ? "default" : "secondary"}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    {salaryRates.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No recent activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salary-rates">
            <SalaryRatesTab
              business={business}
              salaryTypes={salaryTypes}
              salaryRates={salaryRates}
              canManage={canManage}
            />
          </TabsContent>

          <TabsContent value="overtime-rates">
            <OvertimeRatesTab
              business={business}
              salaryTypes={salaryTypes}
              overtimeRates={overtimeRates}
              canManage={canManage}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
