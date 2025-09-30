import React, { useEffect } from 'react'
import {
  Home,
  Building2,
  Plus,
  ChevronsUpDown,
  Shield,
} from "lucide-react"
import { usePage } from "@inertiajs/react"
import type { SharedData } from "@/types"
import { NavMain } from "./nav-main"
import { NavFooter } from "./nav-footer"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "./ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar"

export function AppSidebar() {
  const { auth, currentBusiness } = usePage<SharedData>().props
  const { isMobile } = useSidebar()

  // Get user's businesses
  const userBusinesses = auth.businesses || []

  // Check if user can create businesses
  const isSuperAdmin = auth.isSuperAdmin || auth.roles?.includes('superadmin') || auth.user?.profile?.role === 'superadmin'
  const canCreateBusiness = isSuperAdmin || auth.permissions?.includes('business.create')

  // Auto-select business if user has only one
  useEffect(() => {
    // Only redirect if we're on the main dashboard and user has exactly one business
    const currentPath = window.location.pathname;
    const isOnMainDashboard = currentPath === '/dashboard';
    
    if (userBusinesses.length === 1 && isOnMainDashboard) {
      const business = userBusinesses[0];
      // Redirect to the business dashboard only if we're not already there
      if (currentPath !== `/businesses/${business.slug}/dashboard`) {
        window.location.href = `/businesses/${business.slug}/dashboard`;
      }
    }
  }, [userBusinesses]);

  // Handle business change
  const handleBusinessChange = (business: any) => {
    if (currentBusiness?.id !== business.id) {
      window.location.href = `/businesses/${business.slug}/dashboard`
    }
  }

  // Determine which business to display in the switcher
  const displayBusiness = currentBusiness || userBusinesses[0]

  const navigationItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      items: [
        {
          title: 'Main Dashboard',
          url: '/dashboard',
        },
      ],
    },
  ]

  if (displayBusiness) {
    const businessItems = [
      {
        title: 'Users',
        url: `/businesses/${displayBusiness.slug}/users`,
      },
    ]

    // Only show Settings if user has business-edit permission or is superadmin
    if (isSuperAdmin || auth.permissions?.includes('business-edit')) {
      businessItems.push({
        title: 'Settings',
        url: `/businesses/${displayBusiness.slug}/edit`,
      })
    }

    // Add Attendance navigation if business has attendance feature enabled
    if (displayBusiness.features?.some(feature => feature.slug === 'attendance' && feature.pivot?.is_enabled)) {
      businessItems.push({
        title: 'Attendance',
        url: `/businesses/${displayBusiness.slug}/attendance`,
        items: [
          {
            title: 'Overview',
            url: `/businesses/${displayBusiness.slug}/attendance`,
          },
          {
            title: 'My Records',
            url: `/businesses/${displayBusiness.slug}/attendance/my-records`,
          },
        ],
      })
    }

    // Add Advances navigation - always available for business users, superadmins see it regardless
    // All business users should be able to access advances to create their own records
    if (isSuperAdmin || auth.roles?.includes('superadmin') || auth.permissions?.includes('advances.view') || auth.permissions?.includes('advances.create') || displayBusiness) {
      businessItems.push({
        title: 'Advances',
        url: `/businesses/${displayBusiness.slug}/advances`,
        items: [
          {
            title: 'All Advances',
            url: `/businesses/${displayBusiness.slug}/advances`,
          },
          {
            title: 'My Advances',
            url: `/businesses/${displayBusiness.slug}/advances?user_id=me`,
          },
        ],
      })
    }

    // Add Claims navigation - always available for business users, superadmins see it regardless
    // All business users should be able to access claims to create their own records
    if (isSuperAdmin || auth.roles?.includes('superadmin') || auth.permissions?.includes('claims.view') || auth.permissions?.includes('claims.create') || displayBusiness) {
      businessItems.push({
        title: 'Claims',
        url: `/businesses/${displayBusiness.slug}/claims`,
        items: [
          {
            title: 'All Claims',
            url: `/businesses/${displayBusiness.slug}/claims`,
          },
          {
            title: 'My Claims',
            url: `/businesses/${displayBusiness.slug}/claims?user_id=me`,
          },
        ],
      })
    }

    // Add Roles and Permissions for superadmins and business admins
    if (isSuperAdmin || auth.permissions?.includes('roles.view') || auth.permissions?.includes('permissions.view')) {
      businessItems.push(
        {
          title: 'Roles',
          url: '/admin/roles',
        },
        {
          title: 'Permissions',
          url: '/admin/permissions',
        }
      )
    }

    // Add Features management for business owners and admins
    if (isSuperAdmin || displayBusiness.role === 'owner' || auth.permissions?.includes('business-features.view')) {
      businessItems.push({
        title: 'Feature Management',
        url: `/businesses/${displayBusiness.slug}/features`,
      })
    }

    // Add Salary Configuration for business owners and admins
    if (isSuperAdmin || displayBusiness.role === 'owner' || auth.permissions?.includes('salary-config.view')) {
      businessItems.push({
        title: 'Salary Configuration',
        url: `/businesses/${displayBusiness.slug}/salary-config`,
      })
    }

    navigationItems.push(
      {
        title: displayBusiness.name,
        url: `/businesses/${displayBusiness.slug}/dashboard`,
        icon: Building2,
        items: businessItems,
      }
    )
  }

  if (isSuperAdmin) {
    navigationItems.push(
      {
        title: 'System Core',
        url: '/admin',
        icon: Shield,
        items: [
          {
            title: 'System Users',
            url: '/admin/users',
          },
          {
            title: 'System Roles',
            url: '/admin/roles',
          },
          {
            title: 'System Permissions',
            url: '/admin/permissions',
          },
          {
            title: 'Business Features',
            url: '/admin/features',
          },
          {
            title: 'System Settings',
            url: '/admin/settings',
          },
          {
            title: 'System Logs',
            url: '/admin/logs',
          },
        ],
      },
      {
        title: 'Business Management',
        url: '/admin/businesses',
        icon: Building2,
        items: [
          {
            title: 'All Businesses',
            url: '/admin/businesses',
          },
          {
            title: 'Business Invitations',
            url: '/admin/business-invitations',
          },
          {
            title: 'Business Analytics',
            url: '/admin/business-analytics',
          },
        ],
      }
    )
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2 space-y-1">
          {/* Business Switcher */}
          {userBusinesses.length > 0 && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="w-full h-10 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Building2 className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                        <span className="truncate font-medium">{displayBusiness?.name || 'Select Business'}</span>
                        <span className="truncate text-xs">{displayBusiness?.role || 'No Business'}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    side={isMobile ? "bottom" : "right"}
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-muted-foreground text-xs px-2 py-1.5">
                      Teams
                    </DropdownMenuLabel>
                    {userBusinesses.map((business, index) => (
                      <DropdownMenuItem
                        key={business.id}
                        onClick={() => handleBusinessChange(business)}
                        className={`gap-2 p-2 ${currentBusiness?.id === business.id ? 'bg-accent' : ''}`}
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border">
                          <Building2 className="size-3.5 shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{business.name}</div>
                          <div className="text-xs text-muted-foreground">{business.role || 'Member'}</div>
                        </div>
                        <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    ))}
                    {canCreateBusiness && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 p-2"
                          onClick={() => window.location.href = '/businesses/create'}
                        >
                          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                            <Plus className="size-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-muted-foreground font-medium">Add team</div>
                            <div className="text-xs text-muted-foreground">Create a new business</div>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={auth.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

