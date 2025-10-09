export { useProjects } from "./useProjects"
export { useModules } from "./useModules"
export { useUpdateProject } from "./useUpdateProject"
export { useCreateModule } from "./useCreateModule"
export { useUpdateModule } from "./useUpdateModule"
export { useDeleteModule } from "./useDeleteModule"

// New action hooks
export {
  useSoftDeleteProject,
  useHardDeleteProject,
  useRestoreProject,
} from "./useProjectActions"

export {
  useSoftDeleteModule,
  useHardDeleteModule,
  useRestoreModule,
} from "./useModuleActions"
