"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRecentActivity } from "@/modules/dashboard/hooks"
import { ActivityItem } from "@/modules/dashboard/dashboard.service"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { FileText, FolderOpen, Users, Share2, Trash2, RotateCcw, Upload, Edit, LogIn, Shield, Copy, ToggleLeft } from "lucide-react"

const actionConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  created: { label: "Tạo mới", color: "text-blue-700", bgColor: "bg-blue-50 dark:bg-blue-900/30" },
  updated: { label: "Cập nhật", color: "text-sky-700", bgColor: "bg-sky-50 dark:bg-sky-900/30" },
  uploaded: { label: "Tải lên", color: "text-indigo-700", bgColor: "bg-indigo-50 dark:bg-indigo-900/30" },
  file_updated: { label: "Cập nhật file", color: "text-indigo-700", bgColor: "bg-indigo-50 dark:bg-indigo-900/30" },
  imported: { label: "Nhập dữ liệu", color: "text-teal-700", bgColor: "bg-teal-50 dark:bg-teal-900/30" },
  shared: { label: "Chia sẻ", color: "text-purple-700", bgColor: "bg-purple-50 dark:bg-purple-900/30" },
  bulk_shared: { label: "Chia sẻ hàng loạt", color: "text-purple-700", bgColor: "bg-purple-50 dark:bg-purple-900/30" },
  module_shared: { label: "Chia sẻ module", color: "text-purple-700", bgColor: "bg-purple-50 dark:bg-purple-900/30" },
  permissions_updated: { label: "Cập nhật quyền", color: "text-violet-700", bgColor: "bg-violet-50 dark:bg-violet-900/30" },
  deleted: { label: "Xóa", color: "text-red-700", bgColor: "bg-red-50 dark:bg-red-900/30" },
  soft_deleted: { label: "Xóa mềm", color: "text-orange-700", bgColor: "bg-orange-50 dark:bg-orange-900/30" },
  hard_deleted: { label: "Xóa vĩnh viễn", color: "text-red-800", bgColor: "bg-red-100 dark:bg-red-900/40" },
  bulk_hard_deleted: { label: "Xóa hàng loạt", color: "text-red-800", bgColor: "bg-red-100 dark:bg-red-900/40" },
  bulk_soft_deleted: { label: "Xóa mềm hàng loạt", color: "text-orange-700", bgColor: "bg-orange-50 dark:bg-orange-900/30" },
  restored: { label: "Khôi phục", color: "text-green-700", bgColor: "bg-green-50 dark:bg-green-900/30" },
  version_restored: { label: "Khôi phục phiên bản", color: "text-green-700", bgColor: "bg-green-50 dark:bg-green-900/30" },
  version_deleted: { label: "Xóa phiên bản", color: "text-red-700", bgColor: "bg-red-50 dark:bg-red-900/30" },
  revoked: { label: "Thu hồi", color: "text-amber-700", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  batch_revoked: { label: "Thu hồi hàng loạt", color: "text-amber-700", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  login: { label: "Đăng nhập", color: "text-slate-700", bgColor: "bg-slate-50 dark:bg-slate-800" },
  logout: { label: "Đăng xuất", color: "text-slate-600", bgColor: "bg-slate-50 dark:bg-slate-800" },
  role_assigned: { label: "Gán vai trò", color: "text-violet-700", bgColor: "bg-violet-50 dark:bg-violet-900/30" },
  role_removed: { label: "Gỡ vai trò", color: "text-amber-700", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  password_reset: { label: "Đặt lại mật khẩu", color: "text-orange-700", bgColor: "bg-orange-50 dark:bg-orange-900/30" },
  status_toggled: { label: "Đổi trạng thái", color: "text-cyan-700", bgColor: "bg-cyan-50 dark:bg-cyan-900/30" },
  cloned: { label: "Nhân bản", color: "text-blue-700", bgColor: "bg-blue-50 dark:bg-blue-900/30" },
}

const entityIconMap: Record<string, typeof FileText> = {
  ContentData: FileText,
  Project: FolderOpen,
  User: Users,
  ContentShare: Share2,
  ShareBatch: Share2,
  ModuleShare: Share2,
  Module: FolderOpen,
  Role: Shield,
}

function getEntityLabel(entityType: string): string {
  switch (entityType) {
    case "ContentData": return "Tài liệu"
    case "Project": return "Dự án"
    case "Module": return "Module"
    case "User": return "Người dùng"
    case "ContentShare": return "Chia sẻ"
    case "ShareBatch": return "Chia sẻ"
    case "ModuleShare": return "Chia sẻ module"
    case "Role": return "Vai trò"
    default: return entityType
  }
}

/**
 * Lấy tên hiển thị từ metadata audit log.
 * Audit log lưu tên entity trong các field khác nhau tùy entityType:
 * - ContentData: contentTitle
 * - Project: projectName
 * - Module: moduleName
 * - User: userName, username, email
 * - Role: roleName
 */
function getEntityName(activity: ActivityItem): string {
  const metadata = activity.metadata as Record<string, any> | null
  if (!metadata) return "—"

  // Ưu tiên theo entityType
  switch (activity.entityType) {
    case "ContentData":
      return metadata.contentTitle || metadata.title || "—"
    case "Project":
      return metadata.projectName || metadata.name || "—"
    case "Module":
      return metadata.moduleName || metadata.name || "—"
    case "User":
      return metadata.userName || metadata.username || metadata.name || metadata.email || "—"
    case "Role":
      return metadata.roleName || metadata.name || "—"
    case "ContentShare":
    case "ShareBatch":
    case "ModuleShare":
      return metadata.contentTitle || metadata.moduleName || metadata.scope || "—"
    default:
      return metadata.title || metadata.name || metadata.contentTitle || metadata.projectName || metadata.moduleName || "—"
  }
}

export function RecentActivity() {
  const { data: activity, isLoading } = useRecentActivity()

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Không có hoạt động nào gần đây</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {activity.slice(0, 20).map((item: ActivityItem) => {
        const config = actionConfig[item.action] || actionConfig[item.action?.toLowerCase()] || { label: item.action, color: "text-slate-700", bgColor: "bg-slate-50" }
        const Icon = entityIconMap[item.entityType] || FileText
        const actorName = item.actor?.name || item.actor?.email || "Hệ thống"
        const entityName = getEntityName(item)

        return (
          <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            {/* Icon */}
            <div className={`p-2 rounded-lg shrink-0 ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {entityName}
                </span>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 font-medium shrink-0 ${config.color} ${config.bgColor} border-0`}>
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium">{actorName}</span>
                <span>·</span>
                <span className="text-slate-400">{getEntityLabel(item.entityType)}</span>
              </div>
            </div>

            {/* Time */}
            <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
