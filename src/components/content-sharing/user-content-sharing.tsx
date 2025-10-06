"use client"

import { useMemo, useState } from "react"
import { UserCheck, ArrowRight, FileText, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUsers } from "@/modules/rbac/hooks"
import { useBulkShareContent, useContentShares, useRevokeContentShare } from "@/modules/rbac/hooks/useContentSharing"
import { toast } from "react-toastify"

export function UserContentSharing() {
  const [sourceUser, setSourceUser] = useState<string>("")
  const [targetUser, setTargetUser] = useState<string>("")
  const [shareAll, setShareAll] = useState(true)
  const [permission, setPermission] = useState("view")
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeShareId, setRevokeShareId] = useState<string>("")

  const { data: users, isLoading: usersLoading } = useUsers()
  const bulkShareMut = useBulkShareContent()
  const { data: contentShares } = useContentShares()
  const revokeShareMut = useRevokeContentShare()

  const sourceUserData = useMemo(() => (users || []).find((u: any) => u.id === sourceUser), [users, sourceUser])
  const targetUserData = useMemo(() => (users || []).find((u: any) => u.id === targetUser), [users, targetUser])

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

  const getUserShares = (userId: string) => {
    return (contentShares || []).filter((share: any) => 
      share.status === "ACTIVE" && 
      (share.ownerId === userId || share.sharedWithId === userId)
    )
  }

  const handleShare = () => {
    if (!sourceUser || !targetUser) return
    const canView = true
    const canEdit = permission === "edit"
    const canDelete = permission === "download" ? false : false

    bulkShareMut.mutate(
      { ownerId: sourceUser, sharedWithId: targetUser, canView, canEdit, canDelete },
      {
        onSuccess: (res: any) => {
          toast.success(`Đã chia sẻ toàn bộ nội dung của owner`)
        },
        onError: (e: any) => {
          toast.error(e?.response?.data?.message || e?.message || "Chia sẻ thất bại")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Chia sẻ</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-green-400">Theo thời gian</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tài liệu Chia sẻ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-blue-400">Theo người dùng</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chia sẻ Toàn bộ</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Trong tháng này</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Chia sẻ Nội dung giữa Người dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-foreground">Người dùng nguồn</Label>
              <Select value={sourceUser} onValueChange={setSourceUser}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-center">
              <ArrowRight className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Người dùng đích</Label>
              <Select value={targetUser} onValueChange={setTargetUser}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {(users || [])
                    .filter((u: any) => u.id !== sourceUser)
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceUser && targetUser && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(sourceUserData?.name || sourceUserData?.email || "").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{sourceUserData?.name || sourceUserData?.email}</p>
                    <p className="text-sm text-muted-foreground">Owner</p>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-primary" />

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{targetUserData?.name || targetUserData?.email}</p>
                    <p className="text-sm text-muted-foreground">Người nhận</p>
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(targetUserData?.name || targetUserData?.email || "").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="share-all" checked={shareAll} onCheckedChange={(checked) => setShareAll(!!checked)} />
                  <label htmlFor="share-all" className="text-sm font-medium text-foreground cursor-pointer">
                    Chia sẻ toàn bộ nội dung của người dùng nguồn
                  </label>
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
                      <SelectItem value="download">Xem và tải xuống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleShare}
                    disabled={!sourceUser || !targetUser || usersLoading || bulkShareMut.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {bulkShareMut.isPending ? "Đang chia sẻ..." : `Chia sẻ toàn bộ`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Shares Section */}
          {(sourceUser || targetUser) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Chia sẻ hiện tại</h3>
              {sourceUser && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Chia sẻ của {sourceUserData?.name || sourceUserData?.email}
                  </h4>
                  {getUserShares(sourceUser).map((share: any) => (
                    <div key={share.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {((users || []).find((u: any) => u.id === share.sharedWithId)?.name || 
                              (users || []).find((u: any) => u.id === share.sharedWithId)?.email || "").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(users || []).find((u: any) => u.id === share.sharedWithId)?.name || 
                             (users || []).find((u: any) => u.id === share.sharedWithId)?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {share.canEdit ? "Chỉnh sửa" : share.canDelete ? "Tải xuống" : "Chỉ xem"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevokeShareId(share.id)
                          setShowRevokeDialog(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Thu hồi
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {targetUser && targetUser !== sourceUser && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Chia sẻ của {targetUserData?.name || targetUserData?.email}
                  </h4>
                  {getUserShares(targetUser).map((share: any) => (
                    <div key={share.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {((users || []).find((u: any) => u.id === share.sharedWithId)?.name || 
                              (users || []).find((u: any) => u.id === share.sharedWithId)?.email || "").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(users || []).find((u: any) => u.id === share.sharedWithId)?.name || 
                             (users || []).find((u: any) => u.id === share.sharedWithId)?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {share.canEdit ? "Chỉnh sửa" : share.canDelete ? "Tải xuống" : "Chỉ xem"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevokeShareId(share.id)
                          setShowRevokeDialog(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Thu hồi
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thu hồi chia sẻ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thu hồi quyền chia sẻ này không? Hành động này không thể hoàn tác.
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
    </div>
  )
}
