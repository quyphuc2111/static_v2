"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Copy, Check, BookOpen, Edit, Download, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"

// Types
export interface ContentItem {
  id: string
  title: string
  description?: any
  contentType: string
  fileSize?: number
  status: string
  progress?: number
  createdAt: string
  contentUrl: string
  isDeleted?: boolean
  owner?: { id: string; name?: string | null; email: string } | null
}

// Utility functions
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 B"
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const getContentTypeLabel = (type: string) => {
  switch (type) {
    case "FILE_ZIP_HTML":
      return "HTML"
    case "FILE_ZIP_SCORM":
      return "SCORM"
    default:
      return type
  }
}

const getContentTypeColor = (type: string) => {
  switch (type) {
    case "FILE_ZIP_HTML":
      return "text-blue-400"
    case "FILE_ZIP_SCORM":
      return "text-green-400"
    default:
      return "text-muted-foreground"
  }
}

const getStatusBadge = (status: string, progress?: number) => {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoàn thành</Badge>
    case "PROCESSING":
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Đang xử lý</Badge>
          {progress !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-8 bg-muted rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-blue-400 font-medium">{progress}%</span>
            </div>
          )}
        </div>
      )
    case "FAILED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Thất bại</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatJsonValue = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.title) {
      return `"${truncateText(value.title, 30)}" (v${value.version || 'N/A'})`
    }
    const entries = Object.entries(value).slice(0, 2)
    return entries.map(([k, v]) => `${k}: ${truncateText(String(v), 20)}`).join(', ')
  }
  return truncateText(String(value), 40)
}

// Helper function to get content URL
const getContentUrl = (content: ContentItem) => {
  const desc: any = content.description
  const scorm = typeof desc === 'object' && desc ? desc.scorm : null
  const launchFile = typeof desc === 'object' && desc ? desc.launchFile : null
  
  if (content.contentType === 'FILE_ZIP_SCORM' && scorm && launchFile) {
    const raw = `/uploads${content.contentUrl}/${launchFile}`
    return raw.replace(/\/+/g, '/').replace('/uploads/uploads', '/uploads')
  } else if (content.contentType === 'FILE_ZIP_HTML' && launchFile) {
    const raw = `/uploads${content.contentUrl}/${launchFile}`
    return raw.replace(/\/+/g, '/').replace('/uploads/uploads', '/uploads')
  } else {
    return `/uploads${content.contentUrl}`.replace('/uploads/uploads', '/uploads')
  }
}

// Helper function to get SCORM info
const getSCORMInfo = (content: ContentItem) => {
  if (content.contentType === "FILE_ZIP_SCORM" && content.description) {
    const desc = content.description
    if (typeof desc === 'object' && desc) return desc.scorm || null
    try {
      const parsed = JSON.parse(desc)
      return parsed.scorm || null
    } catch {
      return null
    }
  }
  return null
}

// Action component
interface ContentActionsProps {
  content: ContentItem
  onView: (content: ContentItem) => void
  onCopyUrl: (content: ContentItem) => void
  onShowSCORMInfo: (content: ContentItem) => void
  onEdit: (content: ContentItem) => void
  onDownload: (content: ContentItem) => void
  onDelete: (content: ContentItem) => void
  copiedUrl: string | null
  isDownloading: boolean
  isDeleting: boolean
}

function ContentActions({
  content,
  onView,
  onCopyUrl,
  onShowSCORMInfo,
  onEdit,
  onDownload,
  onDelete,
  copiedUrl,
  isDownloading,
  isDeleting
}: ContentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(content)}>
          <Eye className="mr-2 h-4 w-4" />
          Xem
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopyUrl(content)}>
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
        </DropdownMenuItem>
        {getSCORMInfo(content) && (
          <DropdownMenuItem onClick={() => onShowSCORMInfo(content)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Thông tin SCORM
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit(content)}>
          <Edit className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDownload(content)}
          disabled={isDownloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Đang tải..." : "Tải xuống"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-400"
          onClick={() => onDelete(content)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Đang xóa..." : "Xóa"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Description component
interface ContentDescriptionProps {
  content: ContentItem
  onDescriptionClick: (content: ContentItem) => void
}

function ContentDescription({ content, onDescriptionClick }: ContentDescriptionProps) {
  if (!content.description) return <span className="text-muted-foreground">-</span>
  
  const desc = content.description
  if (typeof desc === 'object' && desc) {
    const entries = Object.entries(desc)
    if (entries.length === 0) return <span className="text-muted-foreground">-</span>
    
    return (
      <div 
        className="space-y-1 max-w-xs cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
        onClick={() => onDescriptionClick(content)}
      >
        {entries.slice(0, 3).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
              {key}:
            </span>
            <span className="text-foreground break-words">
              {formatJsonValue(value)}
            </span>
          </div>
        ))}
        {entries.length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{entries.length - 3} trường khác
          </div>
        )}
      </div>
    )
  }
  
  return (
    <span 
      className="text-foreground text-xs cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors block"
      onClick={() => onDescriptionClick(content)}
    >
      {truncateText(String(desc), 60)}
    </span>
  )
}

