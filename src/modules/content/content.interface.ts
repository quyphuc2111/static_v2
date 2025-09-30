export type ContentData = {
  id: string
  title: string
  description?: string
  contentUrl: string
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  status: "PROCESSING" | "COMPLETED" | "FAILED"
  progress: number
  fileSize?: number
  isDeleted: boolean
  projectId: string
  moduleId: string
  ownerId?: string
  owner?: { id: string; name?: string | null; email: string } | null
  createdAt: string
  updatedAt: string
}

export type CreateContentPayload = {
  title: string
  description?: string
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  file: File
}

export type UpdateContentPayload = {
  title?: string
  description?: string
}

export type ContentStats = {
  total: number
  completed: number
  processing: number
  failed: number
}
