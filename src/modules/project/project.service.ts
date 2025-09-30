import httpService from "@/services/instance"
import { PROJECTS_API_URL } from "@/constants/apiUrl"

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  modules?: { id: string; name: string }[]
}

export async function listProjects() {
  const res = await httpService.get<{ data: Project[] }>({ url: PROJECTS_API_URL.ROOT })
  return res.data
}

export async function createProject(payload: { name: string; modules?: string[] }) {
  const res = await httpService.post<{ data: Project }>({ url: PROJECTS_API_URL.ROOT, data: payload })
  return res.data
}

export async function updateProject(id: string, payload: { name: string }) {
  const res = await httpService.patch<{ data: Project }>({ url: PROJECTS_API_URL.BY_ID(id), data: payload })
  return res.data
}

export async function deleteProject(id: string) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.BY_ID(id) })
}

export async function listModules(projectId: string) {
  const res = await httpService.get<{ data: { id: string; name: string }[] }>({ url: PROJECTS_API_URL.MODULES(projectId) })
  return res.data
}

export async function createModule(projectId: string, name: string) {
  const res = await httpService.post<{ data: { id: string; name: string } }>({ url: PROJECTS_API_URL.MODULES(projectId), data: { name } })
  return res.data
}

export async function updateModule(projectId: string, moduleId: string, name: string) {
  const res = await httpService.patch<{ data: { id: string; name: string } }>({ url: PROJECTS_API_URL.MODULE_BY_ID(projectId, moduleId), data: { name } })
  return res.data
}

export async function deleteModule(projectId: string, moduleId: string) {
  return httpService.delete<{ success: boolean }>({ url: PROJECTS_API_URL.MODULE_BY_ID(projectId, moduleId) })
}


