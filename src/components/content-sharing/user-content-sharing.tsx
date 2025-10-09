"use client"

import { useMemo, useState } from "react"
import { UserCheck, ArrowRight, FileText, UserMinus, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useUsers } from "@/modules/rbac/hooks"
import { useBulkShareContent, useContentShares, useRevokeContentShare } from "@/modules/rbac/hooks/useContentSharing"
import { useUserOwnedContent } from "@/modules/content/hooks/useUserOwnedContent"
import { toast } from "react-toastify"

export function UserContentSharing() {
  const [sourceUser, setSourceUser] = useState<string>("")
  const [targetUser, setTargetUser] = useState<string>("")
  const [shareAll, setShareAll] = useState(true)
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([])
  const [permission, setPermission] = useState("view")
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeShareId, setRevokeShareId] = useState<string>("")

  const { data: users, isLoading: usersLoading } = useUsers()
  const bulkShareMut = useBulkShareContent()
  const { data: contentShares } = useContentShares()
  const revokeShareMut = useRevokeContentShare()
  const { data: userContent, isLoading: contentLoading } = useUserOwnedContent(sourceUser)

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

  // Get shares where user is the one who shared (sharedById)
  const getUserSharesAsSharer = (userId: string) => {
    return (contentShares || []).filter((share: any) => 
      share.status === "ACTIVE" && share.sharedById === userId
    )
  }

  // Get shares where user is the recipient (sharedWithId)
  const getUserSharesAsRecipient = (userId: string) => {
    return (contentShares || []).filter((share: any) => 
      share.status === "ACTIVE" && share.sharedWithId === userId
    )
  }

  const handleShare = () => {
    if (!sourceUser || !targetUser) return
    
    if (!shareAll && selectedContentIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nội dung để chia sẻ")
      return
    }
    
    const canView = true
    const canEdit = permission === "edit"
    const canDelete = permission === "download" ? false : false

    const payload = shareAll 
      ? { ownerId: sourceUser, sharedWithId: targetUser, canView, canEdit, canDelete }
      : { contentIds: selectedContentIds, sharedWithId: targetUser, canView, canEdit, canDelete }

    bulkShareMut.mutate(payload, {
      onSuccess: (res: any) => {
        const count = shareAll ? "toàn bộ nội dung" : `${selectedContentIds.length} nội dung`
        toast.success(`Đã chia sẻ ${count} thành công`)
        setSelectedContentIds([])
      },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message || e?.message || "Chia sẻ thất bại")
      },
    })
  }

  const toggleContentSelection = (contentId: string) => {
    setSelectedContentIds(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedContentIds.length === (userContent || []).length) {
      setSelectedContentIds([])
    } else {
      setSelectedContentIds((userContent || []).map(c => c.id))
    }
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
                <SelectContent className="max-h-[300px]">
                  {(users || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{user.name || user.username}</span>
                        <span className="text-xs text-muted-foreground">
                          @{user.username}
                          {user.email && ` · ${user.email}`}
                        </span>
                      </div>
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
                <SelectContent className="max-h-[300px]">
                  {(users || [])
                    .filter((u: any) => u.id !== sourceUser)
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{user.name || user.username}</span>
                          <span className="text-xs text-muted-foreground">
                            @{user.username}
                            {user.email && ` · ${user.email}`}
                          </span>
                        </div>
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
                    <p className="font-medium text-foreground">{sourceUserData?.name || sourceUserData?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      @{sourceUserData?.username}
                      {sourceUserData?.email && ` · ${sourceUserData?.email}`}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-primary" />

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{targetUserData?.name || targetUserData?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      @{targetUserData?.username}
                      {targetUserData?.email && ` · ${targetUserData?.email}`}
                    </p>
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
                  <Checkbox 
                    id="share-all" 
                    checked={shareAll} 
                    onCheckedChange={(checked) => {
                      setShareAll(!!checked)
                      if (checked) setSelectedContentIds([])
                    }} 
                  />
                  <label htmlFor="share-all" className="text-sm font-medium text-foreground cursor-pointer">
                    Chia sẻ toàn bộ nội dung của người dùng nguồn
                  </label>
                </div>

                {/* Individual Content Selection */}
                {!shareAll && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Chọn nội dung cụ thể</Label>
                      {userContent && userContent.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleSelectAll}
                          className="h-7 text-xs"
                        >
                          {selectedContentIds.length === userContent.length ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Bỏ chọn tất cả
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-3 w-3 mr-1" />
                              Chọn tất cả
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {contentLoading ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Đang tải nội dung...
                      </div>
                    ) : !userContent || userContent.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                        Người dùng này chưa có nội dung nào
                      </div>
                    ) : (
                      <ScrollArea className="h-[280px] border border-border rounded-lg">
                        <div className="p-3 space-y-2">
                          {userContent.map((content) => (
                            <Card
                              key={content.id}
                              className={`cursor-pointer transition-all ${
                                selectedContentIds.includes(content.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => toggleContentSelection(content.id)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedContentIds.includes(content.id)}
                                    onCheckedChange={() => toggleContentSelection(content.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {content.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {content.project?.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">→</span>
                                      <Badge variant="outline" className="text-xs">
                                        {content.module?.name}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    {userContent && userContent.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Đã chọn: <span className="font-medium text-foreground">{selectedContentIds.length}</span> / {userContent.length}
                      </p>
                    )}
                  </div>
                )}

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
                    disabled={!sourceUser || !targetUser || usersLoading || bulkShareMut.isPending || (!shareAll && selectedContentIds.length === 0)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {bulkShareMut.isPending ? "Đang chia sẻ..." : (
                      shareAll ? "Chia sẻ toàn bộ" : `Chia sẻ ${selectedContentIds.length} nội dung`
                    )}
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
                    Nội dung {sourceUserData?.name || sourceUserData?.username} đã chia sẻ cho người khác
                  </h4>
                  {getUserSharesAsSharer(sourceUser).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                      Chưa chia sẻ nội dung nào
                    </div>
                  ) : (
                    getUserSharesAsSharer(sourceUser).map((share: any) => {
                      const recipient = (users || []).find((u: any) => u.id === share.sharedWithId)
                      return (
                        <div key={share.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-600 text-white text-xs">
                                {(recipient?.name || recipient?.username || "").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                Chia sẻ cho: {recipient?.name || recipient?.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{recipient?.username} · {share.content?.title || "Nội dung"} · 
                                {share.canEdit ? " Chỉnh sửa" : share.canDelete ? " Tải xuống" : " Chỉ xem"}
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
                            className="text-destructive hover:text-destructive flex-shrink-0"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Thu hồi
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
              
              {targetUser && targetUser !== sourceUser && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Nội dung được chia sẻ cho {targetUserData?.name || targetUserData?.username}
                  </h4>
                  {getUserSharesAsRecipient(targetUser).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                      Chưa nhận chia sẻ nào
                    </div>
                  ) : (
                    getUserSharesAsRecipient(targetUser).map((share: any) => {
                      const sharer = (users || []).find((u: any) => u.id === share.sharedById)
                      return (
                        <div key={share.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {(sharer?.name || sharer?.username || "").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                Từ: {sharer?.name || sharer?.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{sharer?.username} · {share.content?.title || "Nội dung"} · 
                                {share.canEdit ? " Chỉnh sửa" : share.canDelete ? " Tải xuống" : " Chỉ xem"}
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
                            className="text-destructive hover:text-destructive flex-shrink-0"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Thu hồi
                          </Button>
                        </div>
                      )
                    })
                  )}
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
