import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { ContentItem } from "@/components/content/table"

interface HardDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function HardDeleteDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
  isDeleting = false
}: HardDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xóa vĩnh viễn nội dung?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Bạn có chắc chắn muốn <span className="font-semibold text-destructive">XÓA VĨNH VIỄN</span> nội dung <span className="font-semibold text-foreground">"{content?.title}"</span>?
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tất cả dữ liệu và file liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

