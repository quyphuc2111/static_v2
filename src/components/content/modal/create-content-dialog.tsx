"use client"

import type React from "react"
import { useState } from "react"
import { Upload, Archive, Code, BookOpen, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreateContent } from "@/modules/content/hooks/useCreateContent"
import { CreateContentPayload } from "@/modules/content/content.interface"
import { toast } from "react-toastify"

interface CreateContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

type DescriptionItem = {
  id: string
  key: string
  value: string
}

export function CreateContentDialog({ open, onOpenChange, projectId, moduleId }: CreateContentDialogProps) {
  const [selectedType, setSelectedType] = useState<"FILE_ZIP_HTML" | "FILE_ZIP_SCORM" | "">("")
  const [title, setTitle] = useState("")
  const [descriptionItems, setDescriptionItems] = useState<DescriptionItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detectedLaunchFile, setDetectedLaunchFile] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const createContentMut = useCreateContent(projectId, moduleId)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedType || !title || !file) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Convert description items to JSON
      const descriptionJson = descriptionItems.reduce((acc, item) => {
        if (item.key.trim() && item.value.trim()) {
          acc[item.key.trim()] = item.value.trim()
        }
        return acc
      }, {} as Record<string, string>)

      const payload: CreateContentPayload = {
        title: title.trim(),
        description: Object.keys(descriptionJson).length > 0 ? JSON.stringify(descriptionJson) : undefined,
        contentType: selectedType,
        file,
      }

      await createContentMut.mutateAsync(payload)
      
      // Reset form
      resetForm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedType("")
    setTitle("")
    setDescriptionItems([])
    setFile(null)
    setDetectedLaunchFile(null)
    setIsAnalyzing(false)
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile)
      if (selectedType === "FILE_ZIP_HTML") {
        analyzeZipFile(droppedFile)
      }
    } else {
      toast.error("Vui lòng chọn file ZIP")
    }
  }

  const addDescriptionItem = () => {
    const newItem: DescriptionItem = {
      id: Date.now().toString(),
      key: "",
      value: ""
    }
    setDescriptionItems([...descriptionItems, newItem])
  }

  const removeDescriptionItem = (id: string) => {
    setDescriptionItems(descriptionItems.filter(item => item.id !== id))
  }

  const updateDescriptionItem = (id: string, field: 'key' | 'value', value: string) => {
    setDescriptionItems(descriptionItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent 
        className="bg-card border-border overflow-hidden flex flex-col w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-6xl h-[90vh] sm:h-[85vh] md:h-[80vh] p-4 sm:p-6"
      >
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-foreground text-lg sm:text-xl">Tạo Nội dung mới</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Upload file ZIP (HTML hoặc SCORM) để tạo nội dung học tập
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-2 min-h-0">
            <div className="space-y-4 sm:space-y-6 pr-2">
            {/* Content Type Selection */}
            <div className="space-y-3">
              <Label className="text-foreground font-medium text-sm sm:text-base">Chọn loại nội dung <span className="text-red-400">*</span></Label>
              <div className="grid grid-cols-1 gap-3">
                {contentTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      selectedType === type.id 
                        ? `${type.borderColor} ${type.bgColor} shadow-md` 
                        : "border-border hover:border-primary/50 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setSelectedType(type.id as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM")
                      // Re-analyze file if it's HTML type
                      if (file && type.id === "FILE_ZIP_HTML") {
                        analyzeZipFile(file)
                      } else {
                        setDetectedLaunchFile(null)
                      }
                    }}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type.bgColor} flex-shrink-0`}>
                          <type.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${type.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">{type.name}</h3>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-4 sm:space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium text-sm sm:text-base">
                  Tiêu đề <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề nội dung"
                  className="bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Description Key-Value */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-foreground font-medium text-sm sm:text-base">
                    Mô tả chi tiết 
                    {descriptionItems.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (có thể scroll để xem thêm)
                      </span>
                    )}
                  </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDescriptionItem}
                      className="h-8 px-3 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm
                    </Button>
                  </div>
                  
                  {descriptionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      <p className="text-sm">Chưa có mô tả nào</p>
                      <p className="text-xs">Click "Thêm" để thêm thông tin chi tiết</p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg bg-background/50 backdrop-blur-sm">
                      <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto p-3 space-y-3">
                        {descriptionItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start">
                            <div className="flex-1 space-y-2 w-full">
                              <Input
                                placeholder="Tên thuộc tính (VD: Tác giả, Phiên bản)"
                                value={item.key}
                                onChange={(e) => updateDescriptionItem(item.id, 'key', e.target.value)}
                                className="bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                              />
                              <Input
                                placeholder="Giá trị (VD: Nguyễn Văn A, 1.0)"
                                value={item.value}
                                onChange={(e) => updateDescriptionItem(item.id, 'value', e.target.value)}
                                className="bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDescriptionItem(item.id)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload */}
              {selectedType ? (
                <div className="space-y-4">
                  <Label className="text-foreground font-medium text-sm sm:text-base">
                    Upload File ZIP <span className="text-red-400">*</span>
                  </Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all duration-200 bg-background/30 backdrop-blur-sm ${
                      isDragging 
                        ? "border-primary bg-primary/10 scale-[1.02]" 
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Archive className={`mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className={`font-medium mb-1 text-sm sm:text-base ${isDragging ? "text-primary" : "text-foreground"}`}>
                          {isDragging ? "Thả file vào đây" : "Kéo thả file ZIP vào đây"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Hoặc click để chọn file từ máy tính
                        </p>
                      </div>
                      <Input
                        id="file"
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById("file")?.click()}
                        className="bg-muted/50 border-border hover:bg-muted w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Chọn File ZIP
                      </Button>
                    </div>
                    {file && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2">
                            <Archive className="h-5 w-5 text-blue-400" />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {selectedType === "FILE_ZIP_HTML" && (
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            {isAnalyzing ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                <p className="text-xs sm:text-sm text-muted-foreground">Đang phân tích file ZIP...</p>
                              </div>
                            ) : detectedLaunchFile ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Code className="h-4 w-4 text-green-400" />
                                  <p className="text-xs sm:text-sm font-medium text-foreground">File HTML chính được phát hiện:</p>
                                </div>
                                <div className="bg-background/50 rounded p-2 border border-border">
                                  <p className="text-xs sm:text-sm font-mono text-foreground break-all">
                                    {detectedLaunchFile}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  File này sẽ được sử dụng làm trang chủ khi xem nội dung
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4 text-yellow-400" />
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Không tìm thấy file HTML trong ZIP
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Requirements Info */}
                  <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border">
                    <h4 className="font-medium text-foreground mb-2 text-sm sm:text-base">Yêu cầu file:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                      <li>• File phải có định dạng .zip</li>
                      <li>• HTML Package: Chứa file HTML, CSS, JS</li>
                      <li>• SCORM Package: Tuân thủ chuẩn SCORM 1.2 hoặc 2004</li>
                      <li>• Kích thước tối đa: ∞</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Placeholder khi chưa chọn loại nội dung */}
                  <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center bg-muted/20">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 rounded-full bg-muted/50 border border-border">
                        <Archive className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-medium text-foreground">
                          Chọn loại nội dung trước
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                          Vui lòng chọn loại nội dung (HTML Package hoặc SCORM Package) ở trên để có thể upload file ZIP
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span>Đang chờ lựa chọn</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Requirements Info */}
                  <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border">
                    <h4 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Yêu cầu file:
                    </h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>File phải có định dạng .zip</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>HTML Package: Chứa file HTML, CSS, JS</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>HTML Package: Chứa file index.html</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>SCORM Package: Tuân thủ chuẩn SCORM 1.2 hoặc 2004</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>Kích thước tối đa: Không giới hạn</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-3 pt-4 flex-shrink-0 flex-col sm:flex-row border-t border-border mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2"
              disabled={isSubmitting || !selectedType || !title || !file}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo Nội dung"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
