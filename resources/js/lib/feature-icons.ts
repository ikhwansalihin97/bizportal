import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  FolderOpen,
  BarChart3,
  FileText,
  Target,
  Settings,
  Database,
  TrendingUp,
  Shield,
  Briefcase,
  ClipboardList,
  CreditCard,
  Truck,
  MessageSquare,
  PieChart,
  LineChart,
  FileSpreadsheet,
  Package,
  Clock,
  Mail,
} from 'lucide-react';

// Feature icon mapping
export const FEATURE_ICONS: Record<string, any> = {
  // HR Features
  'leave-management': Calendar,
  'payroll': DollarSign,
  'hr': Users,
  
  // Finance Features
  'payroll-management': DollarSign,
  'finance': DollarSign,
  'accounting': FileSpreadsheet,
  'billing': CreditCard,
  'invoicing': FileText,
  
  // Project Management
  'projects': Briefcase,
  'project-management': Briefcase,
  'tasks': ClipboardList,
  'time-tracking': Clock,
  
  // Operations
  'inventory': Package,
  'inventory-management': Package,
  'operations': Settings,
  'warehouse': Truck,
  'logistics': Truck,
  
  // Sales & CRM
  'crm': Target,
  'customer-relationship-management': Target,
  'sales': TrendingUp,
  'leads': Target,
  'opportunities': Target,
  
  // Document Management
  'documents': FileText,
  'document-management': FileText,
  'files': FolderOpen,
  'storage': Database,
  
  // Analytics & Reporting
  'analytics': BarChart3,
  'reporting': PieChart,
  'reports': LineChart,
  'dashboard': BarChart3,
  
  // Communication
  'communication': MessageSquare,
  'messaging': MessageSquare,
  'chat': MessageSquare,
  'email': Mail,
  
  // General Business
  'general': Building2,
  'business': Building2,
  'company': Building2,
  'organization': Building2,
  
  // Default fallback
  'default': Settings,
};

// Get icon for a feature
export function getFeatureIcon(featureSlug: string) {
  return FEATURE_ICONS[featureSlug] || FEATURE_ICONS['default'];
}

// Feature categories with their icons
export const FEATURE_CATEGORIES: Record<string, any> = {
  'hr': Users,
  'finance': DollarSign,
  'general': Building2,
  'operations': Settings,
  'sales': Target,
  'marketing': TrendingUp,
  'it': Database,
  'legal': Shield,
  'default': Settings,
};

// Get category icon
export function getCategoryIcon(category: string) {
  return FEATURE_CATEGORIES[category] || FEATURE_CATEGORIES['default'];
}
