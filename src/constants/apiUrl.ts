const rawBase = process.env.NEXT_PUBLIC_BASE_URL || ""
const normalizedBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase
export const API_BASE_URL = normalizedBase ? `${normalizedBase}/api` : "/api"

export const AUTH_API_URL = {
    LOGIN: "auth/login",
    LOGOUT: "auth/logout",
    ME: "auth/me",
}

export const PROJECTS_API_URL = {
    ROOT: "projects",
    BY_ID: (id: string) => `projects/${id}`,
    MODULES: (id: string) => `projects/${id}/modules`,
    MODULE_BY_ID: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}`,
}

export const CONTENT_API_URL = {
    ROOT: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content`,
    BY_ID: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}`,
    DOWNLOAD: (projectId: string, moduleId: string, contentId: string) => `projects/${projectId}/modules/${moduleId}/content/${contentId}/download`,
    BULK_DELETE: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content/bulk-delete`,
  IMPORT: (projectId: string, moduleId: string) => `projects/${projectId}/modules/${moduleId}/content/import`,
    STATS: (projectId?: string) => projectId ? `projects/${projectId}/content/stats` : "content/stats",
}
