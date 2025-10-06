"use client"

import { useState, useEffect, useMemo } from "react"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { debounce } from "lodash"
import { DataTable, Project } from "./table"

interface ProjectListProps {
  searchQuery: string
}

export function ProjectList({ searchQuery }: ProjectListProps) {
  const { projects, isLoading, deleteProject } = useProjects()
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery)
    return () => {
      debouncedSetSearchQuery.cancel()
    }
  }, [searchQuery, debouncedSetSearchQuery])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
    )
  }, [projects, debouncedSearchQuery])

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <DataTable 
      data={filteredProjects as Project[]} 
      onDelete={handleDeleteProject}
    />
  )
}
