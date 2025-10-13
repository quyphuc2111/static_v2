"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderOpen, Trash2 } from "lucide-react"
import { ProjectList } from "./project-list"
import { CreateProjectDialog } from "./modal/create-project-dialog"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { Permissions } from "@/constants/permissions"

export function ProjectManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  
  const { projects, isLoading } = useProjects({ includeDeleted: true })

  // Filter projects based on deleted status (client-side)
  const filteredProjects = projects?.filter(p => 
    showDeleted ? p.isDeleted : !p.isDeleted
  ) || []

  // Calculate stats
  const totalProjects = filteredProjects.length
  const activeProjects = filteredProjects.filter(p => !p.isDeleted && p.status === 'ACTIVE').length
  const totalModules = filteredProjects.reduce((sum, p) => sum + (p.modules?.length || 0), 0)

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quản lý Dự án</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Quản lý các dự án và module trong hệ thống</p>
        </div>
       <PermissionGuard permission={Permissions.Project.CREATE}>
       <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 w-full md:w-auto" data-testid="project-create-button">
          <Plus className="h-4 w-4" />
          Tạo Dự án Mới
        </Button>
       </PermissionGuard>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-3 max-w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {showDeleted ? "Dự án Đã Xóa" : "Tổng Dự án"}
            </CardTitle>
            <FolderOpen className={`h-4 w-4 ${showDeleted ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Đang tải..." : showDeleted ? "dự án đã xóa mềm" : `${activeProjects} đang hoạt động`}
            </p>
          </CardContent>
        </Card>

        <Card className={showDeleted ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án Đang Hoạt động</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {totalProjects > 0 && !showDeleted ? `${Math.round((activeProjects / totalProjects) * 100)}% tổng số dự án` : showDeleted ? "không áp dụng" : "0% tổng số dự án"}
            </p>
          </CardContent>
        </Card>

        <Card className={showDeleted ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Module</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              {totalProjects > 0 && !showDeleted ? `Trung bình ${(totalModules / totalProjects).toFixed(1)} module/dự án` : showDeleted ? "bao gồm đã xóa" : "0 module/dự án"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden max-w-full">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Danh sách Dự án</CardTitle>
              <CardDescription className="text-sm">Quản lý tất cả các dự án và module</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <PermissionGuard permission={Permissions.Project.VIEW_DELETED}>
                <Tabs value={showDeleted ? "deleted" : "active"} onValueChange={(v) => setShowDeleted(v === "deleted")} data-testid="project-tabs" className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto grid grid-cols-2">
                    <TabsTrigger value="active" data-testid="tab-active" className="text-xs sm:text-sm">Đang hoạt động</TabsTrigger>
                    <TabsTrigger value="deleted" data-testid="tab-deleted" className="text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Đã xóa
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </PermissionGuard>
              <div className="relative w-full sm:w-64" data-testid="project-search-wrapper">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm dự án..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="project-search-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectList searchQuery={searchQuery} showDeleted={showDeleted} />
        </CardContent>
      </Card>

      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}


