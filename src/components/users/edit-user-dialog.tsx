"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Shield, RefreshCw, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useRoles } from "@/modules/rbac/hooks"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

const colorMap: Record<string, string> = {
  ADMINISTRATOR: "text-red-400",
  DEV: "text-blue-400",
  TESTER: "text-green-400",
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const { data: roles } = useRoles()
  const { update } = useUsers()

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.roles?.[0]?.role?.id || "",
        password: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password if provided
    if (formData.password && formData.password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    
    try {
      await update.mutateAsync({
        id: user.id,
        name: formData.name || undefined,
        email: formData.email,
        password: formData.password || undefined,
        roleId: formData.role || undefined,
      })
      
      toast.success("Cập nhật người dùng thành công!")
      onOpenChange(false)
    } catch (error) {
      console.error("Update user error:", error)
      toast.error("Có lỗi xảy ra khi cập nhật người dùng")
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
    const length = 12
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    updateFormData("password", result)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Chỉnh sửa Người dùng</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cập nhật thông tin và quyền của người dùng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Họ và tên
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mật khẩu mới (tuỳ chọn)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="bg-muted/50 border-border pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateStrongPassword}
                  title="Tạo mật khẩu mạnh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {formData.password && formData.password.length < 8 && (
                <p className="text-sm text-red-400">Mật khẩu phải có ít nhất 8 ký tự</p>
              )}
              {formData.password && formData.password.length >= 8 && (
                <p className="text-sm text-green-400">✓ Mật khẩu hợp lệ</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground">Vai trò</Label>
            <div className="space-y-2">
              {(roles || []).map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-colors border-2 ${
                    formData.role === role.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => updateFormData("role", role.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-5 w-5 ${colorMap[role.name] || "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <Badge variant={formData.role === role.id ? "default" : "outline"}>
                        {formData.role === role.id ? "Đã chọn" : "Chọn"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={update.isPending}>
              {update.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
