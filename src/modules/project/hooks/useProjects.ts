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

  const updateMut = useMutation<{ id: string; name: string }, unknown, { id: string; name: string }>({
    mutationFn: ({ id, name }) => updateProject(id, { name }),
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
    updateProject: (id: string, name: string) => updateMut.mutateAsync({ id, name }),
    deleteProject: deleteMut.mutateAsync,
  }
}


