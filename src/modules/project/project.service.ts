import httpService from "@/services/instance"
import { PROJECTS_API_URL } from "@/constants/apiUrl"

export type Project = {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  modules?: { 
    id: string
    name: string
    description?: string
    status: "ACTIVE" | "INACTIVE"
    isDeleted: boolean
    deletedAt?: string | null
    content?: any[]
  }[]
}

export async function listProjects(params?: { includeDeleted?: boolean; onlyDeleted?: boolean }) {
  const searchParams = new URLSearchParams()
  if (params?.includeDeleted) searchParams.set('includeDeleted', 'true')
  if (params?.onlyDeleted) searchParams.set('onlyDeleted', 'true')
  
  const url = `${PROJECTS_API_URL.ROOT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const res = await httpService.get<{ data: Project[] }>({ url })
  return res.data
}

export async function createProject(payload: { 
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  modules?: string[] 
}) {
  const res = await httpService.post<{ data: Project }>({ url: PROJECTS_API_URL.ROOT, data: payload })
  return res.data
}

export async function updateProject(id: string, payload: { 
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED"
}) {
  const res = await httpService.patch<{ data: Project }>({ url: PROJECTS_API_URL.BY_ID(id), data: payload })
  return res.data
}

export async function deleteProject(id: string) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.BY_ID(id) })
}

export async function listModules(projectId: string) {
  const res = await httpService.get<{ data: { id: string; name: string; description?: string; status: "ACTIVE" | "INACTIVE" }[] }>({ url: PROJECTS_API_URL.MODULES(projectId) })
  return res.data
}

export async function createModule(payload: {
  projectId: string
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE"
}) {
  const res = await httpService.post<{ data: { id: string; name: string; description?: string; status: string } }>({ 
    url: PROJECTS_API_URL.MODULES(payload.projectId), 
    data: { name: payload.name, description: payload.description, status: payload.status || "ACTIVE" } 
  })
  return res.data
}

export async function updateModule(payload: {
  projectId: string
  moduleId: string
  name: string
  description?: string
  status?: "ACTIVE" | "INACTIVE"
}) {
  const res = await httpService.patch<{ data: { id: string; name: string; description?: string; status: string } }>({ 
    url: PROJECTS_API_URL.MODULE_BY_ID(payload.projectId, payload.moduleId), 
    data: { name: payload.name, description: payload.description, status: payload.status || "ACTIVE" } 
  })
  return res.data
}

export async function deleteModule(args: { projectId: string; moduleId: string }) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.MODULE_BY_ID(args.projectId, args.moduleId) })
}

export async function getModuleContentCount(moduleId: string) {
  const res = await httpService.get<{ data: { count: number } }>({ 
    url: `projects/modules/${moduleId}/content/count` 
  })
  return res.data
}


