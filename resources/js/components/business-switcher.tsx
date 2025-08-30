import * as React from "react"
import { ChevronsUpDown, Plus, Building2 } from "lucide-react"
import { router } from "@inertiajs/react"
import { usePage } from "@inertiajs/react"
import type { SharedData } from "@/types"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { BusinessMembership } from "@/types"

export function BusinessSwitcher({
  businesses,
  currentBusiness,
  onBusinessChange,
}: {
  businesses: BusinessMembership[]
  currentBusiness: BusinessMembership | null
  onBusinessChange: (business: BusinessMembership) => void
}) {
  const { isMobile } = useSidebar()
  const { auth } = usePage<SharedData>().props

  if (!businesses.length) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No Businesses</span>
              <span className="truncate text-xs">Not registered</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Don't auto-select business - let the parent component handle this
  if (!currentBusiness) {
    return (
      <SidebarMenu>
        <SidebarMenuButton size="lg" disabled>
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Select Business</span>
            <span className="truncate text-xs">Choose a business to continue</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenu>
    )
  }

  const handleBusinessChange = (business: BusinessMembership) => {
    // Only navigate if it's a different business
    if (currentBusiness.id !== business.id) {
      // Call the parent callback first
      onBusinessChange(business)
      // Then navigate using Inertia router
      router.get(`/businesses/${business.slug}/dashboard`)
    }
  }

  const handleCreateBusiness = () => {
    router.get('/businesses/create')
  }

  return (
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
                <span className="truncate font-medium">{currentBusiness.name}</span>
                <span className="truncate text-xs capitalize">{currentBusiness.role} • {currentBusiness.status}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              My Businesses
            </DropdownMenuLabel>
            {businesses.map((business, index) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => handleBusinessChange(business)}
                className={`gap-2 p-2 ${currentBusiness.id === business.id ? 'bg-accent' : ''}`}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{business.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {business.role} • {business.status}
                  </div>
                </div>
                {currentBusiness.id === business.id && (
                  <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {(auth.permissions?.includes('businesses.create') || auth.roles?.includes('superadmin')) && (
              <DropdownMenuItem onClick={handleCreateBusiness} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Create Business</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
