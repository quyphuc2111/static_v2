"use client"

import { useState, useMemo } from "react"
import { get, isObject } from "lodash"
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
import { useSoftDeleteContent } from "@/modules/content/hooks/useSoftDeleteContent"
import { useHardDeleteContent } from "@/modules/content/hooks/useHardDeleteContent"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileSpreadsheet, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateContentDialog, EditContentDialog, DeleteContentDialog, SCORMInfoDialog, DescriptionDialog, UploadMissingFilesDialog, UploadFileDialog, UpdateFileDialog } from "./modal"
import { ImportExcelDialog } from "./modal/import-excel-dialog"
import { DataTable, createContentColumns, type ContentItem } from "@/components/content/table"
import { DescriptionFilter, applyDescriptionFilters, type DescriptionFilterValue } from "./description-filter"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { PermissionName } from "@prisma/client"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { useUserPermissions } from "@/modules/rbac/hooks"
import { getContentUrl, getScormContentUrl } from "@/utils/content"
import { toast } from "react-toastify"

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
  const [descriptionFilters, setDescriptionFilters] = useState<DescriptionFilterValue[]>([])
  const [showDeleted, setShowDeleted] = useState(false)

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
  const softDeleteContentMut = useSoftDeleteContent(projectId, moduleId)
  const hardDeleteContentMut = useHardDeleteContent(projectId, moduleId)

  const rawContentData = contentQuery.data || []
  
  // Filter by deleted status and apply description filters
  const contentData = useMemo(() => {
    const filteredByDeleted = rawContentData.filter(item => 
      showDeleted ? item.isDeleted : !item.isDeleted
    )
    return applyDescriptionFilters(filteredByDeleted, descriptionFilters)
  }, [rawContentData, descriptionFilters, showDeleted])
  
  // Calculate stats for current view
  const activeContent = rawContentData.filter(item => !item.isDeleted)
  const deletedContent = rawContentData.filter(item => item.isDeleted)

  // Action handlers
  const handleView = (content: ContentItem) => {
    // Check permission to view content
    if (!hasPermission(PermissionName.VIEW_CONTENT) && !isAdmin) {
      toast.error("Bạn không có quyền xem nội dung này")
      return
    }
    
    const url = getContentUrl(content)
    if (content.contentType === 'FILE_ZIP_SCORM') {
      const scormUrl = getScormContentUrl(content)
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
    // Check permission to edit content
    if (!hasAnyPermission([PermissionName.EDIT_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền chỉnh sửa nội dung này")
      return
    }
    
    setContentToEdit(content)
    setShowEditDialog(true)
  }

  const handleDownload = (content: ContentItem) => {
    // Check permission to download content
    
    downloadContentMut.mutate(content.id)
  }

  const handleDelete = (content: ContentItem) => {
    // Check permission to delete content
    if (!hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền xóa nội dung này")
      return
    }
    
    setContentToDelete(content)
    setShowDeleteDialog(true)
  }

  const handleRestore = (content: ContentItem) => {
    // Check permission to restore content
    if (!hasAnyPermission([PermissionName.RESTORE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền khôi phục nội dung này")
      return
    }
    
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
    if (!hasAnyPermission([PermissionName.EDIT_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền upload file cho nội dung này")
      return
    }
    
    // Kiểm tra xem đã chọn loại nội dung chưa
    if (!content.contentType || content.contentType.trim() === '') {
      toast.error("Bạn cần chọn loại nội dung trước khi upload file")
      return
    }
    
    setContentToUpload(content)
    setShowUploadFileDialog(true)
  }

  const handleUpdateFile = (content: ContentItem) => {
    if (!hasAnyPermission([PermissionName.EDIT_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền cập nhật file cho nội dung này")
      return
    }
    
    // Kiểm tra xem đã chọn loại nội dung chưa
    if (!content.contentType || content.contentType.trim() === '') {
      toast.error("Bạn cần chọn loại nội dung trước khi cập nhật file")
      return
    }
    
    setContentToUpdate(content)
    setShowUpdateFileDialog(true)
  }

  const handleSoftDelete = (content: ContentItem) => {
    // Check permission to soft delete content
    if (!hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền xóa mềm nội dung này")
      return
    }
    
    if (confirm(`Bạn có muốn chuyển nội dung "${content.title}" vào thùng rác?`)) {
      softDeleteContentMut.mutate(content.id)
    }
  }

  const handleHardDelete = (content: ContentItem) => {
    // Check permission to hard delete content
    if (!hasAnyPermission([PermissionName.HARD_DELETE_CONTENT, PermissionName.MANAGE_ALL_CONTENT]) && !isAdmin) {
      toast.error("Bạn không có quyền xóa vĩnh viễn nội dung này")
      return
    }
    
    if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN nội dung "${content.title}"? Hành động này không thể hoàn tác!`)) {
      hardDeleteContentMut.mutate(content.id)
    }
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
        toast.success(`Đã xóa ${data.deletedCount} nội dung thành công`)
      },
      onError: (error) => {
        toast.error("Bulk delete failed")
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
    onRestore: handleRestore,
    onDescriptionClick: handleDescriptionClick,
    onUploadFile: handleUploadFile,
    onUpdateFile: handleUpdateFile,
    onSoftDelete: handleSoftDelete,
    onHardDelete: handleHardDelete,
    copiedUrl,
    isDownloading: downloadContentMut.isPending,
    isRestoring: restoreContentMut.isPending,
    isUploading: uploadContentFileMut.isPending,
    isUpdating: updateContentFileMut.isPending,
    isSoftDeleting: softDeleteContentMut.isPending,
    isHardDeleting: hardDeleteContentMut.isPending
  }, { 
    isAdmin, 
    currentUserId: me?.id 
  }), [copiedUrl, downloadContentMut.isPending, deleteContentMut.isPending, restoreContentMut.isPending, uploadContentFileMut.isPending, updateContentFileMut.isPending, softDeleteContentMut.isPending, hardDeleteContentMut.isPending, isAdmin, me?.id])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Quản lý Nội dung</h2>
          <p className="text-sm md:text-base text-muted-foreground">Quản lý tất cả tài liệu và nội dung trong hệ thống</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto flex-wrap">
          <div className="w-full sm:w-56">
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
          <div className="w-full sm:w-56">
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <PermissionGuard permissions={[PermissionName.CREATE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]}>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tạo Nội dung mới</span>
                <span className="sm:hidden">Tạo Mới</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissions={[PermissionName.CREATE_CONTENT, PermissionName.MANAGE_OWN_CONTENT]}>
            <Button variant="outline" onClick={() => setShowImportDialog(true)} className="w-full sm:w-auto">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nhập Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </PermissionGuard>
          </div>
          )}
        </div>
      </div>

      <div className=" gap-4 md:grid-cols-4 hidden md:grid">
        <Card className={`bg-card border-border ${showDeleted ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {showDeleted ? "Nội dung Đã Xóa" : "Tổng Nội dung"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {showDeleted ? deletedContent.length : activeContent.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {showDeleted ? "nội dung đã xóa" : "đang hoạt động"}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-card border-border ${showDeleted ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {showDeleted 
                ? deletedContent.filter(c => c.status === 'COMPLETED').length
                : activeContent.filter(c => c.status === 'COMPLETED').length
              }
            </div>
            <p className="text-xs text-green-400">Đã xử lý xong</p>
          </CardContent>
        </Card>

        <Card className={`bg-card border-border ${showDeleted ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {showDeleted 
                ? deletedContent.filter(c => c.status === 'PROCESSING').length
                : activeContent.filter(c => c.status === 'PROCESSING').length
              }
            </div>
            <p className="text-xs text-blue-400">Đang upload/giải nén</p>
          </CardContent>
        </Card>

        <Card className={`bg-card border-border ${showDeleted ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Thất bại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {showDeleted 
                ? deletedContent.filter(c => c.status === 'FAILED').length
                : activeContent.filter(c => c.status === 'FAILED').length
              }
            </div>
            <p className="text-xs text-red-400">Cần xử lý lại</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-foreground text-lg sm:text-xl">Danh sách Tài liệu</CardTitle>
              <CardDescription className="text-sm">Quản lý tất cả nội dung trong dự án và module</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {projectId && moduleId && (
                <PermissionGuard permissions={[PermissionName.VIEW_DELETED_ALL_CONTENT, PermissionName.VIEW_DELETED_OWN_CONTENT]}>
                  <Tabs value={showDeleted ? "deleted" : "active"} onValueChange={(v) => setShowDeleted(v === "deleted")} className="w-full sm:w-auto">
                    <TabsList className="w-full sm:w-auto grid grid-cols-2">
                      <TabsTrigger value="active" className="text-xs sm:text-sm">Đang hoạt động</TabsTrigger>
                      <TabsTrigger value="deleted" className="text-xs sm:text-sm">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Đã xóa
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </PermissionGuard>
              )}
              {projectId && moduleId && rawContentData.length > 0 && (
                <DescriptionFilter
                  data={rawContentData}
                  onFilterChange={setDescriptionFilters}
                  activeFilters={descriptionFilters}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className=" w-[calc(100vw-40px)] md:w-full">
          {contentQuery.isLoading ? (
            <div className="text-center py-8 px-4 text-muted-foreground">
              Đang tải nội dung...
            </div>
          ) : !projectId || !moduleId ? (
            <div className="text-center py-8 px-4 text-muted-foreground">
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
              showSelection={false}
              pageSize={10}
              contextMenuActions={{
                onView: handleView,
                onCopyUrl: handleCopyUrl,
                onShowSCORMInfo: handleShowSCORMInfo,
                onEdit: handleEdit,
                onDownload: handleDownload,
                onRestore: handleRestore,
                onUploadFile: handleUploadFile,
                onUpdateFile: handleUpdateFile,
                onSoftDelete: handleSoftDelete,
                onHardDelete: handleHardDelete,
                copiedUrl,
                isDownloading: downloadContentMut.isPending,
                isRestoring: restoreContentMut.isPending,
                isUploading: uploadContentFileMut.isPending,
                isUpdating: updateContentFileMut.isPending,
                isSoftDeleting: softDeleteContentMut.isPending,
                isHardDeleting: hardDeleteContentMut.isPending,
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