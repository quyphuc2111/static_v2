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
      
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir) {
          const fileName = relativePath.toLowerCase()
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(relativePath)
            
            // Check for index files
            const baseName = fileName.split('/').pop() || ''
            if (baseName === 'index.html' || baseName === 'index.htm') {
              indexFiles.push(relativePath)
            }
          }
        }
      })
      
      // Determine launch file priority
      let launchFile: string | null = null
      
      if (indexFiles.length > 0) {
        // Prefer index.html or index.htm
        launchFile = indexFiles[0]
      } else if (htmlFiles.length > 0) {
        // Use first HTML file found
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
        className="bg-card border-border"
        style={{ 
          width: '60vw', 
          maxWidth: '60vw', 
          height: '90vh',
          maxHeight: '90vh'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">Tạo Nội dung Mới</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload file ZIP (HTML hoặc SCORM) để tạo nội dung học tập
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-6 pr-2">
            {/* Content Type Selection */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium">Chọn loại nội dung</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type.bgColor}`}>
                          <type.icon className={`h-6 w-6 ${type.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground font-medium">
                    Tiêu đề <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề nội dung"
                    className="bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Description Key-Value */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground font-medium">
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
                      className="h-8 px-3"
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
                      <ScrollArea className="h-[250px]">
                        <div className="p-3 space-y-3">
                          {descriptionItems.map((item) => (
                            <div key={item.id} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-2">
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
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - File Upload */}
              <div className="space-y-6">
                {/* File Upload */}
                <div className="space-y-4">
                  <Label className="text-foreground font-medium">
                    Upload File ZIP <span className="text-red-400">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 bg-background/30 backdrop-blur-sm">
                    <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          Kéo thả file ZIP vào đây
                        </p>
                        <p className="text-sm text-muted-foreground">
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
                        className="bg-muted/50 border-border hover:bg-muted"
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
                                <p className="text-sm text-muted-foreground">Đang phân tích file ZIP...</p>
                              </div>
                            ) : detectedLaunchFile ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Code className="h-4 w-4 text-green-400" />
                                  <p className="text-sm font-medium text-foreground">File HTML chính được phát hiện:</p>
                                </div>
                                <div className="bg-background/50 rounded p-2 border border-border">
                                  <p className="text-sm font-mono text-foreground break-all">
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
                                <p className="text-sm text-muted-foreground">
                                  Không tìm thấy file HTML trong ZIP
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements Info */}
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-foreground mb-2">Yêu cầu file:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• File phải có định dạng .zip</li>
                    <li>• HTML Package: Chứa file HTML, CSS, JS</li>
                    <li>• SCORM Package: Tuân thủ chuẩn SCORM 1.2 hoặc 2004</li>
                    <li>• Kích thước tối đa: ∞</li>
                  </ul>
                </div>
              </div>
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-3 pt-4 border-t border-border flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
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
