import React from 'react'
import { usePage } from "@inertiajs/react"
import type { SharedData } from "@/types"
import { NavMain } from "./nav-main"
import { NavFooter } from "./nav-footer"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "./ui/sidebar"

export function AppSidebar() {
  const { auth, currentBusiness } = usePage<SharedData>().props

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

  if (currentBusiness) {
    navigationItems.push(
      {
        title: 'Business',
        url: `/businesses/${currentBusiness.slug}/dashboard`,
        icon: 'Building2',
        items: [
          {
            title: 'Dashboard',
            url: `/businesses/${currentBusiness.slug}/dashboard`,
          },
          {
            title: 'Users',
            url: `/businesses/${currentBusiness.slug}/users`,
          },
          {
            title: 'Settings',
            url: `/businesses/${currentBusiness.slug}/edit`,
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
        <div className="p-4">
          {currentBusiness && (
            <p className="text-sm text-muted-foreground">{currentBusiness.name}</p>
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

