import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BusinessAssignmentModal from '@/components/business-assignment-modal';


import { 
    ArrowLeft, 
    Edit, 
    Settings, 
    Building2, 
    Calendar, 
    CheckCircle, 
    XCircle,
    Clock,
    User
} from 'lucide-react';
import type { BusinessFeature, BusinessFeatureAssignment, BreadcrumbItem } from '@/types';
import { Label } from '@/components/ui/label';

interface BusinessFeatureWithAssignments extends BusinessFeature {
    businesses: BusinessFeatureAssignment[];
}

interface Business {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
}

interface AdminFeaturesShowProps {
    feature: BusinessFeatureWithAssignments;
    businesses: Business[];
}

const categoryColors: Record<string, string> = {
    'hr': 'bg-blue-100 text-blue-800 border-blue-200',
    'finance': 'bg-green-100 text-green-800 border-green-200',
    'general': 'bg-gray-100 text-gray-800 border-gray-200',
    'operations': 'bg-purple-100 text-purple-800 border-purple-200',
    'sales': 'bg-orange-100 text-orange-800 border-orange-200',
    'marketing': 'bg-pink-100 text-pink-800 border-pink-200',
    'it': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'legal': 'bg-red-100 text-red-800 border-red-200',
};

const categoryIcons: Record<string, string> = {
    'hr': '👥',
    'finance': '💰',
    'general': '⚙️',
    'operations': '📦',
    'sales': '📈',
    'marketing': '📢',
    'it': '💻',
    'legal': '⚖️',
};

export default function AdminFeaturesShow({ feature, businesses }: AdminFeaturesShowProps) {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin' },
        { title: 'Business Features', href: '/admin/features' },
        { title: feature.name, href: `/admin/features/${feature.id}` },
    ];

    const handleToggleFeature = async () => {
        try {
            const response = await fetch(`/admin/features/${feature.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ is_active: !feature.is_active }),
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



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={feature.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/features">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Features
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{feature.name}</h1>
                            <p className="text-muted-foreground">
                                Feature details and business assignments
                            </p>
                        </div>
                    </div>
                    <Link href={`/admin/features/${feature.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Feature
                        </Button>
                    </Link>
                </div>

                {/* Feature Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <div className="text-2xl">
                                {categoryIcons[feature.category] || '📁'}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Badge 
                                variant={feature.is_active ? "default" : "secondary"}
                                className="text-sm"
                            >
                                {feature.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                Feature availability
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{feature.businesses.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Business assignments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{feature.businesses.filter(b => b.pivot?.is_enabled).length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active in businesses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Feature Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Information</CardTitle>
                        <CardDescription>
                            Basic details and configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                        variant="outline" 
                                        className={categoryColors[feature.category] || 'bg-gray-100 text-gray-800 border-gray-200'}
                                    >
                                        {categoryIcons[feature.category] || '📁'} {feature.category.charAt(0).toUpperCase() + feature.category.slice(1)}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(feature.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="mt-1 text-sm">{feature.description || 'No description provided.'}</p>
                        </div>

                        {feature.settings && Object.keys(feature.settings).length > 0 && (
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Settings</Label>
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(feature.settings, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>



                {/* Business Assignments Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business Assignments</CardTitle>
                        <CardDescription>
                            Manage which businesses have access to this feature
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {feature.businesses.length === 0 ? (
                            <div className="text-center py-8">
                                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No business assignments</h3>
                                <p className="text-muted-foreground mb-4">
                                    This feature hasn't been assigned to any businesses yet.
                                </p>
                                <Button variant="outline" onClick={() => setIsAssignmentModalOpen(true)}>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Assign to Business
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Business</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Enabled Date</TableHead>
                                        <TableHead>Enabled By</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feature.businesses.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {assignment.name || `Business ${assignment.business_id}`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={assignment.pivot?.is_enabled ? "default" : "secondary"}
                                                >
                                                    {assignment.pivot?.is_enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {assignment.pivot?.enabled_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(assignment.pivot.enabled_at).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {assignment.pivot?.enabled_by_user ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>{assignment.pivot.enabled_by_user.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant={assignment.pivot?.is_enabled ? "outline" : "default"}
                                                    size="sm"
                                                    onClick={() => handleToggleFeature(assignment.pivot?.business_id, assignment.pivot?.is_enabled)}
                                                >
                                                    {assignment.pivot?.is_enabled ? (
                                                        <>
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Disable
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Enable
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Feature Settings Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Settings</CardTitle>
                        <CardDescription>
                            Configuration options for this feature
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(feature.settings || {}).length === 0 ? (
                            <div className="text-center py-8">
                                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No custom settings</h3>
                                <p className="text-muted-foreground">
                                    This feature doesn't have any custom configuration options.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(feature.settings || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <Label className="font-medium capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {typeof value === 'boolean' ? (
                                                <Badge variant={value ? "default" : "secondary"}>
                                                    {value ? 'Yes' : 'No'}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                    {String(value)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Business Assignment Modal */}
            <BusinessAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                feature={feature}
                businesses={businesses}
                existingAssignments={feature.businesses.map(b => ({
                    business_id: b.id,
                    is_enabled: b.pivot?.is_enabled || false,
                    settings: b.pivot?.settings || {}
                }))}
            />
        </AppLayout>
    );
}
