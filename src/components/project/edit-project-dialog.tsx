"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useModules } from "@/modules/project/hooks/useModules"
import { useCreateModule } from "@/modules/project/hooks/useCreateModule"
import { useUpdateModule } from "@/modules/project/hooks/useUpdateModule"
import { useDeleteModule } from "@/modules/project/hooks/useDeleteModule"
import { useUpdateProject } from "@/modules/project/hooks/useUpdateProject"

type Props = { projectId: string; projectName: string }

type ModuleItem = { id: string; name: string; isNew?: boolean; isDeleted?: boolean; dirty?: boolean }

export function EditProjectDialog({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(projectName)
  const [initialName, setInitialName] = useState(projectName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setName(projectName)
  }, [open, projectName])

  const listQuery = useModules(projectId, open)

  const [items, setItems] = useState<ModuleItem[]>([])
  useEffect(() => {
    if (open && listQuery.data) {
      setItems(listQuery.data.map((m) => ({ id: m.id, name: m.name })))
      setInitialName(projectName)
    }
  }, [open, listQuery.data, projectName])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  
  const updateMut = useUpdateModule(projectId)
  const deleteMut = useDeleteModule(projectId)
  const updateProjectMut = useUpdateProject(projectId)
  const createMut = useCreateModule(projectId)

  const addNewModule = () => {
    const tempId = `new-${Date.now()}`
    setItems((prev) => [...prev, { id: tempId, name: "", isNew: true, dirty: true }])
    setEditingId(tempId)
    setEditingName("")
  }

  const updateModuleName = (id: string, value: string) => {
    setItems((prev) => 
      prev.map((item) => 
        item.id === id ? { ...item, name: value, dirty: true } : item
      )
    )
  }

  const toggleModuleDelete = (id: string) => {
    setItems((prev) => 
      prev.map((item) => 
        item.id === id ? { ...item, isDeleted: !item.isDeleted, dirty: true } : item
      )
    )
  }

  const saveAllChanges = async () => {
    if (saving) return
    setSaving(true)
    
    try {
      // Save project name if changed
      if (name.trim() && name.trim() !== initialName.trim()) {
        await updateProjectMut.mutateAsync({ name: name.trim() })
      }

      // Collect all module operations
      const moduleOperations = []
      
      for (const item of items) {
        const trimmed = item.name.trim()
        
        if (item.isNew && !item.isDeleted && trimmed) {
          moduleOperations.push(createMut.mutateAsync(trimmed))
        } else if (item.isDeleted && !item.isNew) {
          moduleOperations.push(deleteMut.mutateAsync(item.id))
        } else if (item.dirty && trimmed && !item.isNew && !item.isDeleted) {
          moduleOperations.push(updateMut.mutateAsync({ id: item.id, name: trimmed }))
        }
      }

      // Execute all module operations in parallel
      if (moduleOperations.length > 0) {
        await Promise.allSettled(moduleOperations)
      }

      // Reset state and close dialog
      resetDialogState()
    } catch (error) {
      // Error handling is done by individual hooks
      console.error("Save operation failed:", error)
    } finally {
      setSaving(false)
    }
  }

  const resetDialogState = () => {
    setEditingId(null)
    setEditingName("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">Sửa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dự án</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Tên dự án</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-xs text-muted-foreground">Tên dự án sẽ được lưu khi bấm “Lưu thay đổi”.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Modules</p>
              <div className="flex gap-2">
                <Button onClick={addNewModule}>Thêm module</Button>
              </div>
            </div>
            {listQuery.isLoading ? (
              <p>Đang tải...</p>
            ) : (
              <ScrollArea className="h-64 pr-2">
                <div className="space-y-2">
                  {items.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      {editingId === m.id ? (
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => {
                            setEditingName(e.target.value)
                            updateModuleName(m.id, e.target.value)
                          }}
                          onBlur={() => { setEditingId(null); setEditingName("") }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { setEditingId(null); setEditingName("") } }}
                        />
                      ) : (
                        <>
                          <div
                            className={`px-2 py-1 rounded border text-sm flex-1 cursor-text ${m.isDeleted ? "line-through opacity-60" : "bg-card"}`}
                            onClick={() => { setEditingId(m.id); setEditingName(m.name) }}
                            title="Nhấn để sửa nhanh"
                          >
                            {m.name || "(chưa đặt tên)"}
                          </div>
                          <Button size="sm" variant={m.isDeleted ? "secondary" : "destructive"} onClick={() => toggleModuleDelete(m.id)}>
                            {m.isDeleted ? "Hoàn tác" : "Xoá"}
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAllChanges} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


