"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject, deleteProject, listProjects, updateProject } from "../project.service"

const QUERY_KEY = ["projects", "list"]

export function useProjects() {
  const qc = useQueryClient()

  const listQuery = useQuery({ queryKey: QUERY_KEY, queryFn: listProjects })

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; description?: string; status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" }) => 
      updateProject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
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


