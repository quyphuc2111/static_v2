const cachedKeys = {
    auth: {
        me: ["auth", "me"],
    },
    rbac: {
        roles: ["rbac", "roles"],
        permissions: ["rbac", "permissions"],
        users: ["rbac", "users"],
        userRoles: (userId: string) => ["rbac", "userRoles", userId],
        contentSharing: ["rbac", "contentSharing"],
    },
    content: {
        list: (projectId: string, moduleId: string) => ["content", projectId, moduleId],
        stats: (projectId?: string) => projectId ? ["content", "stats", projectId] : ["content", "stats"],
    },
}

export default cachedKeys