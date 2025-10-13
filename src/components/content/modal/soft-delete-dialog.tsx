import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { ContentItem } from "@/components/content/table"

interface SoftDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function SoftDeleteDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
  isDeleting = false
}: SoftDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Xóa mềm nội dung?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Bạn có chắc chắn muốn chuyển nội dung <span className="font-semibold text-foreground">"{content?.title}"</span> vào thùng rác?
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                ℹ️ Nội dung sẽ được lưu trữ trong thùng rác và có thể khôi phục sau này.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isDeleting ? "Đang xóa..." : "Xóa mềm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

