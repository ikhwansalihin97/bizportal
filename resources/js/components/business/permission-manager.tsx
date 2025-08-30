import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronDown, 
  ChevronRight,
  Shield,
  Users,
  Building2,
  DollarSign,
  FolderOpen,
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { 
  BUSINESS_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS,
  type BusinessRole 
} from '@/types/business';

// Utility function to compare arrays for equality
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

interface PermissionManagerProps {
  selectedRole: BusinessRole;
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  showRoleDefaults?: boolean;
  disabled?: boolean;
}

const PERMISSION_GROUPS = {
  users: {
    icon: Users,
    title: 'User Management',
    description: 'Permissions related to managing team members',
    color: 'text-blue-600',
    permissions: ['users.view', 'users.invite', 'users.manage']
  },
  business: {
    icon: Building2,
    title: 'Business Management',
    description: 'Permissions for business information and settings',
    color: 'text-green-600',
    permissions: ['business.view', 'business.edit', 'business.delete']
  },
  finance: {
    icon: DollarSign,
    title: 'Financial Management',
    description: 'Access to financial data and operations',
    color: 'text-yellow-600',
    permissions: ['finance.view', 'finance.manage']
  },
  projects: {
    icon: FolderOpen,
    title: 'Project Management',
    description: 'Manage projects and tasks',
    color: 'text-purple-600',
    permissions: ['projects.view', 'projects.manage']
  },
  reports: {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Access to reports and business analytics',
    color: 'text-orange-600',
    permissions: ['reports.view', 'reports.export']
  }
};

const ROLE_DESCRIPTIONS = {
  owner: { 
    color: 'text-yellow-600', 
    icon: Shield,
    description: 'Complete control over all business aspects including deletion'
  },
  admin: { 
    color: 'text-red-600', 
    icon: Shield,
    description: 'Administrative access to most business functions'
  },
  manager: { 
    color: 'text-blue-600', 
    icon: Users,
    description: 'Team and project management capabilities'
  },
  employee: { 
    color: 'text-green-600', 
    icon: Users,
    description: 'Standard access to view and work on assigned tasks'
  },
  contractor: { 
    color: 'text-purple-600', 
    icon: Users,
    description: 'Limited access for external contractors'
  },
  viewer: { 
    color: 'text-gray-600', 
    icon: Users,
    description: 'Read-only access to business information'
  }
};

export function PermissionManager({
  selectedRole,
  selectedPermissions,
  onPermissionsChange,
  showRoleDefaults = true,
  disabled = false
}: PermissionManagerProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['users', 'business']);

  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];
  const isCustomMode = !arraysEqual(selectedPermissions, DEFAULT_ROLE_PERMISSIONS[selectedRole] || []);
  
  // Get role info for display
  const roleInfo = ROLE_DESCRIPTIONS[selectedRole] || {
    color: 'text-gray-600',
    icon: Shield,
    description: 'Custom role with specific permissions'
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      onPermissionsChange([...selectedPermissions, permissionId]);
    } else {
      onPermissionsChange(selectedPermissions.filter(p => p !== permissionId));
    }
  };

  const handleUseRoleDefaults = () => {
    onPermissionsChange(roleDefaults);
  };

  const handleToggleGroup = (groupId: string) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getGroupPermissionCount = (groupPermissions: string[]) => {
    const selected = groupPermissions.filter(perm => selectedPermissions.includes(perm)).length;
    return { selected, total: groupPermissions.length };
  };

  const isGroupFullySelected = (groupPermissions: string[]) => {
    return groupPermissions.every(perm => selectedPermissions.includes(perm));
  };

  const isGroupPartiallySelected = (groupPermissions: string[]) => {
    const selected = groupPermissions.filter(perm => selectedPermissions.includes(perm));
    return selected.length > 0 && selected.length < groupPermissions.length;
  };

  const handleGroupToggle = (groupPermissions: string[]) => {
    const isFullySelected = isGroupFullySelected(groupPermissions);
    
    if (isFullySelected) {
      // Remove all group permissions
      const newPermissions = selectedPermissions.filter(perm => !groupPermissions.includes(perm));
      onPermissionsChange(newPermissions);
    } else {
      // Add all group permissions
      const newPermissions = [...selectedPermissions];
      groupPermissions.forEach(perm => {
        if (!newPermissions.includes(perm)) {
          newPermissions.push(perm);
        }
      });
      onPermissionsChange(newPermissions);
    }
  };

  return (
    <div className="space-y-4">
      {/* Role Information */}
      {showRoleDefaults && (
        <Alert>
          <roleInfo.icon className={`h-4 w-4 ${roleInfo.color}`} />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="capitalize">{selectedRole} Role:</strong> {roleInfo.description}
              </div>
              {isCustomMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUseRoleDefaults}
                  disabled={disabled}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Use Defaults
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Permissions Warning */}
      {isCustomMode && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Custom Permissions:</strong> This user has permissions that differ from the default {selectedRole} role.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions
            <Badge variant="secondary">
              {selectedPermissions.length} of {Object.keys(BUSINESS_PERMISSIONS).length} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PERMISSION_GROUPS).map(([groupId, group]) => {
            const Icon = group.icon;
            const isOpen = openGroups.includes(groupId);
            const { selected, total } = getGroupPermissionCount(group.permissions);
            const isFullySelected = isGroupFullySelected(group.permissions);
            const isPartiallySelected = isGroupPartiallySelected(group.permissions);

            return (
              <div key={groupId} className="border rounded-lg">
                <div className="flex items-center p-3">
                  <div className="flex items-center gap-2 mr-3">
                    <Checkbox
                      checked={isFullySelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={() => handleGroupToggle(group.permissions)}
                      disabled={disabled}
                    />
                  </div>
                  <Collapsible open={isOpen} onOpenChange={() => handleToggleGroup(groupId)} className="flex-1">
                    <CollapsibleTrigger className="w-full p-0 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${group.color}`} />
                        <div className="text-left">
                          <div className="font-medium">{group.title}</div>
                          <div className="text-xs text-muted-foreground">{group.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {selected}/{total}
                        </Badge>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-2 border-t bg-gray-50/50">
                        {group.permissions.map((permissionId) => {
                          const permission = BUSINESS_PERMISSIONS[permissionId as keyof typeof BUSINESS_PERMISSIONS];
                          const isChecked = selectedPermissions.includes(permissionId);

                          return (
                            <div key={permissionId} className="flex items-start gap-3 py-2">
                              <Checkbox
                                id={permissionId}
                                checked={isChecked}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permissionId, checked as boolean)
                                }
                                disabled={disabled}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={permissionId} 
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              {selectedPermissions.length === 0 && "No permissions selected - user will have very limited access"}
              {selectedPermissions.length > 0 && selectedPermissions.length < 5 && "Limited permissions - user has restricted access"}
              {selectedPermissions.length >= 5 && selectedPermissions.length < 8 && "Standard permissions - user has good access level"}
              {selectedPermissions.length >= 8 && "Comprehensive permissions - user has broad access"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
