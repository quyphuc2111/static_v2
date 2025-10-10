"use client"

import { useMemo, useState } from "react"
import { Search, Package, Share2, Users, MoreHorizontal, Edit, Trash2, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useProjects } from "@/modules/project/hooks/useProjects"
import { useModules } from "@/modules/project/hooks/useModules"
import { useUsers } from "@/modules/rbac/hooks"
import { useBulkShareContent, useContentShares, useRevokeContentShare } from "@/modules/rbac/hooks/useContentSharing"
import { toast } from "react-toastify"

export function ModuleSharing() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [permission, setPermission] = useState("view")
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeShareId, setRevokeShareId] = useState<string | null>(null)

  const { projects, isLoading: projectsLoading } = useProjects()
  const { data: modules, isLoading: modulesLoading } = useModules(selectedProjectId, !!selectedProjectId)
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: contentShares } = useContentShares()
  const bulkShareMut = useBulkShareContent()
  const revokeShareMut = useRevokeContentShare()

  const filteredModules = useMemo(() => {
    const list: any[] = (modules || [])
    return list.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [modules, searchTerm])

  const handleShare = () => {
    if (!selectedModuleId || selectedUsers.length === 0 || !selectedProjectId) return
    const canView = true
    const canEdit = permission === "edit" || permission === "admin"
    const canDelete = permission === "admin"

    selectedUsers.forEach((uid) => {
      bulkShareMut.mutate(
        { projectId: selectedProjectId, moduleId: selectedModuleId, sharedWithId: uid, canView, canEdit, canDelete },
        {
          onSuccess: (res: any) => {
            toast.success(`Đã chia sẻ module`)
            setShowShareDialog(false)
            setSelectedUsers([])
          },
          onError: (e: any) => {
            toast.error(e?.response?.data?.message || e?.message || "Chia sẻ thất bại")
          },
        }
      )
    })
  }

  const handleRevoke = () => {
    if (!revokeShareId) return
    
    revokeShareMut.mutate(
      { shareId: revokeShareId },
      {
        onSuccess: () => {
          toast.success("Đã thu hồi quyền chia sẻ thành công")
          setShowRevokeDialog(false)
          setRevokeShareId(null)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Thu hồi thất bại")
        },
      }
    )
  }

  const getModuleShares = (moduleId: string) => {
    return (contentShares || []).filter((share: any) => 
      share.contentData?.moduleId === moduleId && share.status === 'ACTIVE'
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-2 md:grid-cols-2 w-full md:w-auto">
          <div className="space-y-1">
            <Label>Dự án</Label>
            <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedModuleId(null) }}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder="Chọn dự án" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                ) : (projects || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tìm Module</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
                disabled={!selectedProjectId}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Module</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{modules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Trên dự án đã chọn</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Module Chia sẻ</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-green-400">Theo mỗi lần chia sẻ</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Người dùng Truy cập</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-blue-400">Theo từng lần chia sẻ</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Danh sách Module</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Tên Module</TableHead>
                <TableHead className="text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedProjectId ? (
                <TableRow className="border-border">
                  <TableCell colSpan={2} className="text-center text-muted-foreground">Chọn dự án để xem module</TableCell>
                </TableRow>
              ) : modulesLoading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={2} className="text-center text-muted-foreground">Đang tải module...</TableCell>
                </TableRow>
              ) : filteredModules.map((module: any) => (
                <TableRow key={module.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{module.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog open={showShareDialog && selectedModuleId === module.id} onOpenChange={setShowShareDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedModuleId(module.id)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Chia sẻ
                          </Button>
                        </DialogTrigger>

                      {getModuleShares(module.id).length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedModuleId(module.id)
                            setRevokeShareId(getModuleShares(module.id)[0]?.id)
                            setShowRevokeDialog(true)
                          }}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Thu hồi ({getModuleShares(module.id).length})
                        </Button>
                      )}
                        <DialogContent className="max-w-2xl bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Chia sẻ Module: {module.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-foreground">Chọn người dùng</Label>
                              <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                {(users || []).map((user: any) => (
                                  <div key={user.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`module-user-${user.id}`}
                                      checked={selectedUsers.includes(user.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedUsers([...selectedUsers, user.id])
                                        } else {
                                          setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                                        }
                                      }}
                                    />
                                    <label htmlFor={`module-user-${user.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                      </div>
                                      <Badge variant="outline">User</Badge>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-foreground">Quyền truy cập</Label>
                              <Select value={permission} onValueChange={setPermission}>
                                <SelectTrigger className="bg-muted/50 border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="view">Chỉ xem</SelectItem>
                                  <SelectItem value="edit">Xem và chỉnh sửa</SelectItem>
                                  <SelectItem value="admin">Quản trị viên</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                                Hủy
                              </Button>
                              <Button onClick={handleShare} disabled={selectedUsers.length === 0 || usersLoading || bulkShareMut.isPending}>
                                {bulkShareMut.isPending ? "Đang chia sẻ..." : `Chia sẻ (${selectedUsers.length})`}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog xác nhận thu hồi */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Xác nhận thu hồi quyền chia sẻ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bạn có chắc chắn muốn thu hồi quyền chia sẻ module này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRevoke}
                disabled={revokeShareMut.isPending}
              >
                {revokeShareMut.isPending ? "Đang thu hồi..." : "Thu hồi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
