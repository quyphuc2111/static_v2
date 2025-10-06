"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { PermissionName } from "@prisma/client"

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: PermissionName[]
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permissions: [PermissionName.VIEW_DASHBOARD_STATS, PermissionName.VIEW_AUDIT_LOGS]
  },
  {
    name: "Quản lý Dự án",
    href: "/project",
    icon: Settings,
    permissions: [
      PermissionName.VIEW_PROJECTS,
      PermissionName.CREATE_PROJECTS,
      PermissionName.EDIT_PROJECTS,
      PermissionName.DELETE_PROJECTS
    ]
  }, 
  {
    name: "Quản lý Nội dung",
    href: "/content",
    icon: FileText,
    permissions: [PermissionName.VIEW_CONTENT, PermissionName.VIEW_OWN_CONTENT_ONLY]
  },
  {
    name: "Quản lý Người dùng",
    href: "/users",
    icon: Users,
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.CREATE_USERS,
      PermissionName.EDIT_USERS,
      PermissionName.DELETE_USERS
    ]
  },
  {
    name: "Quản lý Quyền hạn",
    href: "/rbac",
    icon: Shield,
    permissions: [PermissionName.MANAGE_USER_PERMISSIONS]
  },
  {
    name: "Chia sẻ Nội dung",
    href: "/content-sharing",
    icon: Share2,
    permissions: [PermissionName.SHARE_CONTENT_ACCESS]
  }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
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
        "relative flex flex-col h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
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
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
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
