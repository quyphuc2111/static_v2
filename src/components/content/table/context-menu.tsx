"use client"

import { useState, useEffect } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../../ui/context-menu"
import { Eye, Copy, Check, BookOpen, Edit, Download, Trash2, RotateCcw, Upload, RefreshCw } from "lucide-react"
import { ContentItem } from "./columns"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { PermissionName } from "@prisma/client"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface ContentContextMenuProps {
  children: React.ReactNode
  content: ContentItem
  onView: (content: ContentItem) => void
  onCopyUrl: (content: ContentItem) => void
  onShowSCORMInfo: (content: ContentItem) => void
  onEdit: (content: ContentItem) => void
  onDownload: (content: ContentItem) => void
  onRestore: (content: ContentItem) => void
  onUploadFile?: (content: ContentItem) => void
  onUpdateFile?: (content: ContentItem) => void
  onSoftDelete?: (content: ContentItem) => void
  onHardDelete?: (content: ContentItem) => void
  copiedUrl: string | null
  isDownloading: boolean
  isRestoring: boolean
  isUploading?: boolean
  isUpdating?: boolean
  isSoftDeleting?: boolean
  isHardDeleting?: boolean
  hasSCORMInfo: boolean
  currentUserId?: string
}

export function ContentContextMenu({
  children,
  content,
  onView,
  onCopyUrl,
  onShowSCORMInfo,
  onEdit,
  onDownload,
  onRestore,
  onUploadFile,
  onUpdateFile,
  onSoftDelete,
  onHardDelete,
  copiedUrl,
  isDownloading,
  isRestoring,
  isUploading,
  isUpdating,
  isSoftDeleting,
  isHardDeleting,
  hasSCORMInfo,
  currentUserId
}: ContentContextMenuProps) {
  const { hasPermission, hasAnyPermission, isAdmin } = useUserPermissions()
  
  // Determine permissions
  const isOwner = content.owner?.id === currentUserId
  const sharePerms = content.sharePermissions
  const isDeleted = content.isDeleted
  const hasFile = content.contentUrl && content.contentUrl.trim() !== ""
  
  // System permissions
  const canViewSystem = hasPermission(PermissionName.VIEW_CONTENT) || isAdmin
  const canEditSystem = hasAnyPermission([PermissionName.EDIT_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) || isAdmin
  const canDownloadSystem = hasAnyPermission([PermissionName.DOWNLOAD_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) || isAdmin
  const canDeleteSystem = hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) || isAdmin
  const canRestoreSystem = hasAnyPermission([PermissionName.RESTORE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) || isAdmin
  const canSoftDeleteSystem = hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) || isAdmin
  const canHardDeleteSystem = hasAnyPermission([PermissionName.HARD_DELETE_CONTENT, PermissionName.MANAGE_ALL_CONTENT]) || isAdmin

  // Combined permissions: system permissions + ownership/share permissions
  const canView = canViewSystem && (isOwner || sharePerms?.canView || false)
  const canEdit = canEditSystem && (isOwner || sharePerms?.canEdit || false)
  const canDownload = canDownloadSystem && (isOwner || sharePerms?.canDownload || false)
  const canDelete = canDeleteSystem && (isOwner || sharePerms?.canDelete || false)
  const canRestore = canRestoreSystem && isOwner
  const canUpload = isOwner && !hasFile && !isDeleted && canEditSystem
  const canUpdate = isOwner && hasFile && !isDeleted && canEditSystem
  const canSoftDelete = canSoftDeleteSystem && (isOwner || sharePerms?.canDelete || false) && !isDeleted
  const canHardDelete = canHardDeleteSystem && isOwner && !isDeleted
  
  // If content is deleted, show restore action
  if (isDeleted) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem 
            onClick={() => onRestore(content)}
            disabled={isRestoring}
            className="text-green-400 focus:text-green-400"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          {
            canHardDeleteSystem && onHardDelete && (
              <ContextMenuItem 
                onClick={() => onHardDelete(content)}
                disabled={isHardDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isHardDeleting ? "Đang xóa cứng..." : "Xóa vĩnh viễn"}
              </ContextMenuItem>
            )
          }
          <ContextMenuItem onClick={() => onView(content)}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {canView && (
          <>
            <ContextMenuItem onClick={() => onView(content)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCopyUrl(content)}>
              {copiedUrl === content.id ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-400" />
                  <span className="text-green-400">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </>
              )}
            </ContextMenuItem>
            {hasSCORMInfo && (
              <ContextMenuItem onClick={() => onShowSCORMInfo(content)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Thông tin SCORM
              </ContextMenuItem>
            )}
          </>
        )}
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onEdit(content)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </ContextMenuItem>
          </>
        )}
        {canDownload && (
          <ContextMenuItem 
            onClick={() => onDownload(content)}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Đang tải..." : "Tải xuống"}
          </ContextMenuItem>
        )}
        {canUpdate && onUpdateFile && (
          <ContextMenuItem 
            onClick={() => onUpdateFile(content)}
            disabled={isUpdating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isUpdating ? "Đang cập nhật..." : "Cập nhật File"}
          </ContextMenuItem>
        )}
        {canSoftDelete && onSoftDelete && (
          <ContextMenuItem 
            onClick={() => onSoftDelete(content)}
            disabled={isSoftDeleting}
            className="text-orange-400 focus:text-orange-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isSoftDeleting ? "Đang xóa mềm..." : "Xóa mềm"}
          </ContextMenuItem>
        )}
        {canHardDelete && onHardDelete && (
          <ContextMenuItem 
            onClick={() => onHardDelete(content)}
            disabled={isHardDeleting}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isHardDeleting ? "Đang xóa cứng..." : "Xóa vĩnh viễn"}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
