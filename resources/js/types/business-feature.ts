export interface BusinessFeature {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: string;
    is_active: boolean;
    settings: Record<string, any>;
    businesses_count: number;
    enabled_businesses_count: number;
    created_at: string;
    updated_at: string;
}

export interface AdminFeaturesIndexProps {
    features: BusinessFeature[];
}

export interface BusinessFeatureAssignment {
    id: number;
    business_id: number;
    feature_id: number;
    is_enabled: boolean;
    settings: Record<string, any>;
    enabled_at: string | null;
    enabled_by: number | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    business?: Business;
    feature?: BusinessFeature;
    enabledBy?: User;
}

export interface Business {
    id: number;
    name: string;
    slug: string;
    description?: string;
    industry?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}
