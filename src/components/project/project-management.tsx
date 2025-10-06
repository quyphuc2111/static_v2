"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderOpen } from "lucide-react"
import { ProjectList } from "./project-list"
import { CreateProjectDialog } from "./modal/create-project-dialog"
import { useProjects } from "@/modules/project/hooks/useProjects"

export function ProjectManagement() {
  const { projects, isLoading } = useProjects()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Calculate stats
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.status === 'ACTIVE').length || 0
  const totalModules = projects?.reduce((sum, p) => sum + (p.modules?.length || 0), 0) || 0

  return (
    <div className="flex flex-col gap-6 p-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Dự án</h1>
          <p className="text-muted-foreground mt-1">Quản lý các dự án và module trong hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo Dự án Mới
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Dự án</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Đang tải..." : `${activeProjects} đang hoạt động`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án Đang Hoạt động</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {totalProjects > 0 ? `${Math.round((activeProjects / totalProjects) * 100)}% tổng số dự án` : "0% tổng số dự án"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Module</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              {totalProjects > 0 ? `Trung bình ${(totalModules / totalProjects).toFixed(1)} module/dự án` : "0 module/dự án"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Dự án</CardTitle>
              <CardDescription>Quản lý tất cả các dự án và module</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectList searchQuery={searchQuery} />
        </CardContent>
      </Card>

      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}


