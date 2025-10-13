"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { navigation, type NavigationItem } from "@/constants/navigation"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  isMobile?: boolean
}

export function Sidebar({ collapsed = false, onToggleCollapse, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const { hasPermission, hasAnyPermission } = useUserPermissions()

  const filteredNavigation = navigation.filter((item: NavigationItem) => {
    if (item.permissions && item.permissions.length > 0) {
      return hasAnyPermission(item.permissions)
    }
    return true
  })

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card border-r border-border transition-all duration-300",
        isMobile ? "h-full w-full" : "h-[calc(100vh-4rem)]",
        !isMobile && (collapsed ? "w-16" : "w-64"),
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DM</span>
            </div>
            <span className="font-semibold text-foreground">DocManager</span>
          </div>
        )}
        {!isMobile && onToggleCollapse && (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 px-2 pb-4">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
