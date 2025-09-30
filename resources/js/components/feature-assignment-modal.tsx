import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Search, 
    Building2, 
    CheckCircle, 
    XCircle, 
    Loader2,
    Users,
    Settings
} from 'lucide-react';

interface Business {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
}

interface FeatureAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: {
        id: number;
        name: string;
        description?: string;
        settings?: Record<string, any>;
    };
    businesses: Business[];
    existingAssignments: Array<{
        business_id: number;
        is_enabled: boolean;
        settings?: Record<string, any>;
    }>;
}

export default function FeatureAssignmentModal({
    isOpen,
    onClose,
    feature,
    businesses,
    existingAssignments
}: FeatureAssignmentModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [assignments, setAssignments] = useState<Record<number, {
        is_enabled: boolean;
        settings: Record<string, any>;
    }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize assignments from existing data
    useEffect(() => {
        const initialAssignments: Record<number, { is_enabled: boolean; settings: Record<string, any> }> = {};
        
        businesses.forEach(business => {
            const existing = existingAssignments.find(a => a.business_id === business.id);
            initialAssignments[business.id] = {
                is_enabled: existing?.is_enabled ?? false,
                settings: existing?.settings ?? feature.settings ?? {}
            };
        });
        
        setAssignments(initialAssignments);
    }, [businesses, existingAssignments, feature.settings]);

    // Filter businesses based on search
    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleAssignment = (businessId: number) => {
        setAssignments(prev => ({
            ...prev,
            [businessId]: {
                ...prev[businessId],
                is_enabled: !prev[businessId]?.is_enabled
            }
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Get only the assignments that have changed
            const changedAssignments = Object.entries(assignments).filter(([businessId, assignment]) => {
                const existing = existingAssignments.find(a => a.business_id === parseInt(businessId));
                return !existing || existing.is_enabled !== assignment.is_enabled;
            });

            if (changedAssignments.length === 0) {
                onClose();
                return;
            }

            // Submit each changed assignment using fetch instead of Inertia router
            for (const [businessId, assignment] of changedAssignments) {
                try {
                    const response = await fetch(`/admin/features/${feature.id}/assign`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            business_id: businessId,
                            is_enabled: assignment.is_enabled,
                        }),
                    });

                    if (response.ok) {
                        // Assignment successful
                        onClose();
                    } else {
                        const data = await response.json();
                        setError(data.errors?.general || 'Failed to assign feature. Please try again.');
                    }
                } catch (error) {
                    setError('Failed to update assignment. Please try again.');
                    return;
                }
            }

            // Refresh the page to show updated assignments
            router.reload();

            onClose();
        } catch (err) {
            setError('Failed to update assignments. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const enabledCount = Object.values(assignments).filter(a => a.is_enabled).length;
    const totalCount = businesses.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Assign "{feature.name}" to Businesses
                    </DialogTitle>
                    <DialogDescription>
                        Enable or disable this feature for specific businesses. Changes will be applied immediately.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Summary Stats */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Assignment Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{enabledCount}</div>
                                <div className="text-sm text-muted-foreground">Enabled</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{totalCount - enabledCount}</div>
                                <div className="text-sm text-muted-foreground">Disabled</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{totalCount}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Business List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredBusinesses.length === 0 ? (
                        <div className="text-center py-8">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? 'Try adjusting your search terms.' : 'No businesses available.'}
                            </p>
                        </div>
                    ) : (
                        filteredBusinesses.map(business => {
                            const assignment = assignments[business.id];
                            const isEnabled = assignment?.is_enabled ?? false;

                            return (
                                <Card key={business.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <Building2 className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate">{business.name}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {business.slug}
                                                    </p>
                                                    {business.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {business.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={isEnabled ? "default" : "secondary"}>
                                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={() => handleToggleAssignment(business.id)}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="min-w-[100px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
