"use client"

import { useState, useEffect } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../../ui/context-menu"
import { Eye, Copy, Check, BookOpen, Edit, Download, Trash2, RotateCcw, Upload, RefreshCw } from "lucide-react"
import { ContentItem } from "./columns"

interface ContentContextMenuProps {
  children: React.ReactNode
  content: ContentItem
  onView: (content: ContentItem) => void
  onCopyUrl: (content: ContentItem) => void
  onShowSCORMInfo: (content: ContentItem) => void
  onEdit: (content: ContentItem) => void
  onDownload: (content: ContentItem) => void
  onDelete: (content: ContentItem) => void
  onRestore: (content: ContentItem) => void
  onUploadFile?: (content: ContentItem) => void
  onUpdateFile?: (content: ContentItem) => void
  copiedUrl: string | null
  isDownloading: boolean
  isDeleting: boolean
  isRestoring: boolean
  isUploading?: boolean
  isUpdating?: boolean
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
  onDelete,
  onRestore,
  onUploadFile,
  onUpdateFile,
  copiedUrl,
  isDownloading,
  isDeleting,
  isRestoring,
  isUploading,
  isUpdating,
  hasSCORMInfo,
  currentUserId
}: ContentContextMenuProps) {
  // Determine permissions
  const isOwner = content.owner?.id === currentUserId
  const sharePerms = content.sharePermissions
  const isDeleted = content.isDeleted
  const hasFile = content.contentUrl && content.contentUrl.trim() !== ""
  
  // If shared content, use share permissions; if owner, full access
  const canView = isOwner || sharePerms?.canView || false
  const canEdit = isOwner || sharePerms?.canEdit || false
  const canDelete = isOwner || sharePerms?.canDelete || false
  const canUpload = isOwner && !hasFile && !isDeleted
  const canUpdate = isOwner && hasFile && !isDeleted
  
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
            <ContextMenuItem 
              onClick={() => onDownload(content)}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Đang tải..." : "Tải xuống"}
            </ContextMenuItem>
            {canUpdate && onUpdateFile && (
              <ContextMenuItem 
                onClick={() => onUpdateFile(content)}
                disabled={isUpdating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isUpdating ? "Đang cập nhật..." : "Cập nhật File"}
              </ContextMenuItem>
            )}
          </>
        )}
        {canDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              className="text-red-400 focus:text-red-400"
              onClick={() => onDelete(content)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
