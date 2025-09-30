import { useQuery } from "@tanstack/react-query"
import { getUsers } from "../rbac.service"

export function useUsers() {
  return useQuery({
    queryKey: ["rbac", "users"],
    queryFn: getUsers,
  })
}
