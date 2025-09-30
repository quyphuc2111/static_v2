"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { z } from "zod"
import uniq from "lodash/uniq"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "react-toastify"

type Props = {
  onCreate: (name: string, modules: string[]) => Promise<any>
}

export function CreateProjectDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [modules, setModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; modules?: string } | null>(null)

  const schema = z.object({
    name: z.string().trim().min(1, "Tên dự án là bắt buộc").max(120, "Tên quá dài"),
    modules: z
      .array(z.string().trim().min(1, "Tên module không được rỗng").max(120, "Tên module quá dài"))
      .max(100, "Quá nhiều module")
      .optional(),
  })

  const handleCreate = async () => {
    setErrors(null)
    if (!name.trim()) {
      setErrors({ name: "Tên dự án là bắt buộc" })
      return
    }
    setLoading(true)
    try {
      const normalized = uniq(modules.map((m) => m.trim()).filter((m) => !!m))
      const parsed = schema.safeParse({ name: name.trim(), modules: normalized })
      if (!parsed.success) {
        const fieldErrors: { name?: string; modules?: string } = {}
        parsed.error.issues.forEach((i) => {
          if (i.path[0] === "name") fieldErrors.name = i.message
          if (i.path[0] === "modules") fieldErrors.modules = i.message
        })
        setErrors(fieldErrors)
        return
      }
      try {
        await onCreate(name.trim(), normalized)
        toast.success("Tạo dự án thành công")
      } catch (e: any) {
        const status = e?.response?.status
        const message = e?.response?.data?.message
        if (status === 409) {
          toast.error(message || "Tên dự án đã tồn tại")
        } else {
          toast.error("Tạo dự án thất bại")
        }
        return
      }
      setName("")
      setModules([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const addModuleField = () => setModules((prev) => [...prev, ""]) 
  const removeModuleField = (idx: number) => setModules((prev) => prev.filter((_, i) => i !== idx))
  const changeModuleValue = (idx: number, value: string) =>
    setModules((prev) => prev.map((m, i) => (i === idx ? value : m)))

  const resetForm = () => {
    setName("")
    setModules([])
    setErrors(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
     
      <DialogTrigger asChild>
        <Button>Tạo dự án</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo dự án mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Input placeholder="Tên dự án" value={name} onChange={(e) => setName(e.target.value)} />
            {errors?.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Modules</p>
              <Button size="sm" variant="secondary" onClick={addModuleField}>Thêm module</Button>
            </div>
            {modules.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có module nào. Nhấn "Thêm module" để bắt đầu.</p>
            ) : (
              <ScrollArea className="h-64 pr-2">
                <div className="space-y-2">
                  {modules.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={`Tên module #${idx + 1}`}
                        value={m}
                        onChange={(e) => changeModuleValue(idx, e.target.value)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeModuleField(idx)} aria-label="Xoá">
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {errors?.modules && <p className="text-xs text-red-500">{errors.modules}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { resetForm(); setOpen(false) }}>Huỷ</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || loading}>
              {loading ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