// Progress component
interface ContentProgressProps {
  content: ContentItem
}

function ContentProgress({ content }: ContentProgressProps) {
  if (content.progress === undefined || content.progress === null) {
    return <span className="text-sm">-</span>
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            content.status === "COMPLETED" 
              ? "bg-green-400" 
              : content.status === "FAILED"
              ? "bg-red-400"
              : "bg-blue-400"
          }`}
          style={{ width: `${content.progress}%` }}
        />
      </div>
      <span className={`text-xs font-medium min-w-[3rem] text-right ${
        content.status === "COMPLETED" 
          ? "text-green-400" 
          : content.status === "FAILED"
          ? "text-red-400"
          : "text-blue-400"
      }`}>
        {content.progress}%
      </span>
    </div>
  )
}

// Column definitions
export const createContentColumns = (
  actions: {
    onView: (content: ContentItem) => void
    onCopyUrl: (content: ContentItem) => void
    onShowSCORMInfo: (content: ContentItem) => void
    onEdit: (content: ContentItem) => void
    onDownload: (content: ContentItem) => void
    onDelete: (content: ContentItem) => void
    onDescriptionClick: (content: ContentItem) => void
    copiedUrl: string | null
    isDownloading: boolean
    isDeleting: boolean
  },
  options?: { isAdmin?: boolean }
): ColumnDef<ContentItem>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex
      const pageSize = table.getState().pagination.pageSize
      const index = pageIndex * pageSize + row.index + 1
      return (
        <div className=" text-muted-foreground font-medium">
          {index}
        </div>
      )
    },
    size: 60,
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: "Tên Nội dung",
    cell: ({ row }) => {
      const isDeleted = row.original.isDeleted
      return (
        <div className="font-medium text-foreground flex items-center gap-2">
          <span>{row.getValue("title")}</span>
          {isDeleted && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Đã xoá mềm</Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => (
      <ContentDescription 
        content={row.original} 
        onDescriptionClick={actions.onDescriptionClick}
      />
    ),
  },
  {
    accessorKey: "contentType",
    header: "Loại",
    cell: ({ row }) => (
      <span className={`font-mono text-sm ${getContentTypeColor(row.getValue("contentType"))}`}>
        {getContentTypeLabel(row.getValue("contentType"))}
      </span>
    ),
  },
  {
    accessorKey: "fileSize",
    header: "Kích thước",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatFileSize(row.getValue("fileSize"))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => getStatusBadge(row.getValue("status"), row.original.progress),
  },
  {
    accessorKey: "progress",
    header: "Tiến độ",
    cell: ({ row }) => <ContentProgress content={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleDateString('vi-VN')}
      </div>
    ),
  },
  ...(options?.isAdmin
    ? [{
        id: "owner",
        header: "Owner",
        cell: ({ row }: any) => {
          const owner = row.original.owner
          if (!owner) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex flex-col leading-tight">
              <span className="text-foreground text-sm">{owner.name || owner.email}</span>
              {owner.name && <span className="text-muted-foreground text-xs">{owner.email}</span>}
            </div>
          )
        },
      }] as ColumnDef<ContentItem>[]
    : []),
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ContentActions
        content={row.original}
        onView={actions.onView}
        onCopyUrl={actions.onCopyUrl}
        onShowSCORMInfo={actions.onShowSCORMInfo}
        onEdit={actions.onEdit}
        onDownload={actions.onDownload}
        onDelete={actions.onDelete}
        copiedUrl={actions.copiedUrl}
        isDownloading={actions.isDownloading}
        isDeleting={actions.isDeleting}
      />
    ),
  },
]
