import React, { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BusinessCard } from './business-card';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { 
  Business, 
  BusinessFilters, 
  PaginatedResponse,
  BusinessRole,
  Industry
} from '@/types';
import { INDUSTRIES, SUBSCRIPTION_PLANS } from '@/types';
import businessApi from '@/services/businessApi';

interface BusinessListProps {
  initialBusinesses: PaginatedResponse<Business>;
  userRole?: BusinessRole;
  canCreateBusiness?: boolean;
  filters?: BusinessFilters;
}

type ViewMode = 'grid' | 'list';

export function BusinessList({
  initialBusinesses,
  userRole,
  canCreateBusiness = false,
  filters: initialFilters = {},
}: BusinessListProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<BusinessFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      updateFilters({ search: query });
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  const updateFilters = useCallback(async (newFilters: Partial<BusinessFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Remove empty values
    Object.keys(updatedFilters).forEach(key => {
      const value = updatedFilters[key as keyof BusinessFilters];
      if (value === '' || value === undefined) {
        delete updatedFilters[key as keyof BusinessFilters];
      }
    });

    setFilters(updatedFilters);
    setLoading(true);

    try {
      const response = await businessApi.getBusinesses(updatedFilters);
      setBusinesses(response);
      
      // Update URL params
      const params = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const url = params.toString() 
        ? `/businesses?${params.toString()}`
        : '/businesses';
      
      router.visit(url, { 
        preserveState: true, 
        preserveScroll: true,
        only: ['businesses']
      });
    } catch (error) {
      console.error('Failed to update businesses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const clearFilters = async () => {
    setSearchQuery('');
    const clearedFilters = {};
    setFilters(clearedFilters);
    
    setLoading(true);
    
    try {
      // Call API with no filters
      const response = await businessApi.getBusinesses({});
      setBusinesses(response);
      
      // Update URL to remove all query parameters
      router.visit('/businesses', { 
        preserveState: true, 
        preserveScroll: true,
        only: ['businesses']
      });
    } catch (error) {
      console.error('Failed to clear filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (business: Business) => {
    businessApi.visitBusinessEdit(business.slug);
  };

  const handleDelete = async (business: Business) => {
    if (!confirm(`Are you sure you want to delete "${business.name}"?`)) {
      return;
    }

    try {
      await businessApi.deleteBusiness(business.slug);
      // Refresh the list
      updateFilters(filters);
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('Failed to delete business. Please try again.');
    }
  };

  const handleViewUsers = (business: Business) => {
    businessApi.visitBusinessUsers(business.slug);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== ''
  ).length;

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground">
            Manage and view your business accounts
          </p>
        </div>
        {canCreateBusiness && (
          <Button asChild>
            <a href="/businesses/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Business
            </a>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Industry Filter */}
          <Select
            value={filters.industry || 'all'}
            onValueChange={(value) => updateFilters({ industry: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : (value as any) })}
          >
            <SelectTrigger className="w-full lg:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Subscription Plan Filter */}
          <Select
            value={filters.subscription_plan || 'all'}
            onValueChange={(value) => updateFilters({ subscription_plan: value === 'all' ? undefined : (value as any) })}
          >
            <SelectTrigger className="w-full lg:w-32">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {Object.entries(SUBSCRIPTION_PLANS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setSearchQuery('');
                      updateFilters({ search: undefined });
                    }}
                  />
                </Badge>
              )}
              {filters.industry && (
                <Badge variant="secondary" className="gap-1">
                  Industry: {filters.industry}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ industry: undefined })}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ status: undefined })}
                  />
                </Badge>
              )}
              {filters.subscription_plan && (
                <Badge variant="secondary" className="gap-1">
                  Plan: {SUBSCRIPTION_PLANS[filters.subscription_plan]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ subscription_plan: undefined })}
                  />
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </Card>

      {/* Results */}
      <div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : businesses.data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {activeFiltersCount > 0 ? 'No businesses found matching your filters.' : 'No businesses found.'}
            </div>
            {canCreateBusiness && (
              <Button asChild>
                <a href="/businesses/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Business
                </a>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Showing {businesses.from}-{businesses.to} of {businesses.total} businesses
              </div>
            </div>

            {/* Business Grid/List */}
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {businesses.data.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  userRole={userRole}
                  canManage={userRole === 'owner' || userRole === 'admin'}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewUsers={handleViewUsers}
                />
              ))}
            </div>

            {/* Pagination */}
            {businesses.last_page > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  {businesses.links.map((link, index) => (
                    <Button
                      key={index}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      disabled={!link.url}
                      onClick={() => {
                        if (link.url) {
                          const url = new URL(link.url);
                          const page = url.searchParams.get('page');
                          updateFilters({ ...filters, per_page: businesses.per_page });
                          router.visit(`${url.pathname}${url.search}`, {
                            preserveState: true,
                            preserveScroll: true,
                          });
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
