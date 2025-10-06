"use client"

import { useState, useMemo } from "react"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { useModules } from "@/modules/project/hooks/useModules"
import { useContent } from "@/modules/content/hooks/useContent"
import { useContentStats } from "@/modules/content/hooks/useContentStats"
import { useDeleteContent } from "@/modules/content/hooks/useDeleteContent"
import { useRestoreContent } from "@/modules/content/hooks/useRestoreContent"
import { useUpdateContent } from "@/modules/content/hooks/useUpdateContent"
import { useDownloadContent } from "@/modules/content/hooks/useDownloadContent"
import { useBulkDeleteContent } from "@/modules/content/hooks/useBulkDeleteContent"
import { useUploadContentFile } from "@/modules/content/hooks/useUploadContentFile"
import { useUpdateContentFile } from "@/modules/content/hooks/useUpdateContentFile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileSpreadsheet, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateContentDialog, EditContentDialog, DeleteContentDialog, SCORMInfoDialog, DescriptionDialog, UploadMissingFilesDialog, UploadFileDialog, UpdateFileDialog } from "./modal"
import { ImportExcelDialog } from "./modal/import-excel-dialog"
import { DataTable, createContentColumns, type ContentItem } from "@/components/content/table"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { PermissionName } from "@prisma/client"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { useUserPermissions } from "@/modules/rbac/hooks"

// Helper function to get SCORM info
const getSCORMInfo = (content: ContentItem) => {
  if (content.contentType === "FILE_ZIP_SCORM" && content.description) {
    const desc = content.description
    if (typeof desc === 'object' && desc) return desc.scorm || null
    try {
      const parsed = JSON.parse(desc)
      return parsed.scorm || null
    } catch {
      return null
    }
  }
  return null
}

// Helper function to get content URL
const getContentUrl = (content: ContentItem) => {
  const desc: any = content.description
  const scorm = typeof desc === 'object' && desc ? desc.scorm : null
  const launchFile = typeof desc === 'object' && desc ? desc.launchFile : null
  
  if (content.contentType === 'FILE_ZIP_SCORM' && scorm && launchFile) {
    const raw = `/uploads${content.contentUrl}/${launchFile}`
    return raw.replace(/\/+/g, '/').replace('/uploads/uploads', '/uploads')
  } else if (content.contentType === 'FILE_ZIP_HTML' && launchFile) {
    const raw = `/uploads${content.contentUrl}/${launchFile}`
    return raw.replace(/\/+/g, '/').replace('/uploads/uploads', '/uploads')
  } else {
    return `/uploads${content.contentUrl}`.replace('/uploads/uploads', '/uploads')
  }
}

