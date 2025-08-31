import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

// Re-export business types
export * from './business';

// Re-export permission types
export * from './permission';

// Re-export business feature types
export * from './business-feature';

export interface Auth {
    user: User | null;
    permissions: string[];
    roles: string[];
    isSuperAdmin: boolean;
    businesses: BusinessMembership[];
}

export interface BusinessMembership {
    id: number;
    name: string;
    slug: string;
    role: string;
    status: string;
    joined_date: string;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface FlashData {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    flash: FlashData;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
