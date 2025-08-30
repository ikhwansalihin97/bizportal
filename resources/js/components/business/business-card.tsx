import React from 'react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  Users, 
  MapPin, 
  ExternalLink, 
  Mail, 
  Phone,
  Calendar,
  Crown,
  Shield,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Business, BusinessRole } from '@/types';
import { SUBSCRIPTION_PLANS, BUSINESS_ROLES } from '@/types';

interface BusinessCardProps {
  business: Business;
  userRole?: BusinessRole;
  canManage?: boolean;
  showActions?: boolean;
  onEdit?: (business: Business) => void;
  onDelete?: (business: Business) => void;
  onViewUsers?: (business: Business) => void;
}

export function BusinessCard({
  business,
  userRole,
  canManage = false,
  showActions = true,
  onEdit,
  onDelete,
  onViewUsers,
}: BusinessCardProps) {
  const getRoleIcon = (role?: BusinessRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSubscriptionBadgeColor = (plan: Business['subscription_plan']) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const businessInitials = business.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {business.logo_url && (
                <AvatarImage src={business.logo_url} alt={business.name} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {businessInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold truncate">
                <Link
                  href={`/businesses/${business.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {business.name}
                </Link>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={getSubscriptionBadgeColor(business.subscription_plan)}
                >
                  {SUBSCRIPTION_PLANS[business.subscription_plan]}
                </Badge>
                {userRole && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getRoleIcon(userRole)}
                    {BUSINESS_ROLES[userRole]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/businesses/${business.slug}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {onViewUsers && (
                  <DropdownMenuItem onClick={() => onViewUsers(business)}>
                    <Users className="mr-2 h-4 w-4" />
                    View Users
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(business)}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Edit Business
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(business)}
                        className="text-red-600"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Delete Business
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          {business.industry && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{business.industry}</span>
            </div>
          )}
          
          {business.users_count !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{business.users_count} members</span>
            </div>
          )}

          {business.city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{business.city}, {business.state || business.country}</span>
            </div>
          )}

          {business.established_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Since {new Date(business.established_date).getFullYear()}</span>
            </div>
          )}
        </div>

        {(business.website || business.email || business.phone) && (
          <div className="flex items-center gap-3 pt-2 border-t">
            {business.website && (
              <Button variant="ghost" size="sm" asChild className="h-8 p-2">
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit Website"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {business.email && (
              <Button variant="ghost" size="sm" asChild className="h-8 p-2">
                <a href={`mailto:${business.email}`} title="Send Email">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
            {business.phone && (
              <Button variant="ghost" size="sm" asChild className="h-8 p-2">
                <a href={`tel:${business.phone}`} title="Call">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
