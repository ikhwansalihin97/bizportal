import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, CheckCircle, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Business {
    id: number;
    name: string;
    slug: string;
    description?: string;
    industry?: string;
    created_at: string;
}

interface BusinessAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: {
        id: number;
        name: string;
    };
    businesses: Business[];
    existingAssignments: Array<{
        business_id: number;
        is_enabled: boolean;
        settings: any;
    }>;
}

export default function BusinessAssignmentModal({
    isOpen,
    onClose,
    feature,
    businesses,
    existingAssignments
}: BusinessAssignmentModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [assignments, setAssignments] = useState<Map<number, { is_enabled: boolean; settings: any }>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize assignments from existing data
    useEffect(() => {
        const initialAssignments = new Map();
        
        // Add existing assignments
        existingAssignments.forEach(assignment => {
            initialAssignments.set(assignment.business_id, {
                is_enabled: assignment.is_enabled,
                settings: assignment.settings || {}
            });
        });
        
        // Add all businesses with default disabled state if not already assigned
        businesses.forEach(business => {
            if (!initialAssignments.has(business.id)) {
                initialAssignments.set(business.id, {
                    is_enabled: false,
                    settings: {}
                });
            }
        });
        
        setAssignments(initialAssignments);
    }, [businesses, existingAssignments]);

    // Filter businesses based on search term
    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleAssignment = (businessId: number) => {
        const current = assignments.get(businessId);
        if (current) {
            setAssignments(new Map(assignments.set(businessId, {
                ...current,
                is_enabled: !current.is_enabled
            })));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            // Submit each changed assignment
            for (const [businessId, assignment] of assignments) {
                const existing = existingAssignments.find(a => a.business_id === businessId);
                const isChanged = !existing || existing.is_enabled !== assignment.is_enabled;
                
                if (isChanged) {
                    await router.post(`/admin/features/${feature.id}/assign/${businessId}`, {
                        is_enabled: assignment.is_enabled,
                        settings: assignment.settings
                    }, {
                        preserveState: true,
                        preserveScroll: true,
                    });
                }
            }
            
            // Refresh the page to show updated assignments
            router.reload();
            onClose();
        } catch (error) {
            console.error('Error updating assignments:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const enabledCount = Array.from(assignments.values()).filter(a => a.is_enabled).length;
    const totalCount = assignments.size;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Assign "{feature.name}" to Businesses</DialogTitle>
                    <DialogDescription>
                        Select which businesses should have access to this feature and configure their settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Search and Stats */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search businesses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline">
                                {enabledCount} of {totalCount} enabled
                            </Badge>
                        </div>
                    </div>

                    {/* Business List */}
                    <div className="flex-1 overflow-y-auto border rounded-lg">
                        <div className="divide-y">
                            {filteredBusinesses.map((business) => {
                                const assignment = assignments.get(business.id);
                                const isEnabled = assignment?.is_enabled || false;
                                
                                return (
                                    <div key={business.id} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <div className="font-medium">{business.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {business.industry && (
                                                            <span className="mr-2">{business.industry}</span>
                                                        )}
                                                        {business.description && (
                                                            <span className="truncate">{business.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <Badge variant={isEnabled ? "default" : "secondary"}>
                                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={() => handleToggleAssignment(business.id)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {filteredBusinesses.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No businesses found matching your search.
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {enabledCount} business{enabledCount !== 1 ? 'es' : ''} will be enabled
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
