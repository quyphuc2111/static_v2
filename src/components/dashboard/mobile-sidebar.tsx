"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { navigation, type NavigationItem } from "@/constants/navigation"

interface MobileSidebarProps {
  onClose?: () => void
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { hasPermission, hasAnyPermission } = useUserPermissions()

  const filteredNavigation = navigation.filter((item: NavigationItem) => {
    if (item.permissions && item.permissions.length > 0) {
      return hasAnyPermission(item.permissions)
    }
    return true
  })

  const handleLinkClick = () => {
    // Đóng mobile menu khi click vào link
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">DM</span>
        </div>
        <span className="font-semibold text-foreground">DocManager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
