"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"

const getPageTitle = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  
  switch (lastSegment) {
    case 'dashboard':
      return 'Overview'
    case 'projects':
      return 'Projects'
    case 'events':
      return 'Events'
    case 'test-events':
      return 'Test Events'
    case 'docs':
      return 'Documentation'
    case 'settings':
      return 'Settings'
    default:
      return 'Overview'
  }
}

export function Header() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList className="text-sm font-medium">
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink 
                href="/dashboard"
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-muted-foreground">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="ml-auto flex items-center gap-2 px-4">
        <ModeToggle />
      </div>
    </header>
  )
}