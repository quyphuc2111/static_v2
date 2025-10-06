"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Settings, Database, Code, Info, BookOpen } from "lucide-react"

interface DescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    title: string
    description?: any
  } | null
}

const getFieldIcon = (key: string) => {
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('scorm')) return BookOpen
  if (lowerKey.includes('launch') || lowerKey.includes('file')) return FileText
  if (lowerKey.includes('config') || lowerKey.includes('setting')) return Settings
  if (lowerKey.includes('data') || lowerKey.includes('meta')) return Database
  return Info
}

const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const isSystemField = (key: string) => {
  return ['scorm', 'launchFile'].includes(key)
}

export function DescriptionDialog({ 
  open, 
  onOpenChange, 
  content 
}: DescriptionDialogProps) {
  if (!content) return null

  const desc = content.description
  const hasDescription = desc && typeof desc === 'object' && Object.keys(desc).length > 0

  // Separate system fields and user fields
  const systemFields: [string, any][] = []
  const userFields: [string, any][] = []

  if (hasDescription) {
    Object.entries(desc).forEach(([key, value]) => {
      if (isSystemField(key)) {
        systemFields.push([key, value])
      } else {
        userFields.push([key, value])
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[750px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <DialogTitle className="text-xl">Chi tiết Metadata</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{content.title}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <div className="space-y-6">
            {!hasDescription ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Không có metadata cho nội dung này
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* System Fields (SCORM, LaunchFile) */}
                {systemFields.length > 0 && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4 text-amber-500" />
                        Cấu hình Hệ thống
                        <Badge variant="secondary" className="text-xs">System Fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Field</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemFields.map(([key, value]) => {
                            const Icon = getFieldIcon(key)
                            const isJson = typeof value === 'object' && value !== null
                            
                            return (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-amber-500" />
                                    <span className="font-mono text-sm">{key}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isJson ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Click để xem chi tiết ({Object.keys(value).length} fields)
                                      </summary>
                                      <pre className="mt-2 p-3 bg-muted/50 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </details>
                                  ) : (
                                    <span className="text-sm font-mono text-foreground">
                                      {formatValue(value)}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {systemFields.length > 0 && userFields.length > 0 && <Separator />}

                {/* User-Defined Fields */}
                {userFields.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Metadata Tùy chỉnh
                        <Badge variant="outline" className="text-xs">{userFields.length} fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {userFields.map(([key, value]) => {
                          const Icon = getFieldIcon(key)
                          const isJson = typeof value === 'object' && value !== null
                          const isLongText = typeof value === 'string' && value.length > 100
                          
                          return (
                            <div 
                              key={key} 
                              className="p-4 rounded-lg border border-muted hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2 min-w-[150px]">
                                  <Icon className="h-4 w-4 text-blue-500 shrink-0" />
                                  <span className="font-semibold text-sm">{key}</span>
                                </div>
                                <div className="flex-1">
                                  {isJson ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-sm text-primary hover:underline">
                                        Object ({Object.keys(value).length} properties)
                                      </summary>
                                      <pre className="mt-2 p-3 bg-card border rounded text-xs overflow-x-auto">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </details>
                                  ) : isLongText ? (
                                    <details className="cursor-pointer">
                                      <summary className="text-sm text-primary hover:underline">
                                        Text ({value.length} characters)
                                      </summary>
                                      <div className="mt-2 p-3 bg-muted/30 rounded text-sm">
                                        {value}
                                      </div>
                                    </details>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Code className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm text-foreground">
                                        {formatValue(value)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

