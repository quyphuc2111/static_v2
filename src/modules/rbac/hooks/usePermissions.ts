import { useQuery } from "@tanstack/react-query"
import { getPermissions } from "../rbac.service"

export function usePermissions() {
  return useQuery({
    queryKey: ["rbac", "permissions"],
    queryFn: getPermissions,
  })
}
