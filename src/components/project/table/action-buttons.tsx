"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Eye, Plus } from "lucide-react"
import { EditProjectDialog } from "../modal/edit-project-dialog"
import { DeleteProjectDialog } from "../modal/delete-project-dialog"
import { ModuleManagementDialog } from "../modal/module-management-dialog"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"
import { Project } from "./columns"

interface ActionButtonsProps {
  project: Project
  onDelete: (projectId: string) => void
}

export function ActionButtons({ project, onDelete }: ActionButtonsProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [managingModules, setManagingModules] = useState<Project | null>(null)

  const handleDeleteProject = async (projectId: string) => {
    await onDelete(projectId)
    setDeletingProject(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setManagingModules(project)}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setManagingModules(project)}>
            <Plus className="mr-2 h-4 w-4" />
            Quản lý Module
          </DropdownMenuItem>
          <PermissionGuard permission={PermissionName.EDIT_PROJECTS}>
            <DropdownMenuItem onClick={() => setEditingProject(project)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
          </PermissionGuard>
          <DropdownMenuSeparator />
          <PermissionGuard permission={PermissionName.SOFT_DELETE_PROJECTS}>
            <DropdownMenuItem onClick={() => setDeletingProject(project)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa dự án
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>

      {editingProject && (
        <EditProjectDialog
          project={editingProject as any}
          open={!!editingProject}
          onOpenChange={(open: boolean) => !open && setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          project={deletingProject as any}
          open={!!deletingProject}
          onOpenChange={(open: boolean) => !open && setDeletingProject(null)}
          onConfirm={async () => await handleDeleteProject(deletingProject.id)}
        />
      )}

      {managingModules && (
        <ModuleManagementDialog
          project={managingModules as any}
          open={!!managingModules}
          onOpenChange={(open: boolean) => !open && setManagingModules(null)}
        />
      )}
    </>
  )
}
