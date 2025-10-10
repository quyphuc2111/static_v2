"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useCreateRole, usePermissions } from "@/modules/rbac/hooks"
import { toast } from "react-toastify"

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const createRoleMut = useCreateRole()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Tên vai trò là bắt buộc")
      return
    }

    if (selectedPermissions.length === 0) {
      toast.error("Vui lòng chọn ít nhất một quyền hạn")
      return
    }

    createRoleMut.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: selectedPermissions,
      },
      {
        onSuccess: () => {
          toast.success("Tạo vai trò thành công")
          onOpenChange(false)
          setName("")
          setDescription("")
          setSelectedPermissions([])
        },
        onError: (error: any) => {
          toast.error(error.message || "Tạo vai trò thất bại")
        },
      }
    )
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const groupedPermissions = permissions?.reduce((acc, permission) => {
    const category = permission.name.split('_')[0] || 'OTHER'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Vai trò Mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tên vai trò *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên vai trò"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả vai trò"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Quyền hạn *</Label>
            {permissionsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Đang tải danh sách quyền hạn...
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={permission.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.name}
                            {permission.description && (
                              <span className="text-muted-foreground ml-2">
                                - {permission.description}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={createRoleMut.isPending || !name.trim() || selectedPermissions.length === 0}
            >
              {createRoleMut.isPending ? "Đang tạo..." : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
