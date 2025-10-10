"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject, deleteProject, listProjects, updateProject } from "../project.service"

export function useProjects(params?: { includeDeleted?: boolean; onlyDeleted?: boolean }) {
  const qc = useQueryClient()
  
  const queryKey = ["projects", "list", params]

  const listQuery = useQuery({ 
    queryKey, 
    queryFn: () => listProjects(params)
  })

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; description?: string; status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" }) => 
      updateProject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })

  return {
    projects: listQuery.data,
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    createProject: createMut.mutateAsync,
    updateProject: (id: string, payload: { name: string; description?: string; status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" }) => 
      updateMut.mutateAsync({ id, ...payload }),
    deleteProject: deleteMut.mutateAsync,
  }
}


