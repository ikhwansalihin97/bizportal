import React, { useState } from 'react';
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
import { ArrowLeft, Save, Settings } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

interface CreateFeatureFormData {
    name: string;
    description: string;
    category: string;
    is_active: boolean;
    settings: Record<string, any>;
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

const defaultSettings = {
    require_approval: false,
    auto_enable: false,
    allow_customization: true,
    max_users: 100,
    trial_days: 30,
};

export default function AdminFeaturesCreate() {
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [customSettings, setCustomSettings] = useState<Record<string, any>>(defaultSettings);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin' },
        { title: 'Business Features', href: '/admin/features' },
        { title: 'Create Feature', href: '/admin/features/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<CreateFeatureFormData>({
        name: '',
        description: '',
        category: 'general',
        is_active: true,
        settings: defaultSettings,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/features', {
            onSuccess: () => {
                // Redirect will be handled by the controller
            },
        });
    };

    const handleCategoryChange = (value: string) => {
        setData('category', value);
        // Update default settings based on category
        if (value === 'hr') {
            setData('settings', { ...customSettings, require_approval: true, max_users: 50 });
        } else if (value === 'finance') {
            setData('settings', { ...customSettings, require_approval: true, auto_enable: false });
        } else if (value === 'sales') {
            setData('settings', { ...customSettings, trial_days: 14, allow_customization: true });
        } else {
            setData('settings', customSettings);
        }
    };

    const handleSettingChange = (key: string, value: any) => {
        const newSettings = { ...data.settings, [key]: value };
        setData('settings', newSettings);
        setCustomSettings(newSettings);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Business Feature" />

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
                            <h1 className="text-3xl font-bold tracking-tight">Create Business Feature</h1>
                            <p className="text-muted-foreground">
                                Add a new feature that businesses can enable
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Define the core details of your business feature
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
                                            checked={data.settings.require_approval}
                                            onCheckedChange={(checked) => handleSettingChange('require_approval', checked)}
                                        />
                                        <Label htmlFor="require_approval">Require approval to enable</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="auto_enable"
                                            checked={data.settings.auto_enable}
                                            onCheckedChange={(checked) => handleSettingChange('auto_enable', checked)}
                                        />
                                        <Label htmlFor="auto_enable">Auto-enable for new businesses</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allow_customization"
                                            checked={data.settings.allow_customization}
                                            onCheckedChange={(checked) => handleSettingChange('allow_customization', checked)}
                                        />
                                        <Label htmlFor="allow_customization">Allow customization</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_users">Maximum users</Label>
                                        <Input
                                            id="max_users"
                                            type="number"
                                            value={data.settings.max_users}
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
                                            value={data.settings.trial_days}
                                            onChange={(e) => handleSettingChange('trial_days', parseInt(e.target.value))}
                                            min="0"
                                            max="365"
                                        />
                                    </div>
                                </div>

                                <Alert>
                                    <Settings className="h-4 w-4" />
                                    <AlertDescription>
                                        These settings can be modified later and will apply to all businesses using this feature.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        )}
                    </Card>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between">
                        <Link href="/admin/features">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Feature'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
