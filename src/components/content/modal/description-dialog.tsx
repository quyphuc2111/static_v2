"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    title: string
    description?: any
  } | null
}

export function DescriptionDialog({ 
  open, 
  onOpenChange, 
  content 
}: DescriptionDialogProps) {
  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mô tả chi tiết - {content.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {content.description ? (
            (() => {
              const desc = content.description
              if (typeof desc === 'object' && desc) {
                const entries = Object.entries(desc)
                return (
                  <div className="space-y-4">
                    {entries.map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-2 text-foreground">{key}</h4>
                        <div className="bg-muted/50 rounded p-3">
                          {typeof value === 'object' && value !== null ? (
                            <pre className="text-sm text-foreground whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-foreground">{String(value)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              return (
                <div className="bg-muted/50 rounded p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap">
                    {String(desc)}
                  </pre>
                </div>
              )
            })()
          ) : (
            <p className="text-muted-foreground">Không có mô tả</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
