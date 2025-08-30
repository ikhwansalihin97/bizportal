import React from 'react'
import {
  Home,
  Building2,
  Plus,
} from "lucide-react"
import { usePage } from "@inertiajs/react"
import type { SharedData } from "@/types"
import { NavMain } from "./nav-main"
import { NavFooter } from "./nav-footer"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "./ui/sidebar"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"

export function AppSidebar() {
  const { auth, currentBusiness } = usePage<SharedData>().props

  // Get user's businesses
  const userBusinesses = auth.businesses || []

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">
                      {displayBusiness?.name || 'Select Business'}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {userBusinesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => handleBusinessChange(business)}
                    className={`gap-2 ${currentBusiness?.id === business.id ? 'bg-accent' : ''}`}
                  >
                    <Building2 className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{business.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {business.role} • {business.status}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => window.location.href = '/businesses/create'}>
                  <Plus className="h-4 w-4" />
                  Create Business
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