export function ContentManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showUploadMissingDialog, setShowUploadMissingDialog] = useState(false)
  const [showUploadFileDialog, setShowUploadFileDialog] = useState(false)
  const [showUpdateFileDialog, setShowUpdateFileDialog] = useState(false)
  const [contentToUpload, setContentToUpload] = useState<ContentItem | null>(null)
  const [contentToUpdate, setContentToUpdate] = useState<ContentItem | null>(null)
  const [projectId, setProjectId] = useState<string>("")
  const [moduleId, setModuleId] = useState<string>("")
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null)

  const projectsQuery = useProjects()
  const modulesQuery = useModules(projectId, !!projectId)
  const contentQuery = useContent(projectId, moduleId, !!projectId && !!moduleId)
  const statsQuery = useContentStats(projectId)
  const { user: me } = useAuth()
  const { isAdmin, hasPermission, hasAnyPermission } = useUserPermissions()
  const deleteContentMut = useDeleteContent(projectId, moduleId)
  const restoreContentMut = useRestoreContent(projectId, moduleId)
  const updateContentMut = useUpdateContent(projectId, moduleId)
  const downloadContentMut = useDownloadContent(projectId, moduleId)
  const bulkDeleteContentMut = useBulkDeleteContent(projectId, moduleId)
  const uploadContentFileMut = useUploadContentFile(projectId, moduleId)
  const updateContentFileMut = useUpdateContentFile(projectId, moduleId)

  const contentData = contentQuery.data || []

  // Action handlers
  const handleView = (content: ContentItem) => {
    const url = getContentUrl(content)
    if (content.contentType === 'FILE_ZIP_SCORM') {
      const scormUrl = `/scorm/view?entry=${encodeURIComponent(url)}`
      window.open(scormUrl, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }

  const handleCopyUrl = async (content: ContentItem) => {
    const url = getContentUrl(content)
    let fullUrl: string
    
    if (content.contentType === 'FILE_ZIP_SCORM') {
      const scormUrl = `/scorm/view?entry=${encodeURIComponent(url)}`
      fullUrl = `${window.location.origin}${scormUrl}`
    } else {
      fullUrl = `${window.location.origin}${url}`
    }
    
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedUrl(content.id)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleShowSCORMInfo = (content: ContentItem) => {
    setSelectedContent(content)
  }

  const handleEdit = (content: ContentItem) => {
    setContentToEdit(content)
    setShowEditDialog(true)
  }

  const handleDownload = (content: ContentItem) => {
    downloadContentMut.mutate(content.id)
  }

  const handleDelete = (content: ContentItem) => {
    setContentToDelete(content)
    setShowDeleteDialog(true)
  }

  const handleRestore = (content: ContentItem) => {
    if (confirm(`Bạn có muốn khôi phục nội dung "${content.title}"?`)) {
      restoreContentMut.mutate(content.id)
    }
  }

  const handleDescriptionClick = (content: ContentItem) => {
    setSelectedDescription({
      title: content.title,
      description: content.description
    })
    setShowDescriptionDialog(true)
  }

  const handleUploadFile = (content: ContentItem) => {
    setContentToUpload(content)
    setShowUploadFileDialog(true)
  }

  const handleUpdateFile = (content: ContentItem) => {
    setContentToUpdate(content)
    setShowUpdateFileDialog(true)
  }

  const handleConfirmDelete = () => {
    if (contentToDelete) {
      deleteContentMut.mutate(contentToDelete.id, {
        onSuccess: () => {
          setShowDeleteDialog(false)
          setContentToDelete(null)
        }
      })
    }
  }

  const handleBulkDelete = (selectedItems: ContentItem[]) => {
    const contentIds = selectedItems.map(item => item.id)
    bulkDeleteContentMut.mutate(contentIds, {
      onSuccess: (data) => {
        console.log(`Successfully deleted ${data.deletedCount} items`)
        // You could add a toast notification here
      },
      onError: (error) => {
        console.error('Bulk delete failed:', error)
        // You could add error handling here
      }
    })
  }

  // Create columns with action handlers
  const columns = useMemo(() => createContentColumns({
    onView: handleView,
    onCopyUrl: handleCopyUrl,
    onShowSCORMInfo: handleShowSCORMInfo,
    onEdit: handleEdit,
    onDownload: handleDownload,
    onDelete: handleDelete,
    onRestore: handleRestore,
    onDescriptionClick: handleDescriptionClick,
    onUploadFile: handleUploadFile,
    onUpdateFile: handleUpdateFile,
    copiedUrl,
    isDownloading: downloadContentMut.isPending,
    isDeleting: deleteContentMut.isPending,
    isRestoring: restoreContentMut.isPending,
    isUploading: uploadContentFileMut.isPending,
    isUpdating: updateContentFileMut.isPending
  }, { 
    isAdmin, 
    currentUserId: me?.id 
  }), [copiedUrl, downloadContentMut.isPending, deleteContentMut.isPending, restoreContentMut.isPending, uploadContentFileMut.isPending, updateContentFileMut.isPending, isAdmin, me?.id])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Quản lý Nội dung</h2>
          <p className="text-muted-foreground">Quản lý tất cả tài liệu và nội dung trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setModuleId("") }}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={projectsQuery.isLoading ? "Đang tải dự án..." : "Chọn dự án"} />
              </SelectTrigger>
              <SelectContent>
                {projectsQuery.projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Select value={moduleId} onValueChange={setModuleId} disabled={!projectId || modulesQuery.isLoading}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={!projectId ? "Chọn dự án trước" : (modulesQuery.isLoading ? "Đang tải module..." : "Chọn module")} />
              </SelectTrigger>
              <SelectContent>
                {modulesQuery.data?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {projectId && moduleId && (
            <PermissionGuard permissions={[PermissionName.CREATE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]}>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Tạo Nội dung Mới
              </Button>
            </PermissionGuard>
          )}
          <PermissionGuard permissions={[PermissionName.CREATE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]}>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Nhập Excel
            </Button>
          </PermissionGuard>
          {/* {projectId && moduleId && (
            <PermissionGuard permissions={[PermissionName.CREATE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]}>
              <Button variant="outline" onClick={() => setShowUploadMissingDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </PermissionGuard>
          )} */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsQuery.data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Tất cả nội dung</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsQuery.data?.completed || 0}</div>
            <p className="text-xs text-green-400">Đã xử lý xong</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsQuery.data?.processing || 0}</div>
            <p className="text-xs text-blue-400">Đang upload/giải nén</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Thất bại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsQuery.data?.failed || 0}</div>
            <p className="text-xs text-red-400">Cần xử lý lại</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Danh sách Tài liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {contentQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải nội dung...
            </div>
          ) : !projectId || !moduleId ? (
            <div className="text-center py-8 text-muted-foreground">
              Vui lòng chọn dự án và module
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={contentData}
              searchKey="title"
              searchPlaceholder="Tìm kiếm tài liệu..."
              showColumnVisibility={true}
              showPagination={true}
              showSelection={true}
              pageSize={10}
              contextMenuActions={{
                onView: handleView,
                onCopyUrl: handleCopyUrl,
                onShowSCORMInfo: handleShowSCORMInfo,
                onEdit: handleEdit,
                onDownload: handleDownload,
                onDelete: handleDelete,
                onRestore: handleRestore,
                onUploadFile: handleUploadFile,
                onUpdateFile: handleUpdateFile,
                copiedUrl,
                isDownloading: downloadContentMut.isPending,
                isDeleting: deleteContentMut.isPending,
                isRestoring: restoreContentMut.isPending,
                isUploading: uploadContentFileMut.isPending,
                isUpdating: updateContentFileMut.isPending,
                currentUserId: me?.id
              }}
              bulkActions={{
                onBulkDelete: handleBulkDelete,
                isBulkDeleting: bulkDeleteContentMut.isPending
              }}
            />
          )}
        </CardContent>
      </Card>

      <CreateContentDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        projectId={projectId}
        moduleId={moduleId}
      />

      {/* Edit Content Dialog */}
      <EditContentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        content={contentToEdit}
        projectId={projectId}
        moduleId={moduleId}
      />

      {/* SCORM Info Dialog */}
      <SCORMInfoDialog
        open={!!selectedContent && !!getSCORMInfo(selectedContent)}
        onOpenChange={() => setSelectedContent(null)}
        content={selectedContent}
        scormData={selectedContent ? getSCORMInfo(selectedContent) : null}
      />

      {/* Description Dialog */}
      <DescriptionDialog
        open={showDescriptionDialog}
        onOpenChange={setShowDescriptionDialog}
        content={selectedDescription}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteContentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        content={contentToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteContentMut.isPending}
      />

      <ImportExcelDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        projectId={projectId}
        moduleId={moduleId}
      />

      <UploadMissingFilesDialog
        open={showUploadMissingDialog}
        onOpenChange={setShowUploadMissingDialog}
        projectId={projectId}
        moduleId={moduleId}
      />

      <UploadFileDialog
        open={showUploadFileDialog}
        onOpenChange={setShowUploadFileDialog}
        content={contentToUpload}
        projectId={projectId}
        moduleId={moduleId}
      />

      <UpdateFileDialog
        open={showUpdateFileDialog}
        onOpenChange={setShowUpdateFileDialog}
        content={contentToUpdate}
        projectId={projectId}
        moduleId={moduleId}
      />
    </div>
  )
}