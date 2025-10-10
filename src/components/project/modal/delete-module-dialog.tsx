"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeleteModule } from "@/modules/project/hooks/useDeleteModule"
import { toast } from "react-toastify"

interface DeleteModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string | null
  module: {
    id: string
    name: string
  } | null
}

export function DeleteModuleDialog({ open, onOpenChange, projectId, module }: DeleteModuleDialogProps) {
  const deleteMutation = useDeleteModule()

  const handleDelete = async () => {
    if (!module || !projectId) return
    try {
      await deleteMutation.mutateAsync({ projectId, moduleId: module.id })
      toast.success("Xóa module thành công")
      onOpenChange(false)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Xóa module thất bại"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Xóa module?</DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Module
            {module ? ` "${module.name}"` : ""} sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Đang xoá..." : "Xóa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



