"use client"

import { useState, useEffect, useMemo } from "react"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { debounce } from "lodash"
import { DataTable, Project } from "./table"
import { FolderOpen } from "lucide-react"

interface ProjectListProps {
  searchQuery: string
  showDeleted?: boolean
}

export function ProjectList({ searchQuery, showDeleted = false }: ProjectListProps) {
  const { projects, isLoading, deleteProject } = useProjects({ includeDeleted: true })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery)
    return () => {
      debouncedSetSearchQuery.cancel()
    }
  }, [searchQuery, debouncedSetSearchQuery])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    
    return projects
      .filter((project) => showDeleted ? project.isDeleted : !project.isDeleted)
      .filter(
        (project) =>
          project.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
      )
  }, [projects, debouncedSearchQuery, showDeleted])

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 px-6">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center ">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">
          {showDeleted ? "Không có dự án đã xóa" : "Không có dự án"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {showDeleted 
            ? "Chưa có dự án nào bị xóa. Các dự án đã xóa mềm sẽ hiển thị ở đây."
            : searchQuery 
              ? "Không tìm thấy dự án phù hợp với tìm kiếm của bạn."
              : "Bắt đầu bằng cách tạo dự án mới để quản lý tài liệu."
          }
        </p>
      </div>
    )
  }

  return (
    <div className="w-[calc(100vw-40px)] md:w-full">
      <div className="flex md:hidden items-center justify-center text-xs text-muted-foreground py-2 bg-muted/30 border-b">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Vuốt sang để xem thêm
      </div>
      <DataTable 
        data={filteredProjects as Project[]} 
        onDelete={handleDeleteProject}
      />
    </div>
  )
}
