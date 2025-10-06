"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react"
import { ActionButtons } from "./action-buttons"

export interface Project {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  modules?: any[]
  createdAt: string
  updatedAt: string
}

interface ProjectTableProps {
  onDelete: (projectId: string) => void
}

export function createColumns({ onDelete }: ProjectTableProps): ColumnDef<Project>[] {
  return [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )
      },
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Tên Dự án",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("description") || "Không có mô tả"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
          ACTIVE: { variant: "default", label: "Đang hoạt động" },
          INACTIVE: { variant: "secondary", label: "Tạm dừng" },
          ARCHIVED: { variant: "outline", label: "Đã lưu trữ" },
        }
        const config = variants[status] || variants.ACTIVE
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      id: "modules",
      header: "Số Module",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.modules?.length || 0} module
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.getValue("updatedAt")).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <ActionButtons project={row.original} onDelete={onDelete} />,
      size: 50,
    },
  ]
}
