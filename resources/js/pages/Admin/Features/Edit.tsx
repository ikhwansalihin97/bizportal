import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Settings, Trash2 } from 'lucide-react';
import type { BusinessFeature, BreadcrumbItem } from '@/types';

interface EditFeatureFormData {
    name: string;
    description: string;
    category: string;
    is_active: boolean;
    settings: Record<string, any>;
}

interface AdminFeaturesEditProps {
    feature: BusinessFeature;
}

const categoryOptions = [
    { value: 'general', label: 'General', icon: '⚙️' },
    { value: 'hr', label: 'Human Resources', icon: '👥' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'operations', label: 'Operations', icon: '📦' },
    { value: 'sales', label: 'Sales', icon: '📈' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'it', label: 'Information Technology', icon: '💻' },
    { value: 'legal', label: 'Legal', icon: '⚖️' },
];

export default function AdminFeaturesEdit({ feature }: AdminFeaturesEditProps) {
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin' },
        { title: 'Business Features', href: '/admin/features' },
        { title: feature.name, href: `/admin/features/${feature.id}` },
        { title: 'Edit', href: `/admin/features/${feature.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<EditFeatureFormData>({
        name: feature.name,
        description: feature.description,
        category: feature.category,
        is_active: feature.is_active,
        settings: feature.settings || {},
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/features/${feature.id}`, {
            onSuccess: () => {
                // Redirect will be handled by the controller
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this feature? This action cannot be undone and will affect all businesses using this feature.')) {
            router.delete(`/admin/features/${feature.id}`);
        }
    };

    const handleCategoryChange = (value: string) => {
        setData('category', value);
    };

    const handleSettingChange = (key: string, value: any) => {
        const newSettings = { ...data.settings, [key]: value };
        setData('settings', newSettings);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${feature.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/admin/features/${feature.id}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Feature
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit {feature.name}</h1>
                            <p className="text-muted-foreground">
                                Modify feature settings and configuration
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={processing}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Feature
                    </Button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <Alert variant="destructive">
                        <Trash2 className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p>
                                    <strong>Warning:</strong> Deleting this feature will:
                                </p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Remove it from all businesses currently using it</li>
                                    <li>Delete all feature assignments and settings</li>
                                    <li>This action cannot be undone</li>
                                </ul>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={processing}
                                    >
                                        Yes, Delete Feature
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the core details of your business feature
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Feature Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Attendance Management"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={data.category} onValueChange={handleCategoryChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryOptions.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    <span className="mr-2">{category.icon}</span>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-red-500">{errors.category}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe what this feature does and how it helps businesses..."
                                    rows={4}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Feature is active and available for businesses</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Advanced Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Advanced Settings</CardTitle>
                                    <CardDescription>
                                        Configure feature-specific behavior and options
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    {showAdvancedSettings ? 'Hide' : 'Show'} Settings
                                </Button>
                            </div>
                        </CardHeader>
                        {showAdvancedSettings && (
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="require_approval"
                                            checked={data.settings.require_approval || false}
                                            onCheckedChange={(checked) => handleSettingChange('require_approval', checked)}
                                        />
                                        <Label htmlFor="require_approval">Require approval to enable</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="auto_enable"
                                            checked={data.settings.auto_enable || false}
                                            onCheckedChange={(checked) => handleSettingChange('auto_enable', checked)}
                                        />
                                        <Label htmlFor="auto_enable">Auto-enable for new businesses</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allow_customization"
                                            checked={data.settings.allow_customization !== false}
                                            onCheckedChange={(checked) => handleSettingChange('allow_customization', checked)}
                                        />
                                        <Label htmlFor="allow_customization">Allow customization</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_users">Maximum users</Label>
                                        <Input
                                            id="max_users"
                                            type="number"
                                            value={data.settings.max_users || 100}
                                            onChange={(e) => handleSettingChange('max_users', parseInt(e.target.value))}
                                            min="1"
                                            max="1000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="trial_days">Trial period (days)</Label>
                                        <Input
                                            id="trial_days"
                                            type="number"
                                            value={data.settings.trial_days || 30}
                                            onChange={(e) => handleSettingChange('trial_days', parseInt(e.target.value))}
                                            min="0"
                                            max="365"
                                        />
                                    </div>
                                </div>

                                <Alert>
                                    <Settings className="h-4 w-4" />
                                    <AlertDescription>
                                        These settings can be modified and will apply to all businesses using this feature.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        )}
                    </Card>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between">
                        <Link href={`/admin/features/${feature.id}`}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
