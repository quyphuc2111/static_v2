"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { toast } from "react-toastify"
import { Plus, X } from "lucide-react"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  })
  const [modules, setModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Tên dự án là bắt buộc")
      return
    }

    setLoading(true)
    try {
      const normalizedModules = modules.map(m => m.trim()).filter(m => !!m)
      await createProject({ 
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
        modules: normalizedModules 
      })
      
      toast.success(`Dự án "${formData.name}" đã được tạo.`)

      onOpenChange(false)
      setFormData({ name: "", description: "", status: "ACTIVE" })
      setModules([])
    } catch (error: any) {
      const message = error?.response?.data?.message || "Tạo dự án thất bại"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const addModuleField = () => setModules((prev) => [...prev, ""])
  const removeModuleField = (idx: number) => setModules((prev) => prev.filter((_, i) => i !== idx))
  const changeModuleValue = (idx: number, value: string) =>
    setModules((prev) => prev.map((m, i) => (i === idx ? value : m)))

  const resetForm = () => {
    setFormData({ name: "", description: "", status: "ACTIVE" })
    setModules([])
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo Dự án Mới</DialogTitle>
          <DialogDescription>Tạo một dự án mới để quản lý tài liệu và module</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên dự án *</Label>
              <Input
                id="name"
                placeholder="Nhập tên dự án..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về dự án..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                  <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Modules</Label>
                <Button type="button" size="sm" variant="outline" onClick={addModuleField} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Thêm Module
                </Button>
              </div>
              {modules.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có module nào. Nhấn "Thêm Module" để bắt đầu.</p>
              ) : (
                <ScrollArea className="h-32 pr-2">
                  <div className="space-y-2">
                    {modules.map((module, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Tên module #${idx + 1}`}
                          value={module}
                          onChange={(e) => changeModuleValue(idx, e.target.value)}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeModuleField(idx)}
                          className="h-8 w-8"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo Dự án"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


