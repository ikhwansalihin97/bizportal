import React from 'react'
import {
  Home,
  Building2,
  Plus,
  ChevronsUpDown,
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
  const isSuperAdmin = auth.roles?.includes('superadmin') || auth.user?.profile?.role === 'superadmin'
  const canCreateBusiness = isSuperAdmin || auth.permissions?.includes('business.create')

  // Debug logging
  console.log('Auth object:', auth)
  console.log('User roles:', auth.roles)
  console.log('User profile role:', auth.user?.profile?.role)
  console.log('User permissions:', auth.permissions)
  console.log('Is superadmin:', isSuperAdmin)
  console.log('Can create business:', canCreateBusiness)

  // Auto-select business if only one exists and no current business
  React.useEffect(() => {
    const currentPath = window.location.pathname
    const isOnBusinessPage = currentPath.includes('/businesses/') && currentPath !== '/businesses/create'
    
    // Only auto-select if we have exactly one business and we're not on a business page
    if (userBusinesses.length === 1 && !isOnBusinessPage) {
      const business = userBusinesses[0]
      
      // Check if we're already on the right page
      if (currentPath !== `/businesses/${business.slug}/dashboard`) {
        console.log('Auto-selecting business:', business.name, 'redirecting to:', `/businesses/${business.slug}/dashboard`)
        window.location.href = `/businesses/${business.slug}/dashboard`
      }
    }
  }, [userBusinesses])

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
      icon: 'Home',
      items: [
        {
          title: 'Main Dashboard',
          url: '/dashboard',
        },
      ],
    },
  ]

  if (displayBusiness) {
    navigationItems.push(
      {
        title: 'Business',
        url: `/businesses/${displayBusiness.slug}/dashboard`,
        icon: 'Building2',
        items: [
          {
            title: 'Dashboard',
            url: `/businesses/${displayBusiness.slug}/dashboard`,
          },
          {
            title: 'Users',
            url: `/businesses/${displayBusiness.slug}/users`,
          },
          {
            title: 'Settings',
            url: `/businesses/${displayBusiness.slug}/edit`,
          },
        ],
      }
    )
  }

  if (auth.roles?.includes('superadmin')) {
    navigationItems.push(
      {
        title: 'Admin',
        url: '/admin',
        icon: 'Shield',
        items: [
          {
            title: 'Users',
            url: '/admin/users',
          },
          {
            title: 'Roles',
            url: '/admin/roles',
          },
          {
            title: 'Permissions',
            url: '/admin/permissions',
          },
        ],
      }
    )
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 space-y-3">
          {/* Business Switcher */}
          {userBusinesses.length > 0 && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Building2 className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{displayBusiness?.name || 'Select Business'}</span>
                        <span className="truncate text-xs">{displayBusiness?.role || 'No Business'}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    side={isMobile ? "bottom" : "right"}
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
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
                        {business.name}
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
                          <div className="text-muted-foreground font-medium">Add team</div>
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

