"use client"

import { useState } from "react"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateProjectDialog } from "./create-project-dialog"
import { ProjectModulesDialog } from "./project-modules-dialog"
import { Input } from "@/components/ui/input"
import { EditProjectDialog } from "./edit-project-dialog"

export function ProjectManagement() {
  const { projects, isLoading, createProject, deleteProject, updateProject } = useProjects()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách dự án</h2>
        <CreateProjectDialog onCreate={async (name, modules) => { await createProject({ name, modules }) }} />
      </div>

      {isLoading ? (
        <p>Đang tải...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên dự án</TableHead>
              <TableHead>Số module</TableHead>
              <TableHead className="w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  <ProjectModulesDialog projectId={p.id} count={p.modules?.length ?? 0} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditProjectDialog projectId={p.id} projectName={p.name} />
                    <Button size="sm" variant="destructive" onClick={() => deleteProject(p.id)}>Xoá</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}


