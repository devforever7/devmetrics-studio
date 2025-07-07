"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Home, 
  Settings, 
  Code2, 
  FileText, 
  Zap,
  TestTube,
  LogOut
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/dashboard/projects", icon: Code2 },
  { name: "Events", href: "/dashboard/events", icon: Zap },
  { name: "Test Events", href: "/dashboard/test-events", icon: TestTube },
  { name: "Documentation", href: "/dashboard/docs", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon">
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className="font-medium text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              <ModeToggle />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}