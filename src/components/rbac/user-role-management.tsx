"use client"

import { useState } from "react"
import { Plus, UserCheck, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUsers, useRoles } from "@/modules/rbac/hooks"
import { AssignRoleDialog } from "./assign-role-dialog"

export function UserRoleManagement() {
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: roles, isLoading: rolesLoading } = useRoles()

  const handleAssignRole = (user: any) => {
    setSelectedUser(user)
    setShowAssignDialog(true)
  }

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "ADMINISTRATOR":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Quản trị viên</Badge>
      case "DEV":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Nhà phát triển</Badge>
      case "TESTER":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Người kiểm thử</Badge>
      default:
        return <Badge variant="secondary">{roleName}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Phân quyền Người dùng</h2>
          <p className="text-muted-foreground">Gán vai trò và quyền hạn cho người dùng</p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Gán Vai trò
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Người dùng</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Người dùng trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Có Vai trò</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(user => user.roles && user.roles.length > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Người dùng có vai trò</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vai trò Hoạt động</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Vai trò có sẵn</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng & Vai trò</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải danh sách người dùng...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.name || "Chưa có tên"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          user.status === "ACTIVE" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }
                      >
                        {user.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((userRole) => (
                            <div key={userRole.roleId}>
                              {getRoleBadge(userRole.role?.name || "")}
                            </div>
                          ))
                        ) : (
                          <Badge variant="outline">Chưa có vai trò</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAssignRole(user)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Quản lý Vai trò
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssignRoleDialog 
        open={showAssignDialog} 
        onOpenChange={setShowAssignDialog}
        user={selectedUser}
      />
    </div>
  )
}
