"use client"

import { useMemo, useState } from "react"
import { Search, Calendar, User, FileText, Clock, UserMinus, Share2, RotateCcw, Edit, MoreHorizontal, Eye, EyeOff, Edit3, Trash2, Shield, Filter, SortAsc, SortDesc } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useContentShares, useRevokeContentShare, useShareContent, useUpdateContentShare } from "@/modules/rbac/hooks/useContentSharing"
import { toast } from "react-toastify"

const getTypeBadge = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case "project":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Dự án</Badge>
    case "module":
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Module</Badge>
    case "owner":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Owner</Badge>
    case "list":
      return <Badge variant="secondary">Danh sách</Badge>
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

const getPermissionBadges = (share: any) => {
  const items: any[] = []
  if (share?.canView) items.push(<Badge key="v" variant="outline">Xem</Badge>)
  if (share?.canEdit) items.push(<Badge key="e" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Sửa</Badge>)
  if (share?.canDelete) items.push(<Badge key="d" className="bg-red-500/20 text-red-400 border-red-500/30">Xóa</Badge>)
  return <div className="flex gap-1 flex-wrap">{items}</div>
}

export function SharingHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [showReshareDialog, setShowReshareDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [revokeShareId, setRevokeShareId] = useState<string>("")
  const [reshareData, setReshareData] = useState<any>(null)
  const [editData, setEditData] = useState<any>(null)
  const [permissions, setPermissions] = useState({
    canView: true,
    canEdit: false,
    canDelete: false
  })
  
  const { data: shares, isLoading } = useContentShares()
  const revokeShareMut = useRevokeContentShare()
  const shareContentMut = useShareContent()
  const updateShareMut = useUpdateContentShare()

  const filtered = useMemo(() => {
    let list = shares || []
    
    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter((s: any) =>
        (s.content?.title || '').toLowerCase().includes(q) ||
        (s.sharedBy?.name || s.sharedBy?.email || '').toLowerCase().includes(q) ||
        (s.sharedWith?.name || s.sharedWith?.email || '').toLowerCase().includes(q)
      )
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      list = list.filter((s: any) => s.status.toLowerCase() === statusFilter.toLowerCase())
    }
    
    // Sort
    list.sort((a: any, b: any) => {
      let aVal, bVal
      switch (sortBy) {
        case "title":
          aVal = a.content?.title || ""
          bVal = b.content?.title || ""
          break
        case "sharedBy":
          aVal = a.sharedBy?.name || a.sharedBy?.email || ""
          bVal = b.sharedBy?.name || b.sharedBy?.email || ""
          break
        case "sharedWith":
          aVal = a.sharedWith?.name || a.sharedWith?.email || ""
          bVal = b.sharedWith?.name || b.sharedWith?.email || ""
          break
        case "status":
          aVal = a.status
          bVal = b.status
          break
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    return list
  }, [shares, searchTerm, statusFilter, sortBy, sortOrder])

  const handleRevoke = () => {
    if (!revokeShareId) return
    revokeShareMut.mutate(
      { shareId: revokeShareId },
      {
        onSuccess: () => {
          toast.success("Đã thu hồi chia sẻ thành công")
          setShowRevokeDialog(false)
          setRevokeShareId("")
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Thu hồi thất bại")
        },
      }
    )
  }

  const handleReshare = () => {
    if (!reshareData) return
    shareContentMut.mutate(
      {
        contentId: reshareData.contentId,
        sharedWithId: reshareData.sharedWithId,
        canView: reshareData.canView,
        canEdit: reshareData.canEdit,
        canDelete: reshareData.canDelete
      },
      {
        onSuccess: () => {
          toast.success("Đã chia sẻ lại thành công")
          setShowReshareDialog(false)
          setReshareData(null)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Chia sẻ lại thất bại")
        },
      }
    )
  }

  const handleEditPermissions = () => {
    if (!editData) return
    updateShareMut.mutate(
      {
        shareId: editData.id,
        canView: permissions.canView,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật quyền thành công")
          setShowEditDialog(false)
          setEditData(null)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Cập nhật quyền thất bại")
        },
      }
    )
  }

  const handleEditClick = (item: any) => {
    setEditData(item)
    setPermissions({
      canView: item.canView,
      canEdit: item.canEdit,
      canDelete: item.canDelete
    })
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lịch sử..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="revoked">Đã thu hồi</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Thời gian</SelectItem>
              <SelectItem value="title">Tên tài liệu</SelectItem>
              <SelectItem value="sharedBy">Người chia sẻ</SelectItem>
              <SelectItem value="sharedWith">Người nhận</SelectItem>
              <SelectItem value="status">Trạng thái</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => {
                const today = new Date()
                const shareDate = new Date(s.createdAt)
                return shareDate.toDateString() === today.toDateString()
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lượt chia sẻ</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tuần này</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(s.createdAt) >= weekAgo
              }).length || 0}
            </div>
            <p className="text-xs text-green-400">7 ngày qua</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => s.status === 'ACTIVE').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Chia sẻ đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã thu hồi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {shares?.filter((s: any) => s.status === 'REVOKED').length || 0}
            </div>
            <p className="text-xs text-red-400">Chia sẻ đã thu hồi</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Lịch sử Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Loại</TableHead>
                <TableHead className="text-muted-foreground">Tài liệu</TableHead>
                <TableHead className="text-muted-foreground">Người chia sẻ</TableHead>
                <TableHead className="text-muted-foreground">Chia sẻ với</TableHead>
                <TableHead className="text-muted-foreground">Quyền</TableHead>
                <TableHead className="text-muted-foreground">Số lượng</TableHead>
                <TableHead className="text-muted-foreground">Thời gian</TableHead>
                <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-muted-foreground">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Đang tải...</TableCell>
                </TableRow>
              ) : filtered.map((item: any) => (
                <TableRow key={`${item.contentId}-${item.sharedWithId}-${item.createdAt}`} className="border-border">
                  <TableCell>{getTypeBadge(item?.batch?.scope)}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.content?.title || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(item.sharedBy?.name || item.sharedBy?.email || '').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">{item.sharedBy?.name || item.sharedBy?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.sharedWith?.name || item.sharedWith?.email}</TableCell>
                  <TableCell>{getPermissionBadges(item)}</TableCell>
                  <TableCell className="text-muted-foreground">{item?.batch?.itemsCount || 1}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Badge variant={item.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                      {item.status.toLowerCase() === 'active' ? 'Đang hoạt động' : 'Đã thu hồi'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.status.toLowerCase() === 'active' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(item)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa quyền
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setRevokeShareId(item.id)
                                  setShowRevokeDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Thu hồi chia sẻ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReshareData({
                              contentId: item.contentId,
                              sharedWithId: item.sharedWithId,
                              canView: item.canView,
                              canEdit: item.canEdit,
                              canDelete: item.canDelete
                            })
                            setShowReshareDialog(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Chia sẻ lại
                        </Button>
                      )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thu hồi chia sẻ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thu hồi chia sẻ này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận chia sẻ lại */}
      <Dialog open={showReshareDialog} onOpenChange={setShowReshareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chia sẻ lại</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn chia sẻ lại nội dung này không? Người dùng sẽ có thể truy cập lại nội dung.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReshareDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleReshare}
              disabled={shareContentMut.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {shareContentMut.isPending ? "Đang chia sẻ..." : "Chia sẻ lại"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa quyền */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Chỉnh sửa quyền chia sẻ
            </DialogTitle>
            <DialogDescription>
              Thay đổi quyền truy cập cho người dùng này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canView"
                  checked={permissions.canView}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canView: !!checked }))
                  }
                />
                <Label htmlFor="canView" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Xem nội dung
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEdit"
                  checked={permissions.canEdit}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canEdit: !!checked }))
                  }
                />
                <Label htmlFor="canEdit" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa nội dung
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDelete"
                  checked={permissions.canDelete}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canDelete: !!checked }))
                  }
                />
                <Label htmlFor="canDelete" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Xóa nội dung
                </Label>
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Quyền "Xem" là bắt buộc. Nếu bỏ chọn, người dùng sẽ không thể truy cập nội dung.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleEditPermissions}
              disabled={updateShareMut.isPending || !permissions.canView}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateShareMut.isPending ? "Đang cập nhật..." : "Cập nhật quyền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
