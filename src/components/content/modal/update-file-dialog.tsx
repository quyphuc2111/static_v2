"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RefreshCw, Archive, Code, BookOpen, CheckCircle, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useUpdateContentFile } from "@/modules/content/hooks/useUpdateContentFile"
import { ContentItem } from "@/components/content/table"

interface UpdateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: ContentItem | null
  projectId: string
  moduleId: string
}

const contentTypes = [
  {
    id: "FILE_ZIP_HTML",
    name: "HTML Package",
    description: "File ZIP chứa HTML, CSS, JS",
    icon: Code,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "FILE_ZIP_SCORM",
    name: "SCORM Package",
    description: "File ZIP theo chuẩn SCORM",
    icon: BookOpen,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
]

export function UpdateFileDialog({ open, onOpenChange, content, projectId, moduleId }: UpdateFileDialogProps) {
  const [selectedType, setSelectedType] = useState<"FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [detectedLaunchFile, setDetectedLaunchFile] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const updateContentFileMut = useUpdateContentFile(projectId, moduleId)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && content) {
      // Set current content type as default
      setSelectedType(content.contentType as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")
      setFile(null)
      setDetectedLaunchFile(null)
      setIsAnalyzing(false)
    }
  }, [open, content])

  // Function to analyze ZIP file and find HTML launch file
  const analyzeZipFile = async (file: File) => {
    if (selectedType !== "FILE_ZIP_HTML") return
    
    setIsAnalyzing(true)
    setDetectedLaunchFile(null)
    
    try {
      // Create a temporary URL for the file
      const fileUrl = URL.createObjectURL(file)
      
      // Use JSZip to read the ZIP file
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      
      // Find HTML files
      const htmlFiles: string[] = []
      const indexFiles: string[] = []
      const subdirIndexFiles: string[] = []
      
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir) {
          const fileName = relativePath.toLowerCase()
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(relativePath)
            
            // Check for index files
            const baseName = fileName.split('/').pop() || ''
            if (baseName === 'index.html' || baseName === 'index.htm') {
              // Check if it's in a subdirectory
              const pathParts = relativePath.split('/')
              if (pathParts.length > 1) {
                subdirIndexFiles.push(relativePath)
              } else {
                indexFiles.push(relativePath)
              }
            }
          }
        }
      })
      
      // Determine launch file priority
      let launchFile: string | null = null
      
      if (subdirIndexFiles.length > 0) {
        // Prefer index.html in subdirectories first
        launchFile = subdirIndexFiles[0]
      } else if (indexFiles.length > 0) {
        // Then index.html in root directory
        launchFile = indexFiles[0]
      } else if (htmlFiles.length > 0) {
        // Finally, any HTML file
        launchFile = htmlFiles[0]
      }
      
      setDetectedLaunchFile(launchFile)
      
      // Clean up
      URL.revokeObjectURL(fileUrl)
      
    } catch (error) {
      console.error('Error analyzing ZIP file:', error)
      setDetectedLaunchFile(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    
    if (selectedFile && selectedType === "FILE_ZIP_HTML") {
      analyzeZipFile(selectedFile)
    } else {
      setDetectedLaunchFile(null)
    }
  }

  const handleContentTypeChange = (contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM") => {
    setSelectedType(contentType)
    
    // Re-analyze file if it's HTML type
    if (file && contentType === "FILE_ZIP_HTML") {
      analyzeZipFile(file)
    } else {
      setDetectedLaunchFile(null)
    }
  }

  const handleSubmit = async () => {
    if (!content || !selectedType || !file) {
      return
    }

    try {
      await updateContentFileMut.mutateAsync({
        contentId: content.id,
        payload: {
          contentType: selectedType,
          file
        }
      })
      
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by the hook
    }
  }

  const resetDialog = () => {
    setSelectedType("")
    setFile(null)
    setDetectedLaunchFile(null)
    setIsAnalyzing(false)
  }

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent className="bg-card border-border max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-foreground text-lg">Cập nhật File</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm space-y-1">
            <span className="block font-medium text-foreground">{content.title}</span>
            <span className="flex items-center gap-1.5 text-xs">
              <Info className="h-3 w-3" />
              {content.contentUrl}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">Loại tài liệu</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contentTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 border ${
                    selectedType === type.id 
                      ? `${type.borderColor} ${type.bgColor}` 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleContentTypeChange(type.id as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${type.bgColor}`}>
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">{type.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* File Upload */}
          {selectedType && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">
                File ZIP mới <span className="text-red-400">*</span>
              </Label>
              
              {!file ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all bg-background/30">
                  <Archive className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Chọn file ZIP mới
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Kéo thả hoặc click để chọn
                  </p>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-update"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById("file-update")?.click()}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Chọn File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Archive className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => {
                          setFile(null)
                          setDetectedLaunchFile(null)
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedType === "FILE_ZIP_HTML" && (
                    <div className="p-2 bg-muted/50 rounded border border-border">
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                          <p className="text-xs text-muted-foreground">Đang phân tích...</p>
                        </div>
                      ) : detectedLaunchFile ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Code className="h-3 w-3 text-green-400" />
                            <p className="text-xs font-medium text-foreground">File HTML:</p>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground pl-4 break-all">
                            {detectedLaunchFile}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-yellow-400" />
                          <p className="text-xs text-muted-foreground">Không tìm thấy HTML</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info about keeping the same path */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                File mới sẽ <strong className="text-foreground">giữ nguyên đường dẫn</strong> để các link đã chia sẻ vẫn hoạt động.
              </p>
            </div>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateContentFileMut.isPending}
          >
            Hủy
          </Button>
          <Button 
            type="button" 
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={updateContentFileMut.isPending || !selectedType || !file}
          >
            {updateContentFileMut.isPending ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-3 w-3" />
                Cập nhật
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
