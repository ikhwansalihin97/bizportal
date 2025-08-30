import React, { useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Search, Filter, MoreHorizontal, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessFeature, AdminFeaturesIndexProps, BreadcrumbItem } from '@/types';

const categoryColors: Record<string, string> = {
    'hr': 'bg-blue-100 text-blue-800 border-blue-200',
    'finance': 'bg-green-100 text-green-800 border-green-200',
    'general': 'bg-gray-100 text-gray-800 border-gray-200',
    'operations': 'bg-purple-100 text-purple-800 border-purple-200',
    'sales': 'bg-orange-100 text-orange-800 border-orange-200',
};

const categoryIcons: Record<string, string> = {
    'hr': '👥',
    'finance': '💰',
    'general': '⚙️',
    'operations': '📦',
    'sales': '📈',
};

export default function AdminFeaturesIndex({ features }: AdminFeaturesIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);

    // Breadcrumbs for consistent navigation
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin' },
        { title: 'Business Features', href: '/admin/features' },
    ];

    // Filter features based on search and category
    const filteredFeatures = features.filter(feature => {
        const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            feature.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get unique categories for filter dropdown
    const categories = ['all', ...Array.from(new Set(features.map(f => f.category)))];

    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    const handleCategoryChange = useCallback((value: string) => {
        setSelectedCategory(value);
    }, []);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedCategory('all');
    }, []);

    const handleToggleFeature = async (featureId: number, isActive: boolean) => {
        try {
            const response = await fetch(`/admin/features/${featureId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ is_active: isActive }),
            });

            if (response.ok) {
                // Refresh the page to show updated status
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to toggle feature');
            }
        } catch (error) {
            console.error('Error toggling feature:', error);
            alert('Failed to toggle feature');
        }
    };

    const handleDeleteFeature = async (featureId: number) => {
        if (!confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/admin/features/${featureId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                // Refresh the page to show updated list
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete feature');
            }
        } catch (error) {
            console.error('Error deleting feature:', error);
            alert('Failed to delete feature');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Business Features" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Features</h1>
                        <p className="text-muted-foreground">
                            Manage and configure business features for your platform
                        </p>
                    </div>
                    <Link href="/admin/features/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Feature
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{features.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Available for businesses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {features.filter(f => f.is_active).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Currently enabled
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {features.reduce((sum, f) => sum + f.businesses_count, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Business assignments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enabled Assignments</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {features.reduce((sum, f) => sum + f.enabled_businesses_count, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active in businesses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Search and filter features by name, description, or category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search features..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category === 'all' ? 'All Categories' : 
                                             `${categoryIcons[category] || '📁'} ${category.charAt(0).toUpperCase() + category.slice(1)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="w-full sm:w-auto"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Features List */}
                <div className="space-y-4">
                    {filteredFeatures.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No features found</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    {searchTerm || selectedCategory !== 'all' 
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'Get started by creating your first business feature.'}
                                </p>
                                {!searchTerm && selectedCategory === 'all' && (
                                    <Link href="/admin/features/create">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Feature
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredFeatures.map((feature) => (
                            <Card key={feature.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">
                                                    {categoryIcons[feature.category] || '📁'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">{feature.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={categoryColors[feature.category] || 'bg-gray-100 text-gray-800 border-gray-200'}
                                                        >
                                                            {feature.category.charAt(0).toUpperCase() + feature.category.slice(1)}
                                                        </Badge>
                                                        <Badge 
                                                            variant={feature.is_active ? "default" : "secondary"}
                                                        >
                                                            {feature.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-muted-foreground">
                                                {feature.description}
                                            </p>

                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                <span>
                                                    📊 {feature.businesses_count} total assignments
                                                </span>
                                                <span>
                                                    ✅ {feature.enabled_businesses_count} enabled
                                                </span>
                                                <span>
                                                    📅 Updated {new Date(feature.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/features/${feature.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/features/${feature.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Feature
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleToggleFeature(feature.id, !feature.is_active)}
                                                    disabled={isLoading}
                                                >
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    {feature.is_active ? 'Disable' : 'Enable'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteFeature(feature.id)}
                                                    disabled={isLoading}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-8 w-8 rounded" />
                                                <div>
                                                    <Skeleton className="h-6 w-48" />
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Skeleton className="h-5 w-20" />
                                                        <Skeleton className="h-5 w-16" />
                                                    </div>
                                                </div>
                                            </div>
                                            <Skeleton className="h-4 w-96" />
                                            <div className="flex items-center gap-6">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-28" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
