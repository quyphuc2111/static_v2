"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Project, createColumns } from "./columns"
import { ModuleManagementDialog } from "../modal/module-management-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditModuleDialog } from "../modal/edit-module-dialog"
import { DeleteModuleDialog } from "../modal/delete-module-dialog"

interface DataTableProps {
  data: Project[]
  onDelete: (projectId: string) => void
}

export function DataTable({ data, onDelete }: DataTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [managingModules, setManagingModules] = useState<Project | null>(null)
  const [editingModule, setEditingModule] = useState<any | null>(null)
  const [deletingModule, setDeletingModule] = useState<any | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const columns = createColumns({ onDelete })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      expanded,
    },
  })

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <>
                  <TableRow key={row.id} className={`group cursor-pointer hover:bg-muted/50 ${row.original.isDeleted ? 'bg-red-50/30' : ''}`}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50 p-0">
                        <div className="p-4 pl-16">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold">Module trong dự án</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setManagingModules(row.original)}
                              className="gap-2"
                            >
                              <Plus className="h-3 w-3" />
                              Thêm Module
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {row.original.modules && row.original.modules.length > 0 ? (
                              row.original.modules.map((module: any) => (
                                <div
                                  key={module.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${module.isDeleted ? 'bg-red-50/40 border-red-200' : 'bg-card'}`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{module.name}</span>
                                      <Badge variant={module.status === "ACTIVE" ? "default" : "secondary"}>
                                        {module.status === "ACTIVE" ? "Đang hoạt động" : "Tạm dừng"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {module.description || "Không có mô tả"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium">{module.content?.length || 0}</div>
                                      <div className="text-xs text-muted-foreground">tài liệu</div>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSelectedProjectId(row.original.id); setEditingModule(module) }}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Chỉnh sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedProjectId(row.original.id); setDeletingModule(module) }}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Xóa
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Chưa có module nào trong dự án này
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {managingModules && (
        <ModuleManagementDialog
          project={managingModules}
          open={!!managingModules}
          onOpenChange={(open: boolean) => !open && setManagingModules(null)}
        />
      )}
      <EditModuleDialog
        open={!!editingModule}
        onOpenChange={(open: boolean) => { if (!open) { setEditingModule(null); setSelectedProjectId(null) } }}
        projectId={selectedProjectId}
        module={editingModule}
      />
      <DeleteModuleDialog
        open={!!deletingModule}
        onOpenChange={(open: boolean) => { if (!open) { setDeletingModule(null); setSelectedProjectId(null) } }}
        projectId={selectedProjectId}
        module={deletingModule}
      />
    </>
  )
}
