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
    <div className="flex flex-col gap-6 p-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Dự án</h1>
          <p className="text-muted-foreground mt-1">Quản lý các dự án và module trong hệ thống</p>
        </div>
       <PermissionGuard permission={Permissions.Project.CREATE}>
       <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2" data-testid="project-create-button">
          <Plus className="h-4 w-4" />
          Tạo Dự án Mới
        </Button>
       </PermissionGuard>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Dự án</CardTitle>
              <CardDescription>Quản lý tất cả các dự án và module</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <PermissionGuard permission={Permissions.Project.VIEW_DELETED}>
                <Tabs value={showDeleted ? "deleted" : "active"} onValueChange={(v) => setShowDeleted(v === "deleted")} data-testid="project-tabs">
                  <TabsList>
                    <TabsTrigger value="active" data-testid="tab-active">Đang hoạt động</TabsTrigger>
                    <TabsTrigger value="deleted" data-testid="tab-deleted">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Đã xóa
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </PermissionGuard>
              <div className="relative w-64" data-testid="project-search-wrapper">
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
        <CardContent>
          <ProjectList searchQuery={searchQuery} showDeleted={showDeleted} />
        </CardContent>
      </Card>

      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}


