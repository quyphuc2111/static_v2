"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Shield, UserCheck, UserX, Key } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateUserDialog } from "./create-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { AssignRoleDialog } from "./assign-role-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"

// Live data via useUsers

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoạt động</Badge>
    case "DISABLED":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không hoạt động</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { data: users, isLoading, remove, toggleStatus } = useUsers()

  const safeUsers = users ?? []
  const filteredUsers = useMemo(() =>
    safeUsers.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
    )
  , [safeUsers, searchTerm])

  const activeUsers = safeUsers.filter((user) => user.status === "ACTIVE").length
  const pendingUsers = 0
  const totalDocuments = 0

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleAssignRole = (user: any) => {
    setSelectedUser(user)
    setShowAssignRoleDialog(true)
  }

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleStatus.mutateAsync(user.id)
      const action = user.status === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt"
      toast.success(`Đã ${action} tài khoản thành công!`)
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái tài khoản")
    }
  }

  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setShowResetPasswordDialog(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Quản lý Người dùng</h2>
          <p className="text-muted-foreground">Quản lý tài khoản và quyền truy cập của người dùng</p>
        </div>
        <PermissionGuard permission={PermissionName.CREATE_USERS}>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Thêm Người dùng
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Người dùng</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{safeUsers.length}</div>
            <p className="text-xs text-green-400">+3 từ tháng trước</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang Hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
            <p className="text-xs text-green-400">+2 từ tuần trước</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ Xác nhận</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingUsers}</div>
            <p className="text-xs text-yellow-400">+1 từ hôm qua</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tài liệu Tạo</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalDocuments}</div>
            <p className="text-xs text-blue-400">Tổng từ tất cả người dùng</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Danh sách Người dùng</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80 bg-muted/50 border-border"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Người dùng</TableHead>
                <TableHead className="text-muted-foreground">Username</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Vai trò</TableHead>
                <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={"/placeholder.svg"} alt={user.name || user.username} />
                        <AvatarFallback>{(user.name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{user.name || user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((userRole) => (
                          <Badge 
                            key={userRole.roleId} 
                            variant="secondary"
                            className="text-xs"
                          >
                            {userRole.role?.name || "Unknown"}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa có vai trò</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGuard permission={PermissionName.EDIT_USERS}>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard permission={PermissionName.MANAGE_USER_PERMISSIONS}>
                        <DropdownMenuItem onClick={() => handleAssignRole(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Phân quyền
                        </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard permission={PermissionName.EDIT_USERS}>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Key className="mr-2 h-4 w-4" />
                          Đặt lại mật khẩu
                        </DropdownMenuItem>
                        </PermissionGuard>
                        <DropdownMenuSeparator />
                        <PermissionGuard permission={PermissionName.EDIT_USERS}>
                        {user.status === "ACTIVE" ? (
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)} disabled={toggleStatus.isPending}>
                            <UserX className="mr-2 h-4 w-4" />
                            Vô hiệu hóa
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)} disabled={toggleStatus.isPending}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Kích hoạt
                          </DropdownMenuItem>
                        )}
                        </PermissionGuard>
                        <PermissionGuard permission={PermissionName.HARD_DELETE_USERS}>
                        <DropdownMenuItem className="text-red-400" onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <EditUserDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        user={selectedUser} 
      />
      <DeleteUserDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        user={selectedUser} 
      />
      <AssignRoleDialog 
        open={showAssignRoleDialog} 
        onOpenChange={setShowAssignRoleDialog} 
        user={selectedUser} 
      />
      <ResetPasswordDialog 
        open={showResetPasswordDialog} 
        onOpenChange={setShowResetPasswordDialog} 
        user={selectedUser} 
      />
    </div>
  )
}
