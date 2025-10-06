"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleManagement } from "@/components/rbac/role-management"
import { UserRoleManagement } from "@/components/rbac/user-role-management"
import { PermissionsMatrix } from "@/components/rbac/permissions-matrix"
import { RoleTemplates } from "@/components/rbac/role-templates"

export default function RBACPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản lý Quyền hạn</h1>
        <p className="text-muted-foreground">Quản lý vai trò và quyền hạn trong hệ thống</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-1/3 grid-cols-2">
          <TabsTrigger value="roles">Vai trò & Quyền hạn</TabsTrigger>
          <TabsTrigger value="matrix">Bảng phân quyền</TabsTrigger>
          {/* <TabsTrigger value="users">Phân quyền</TabsTrigger>
          <TabsTrigger value="templates">Mẫu có sẵn</TabsTrigger> */}
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <PermissionsMatrix />
        </TabsContent>

        {/* <TabsContent value="users" className="space-y-6">
          <UserRoleManagement />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <RoleTemplates />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}
