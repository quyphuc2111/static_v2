"use client"

import type React from "react"

import { useMemo, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { useRoles } from "@/modules/rbac/hooks"
import { useUsers } from "@/modules/rbac/hooks/useUsers"
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {toast} from "react-toastify"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const colorMap: Record<string, string> = {
  ADMINISTRATOR: "text-red-400",
  DEV: "text-blue-400",
  TESTER: "text-green-400",
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    sendWelcomeEmail: true,
    requirePasswordChange: true,
  })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string>("")
  const [createdUserEmail, setCreatedUserEmail] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const { data: roles } = useRoles()
  const { create } = useUsers()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password if provided
    if (formData.password && formData.password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    
    const result: any = await create.mutateAsync({
      name: formData.name || undefined,
      email: formData.email,
      password: formData.password || undefined,
      // status implicit ACTIVE; if needed, add toggle in UI
      roleId: formData.role || undefined,
    })
    
    console.log("API Response:", result)
    console.log("User password:", formData.password)
    console.log("Temporary password:", result?.temporaryPassword)
    
    // If user provided a password, use that; otherwise show the generated temporary password
    const finalPassword = formData.password || result?.temporaryPassword || ""
    
    if (finalPassword) {
      setGeneratedPassword(finalPassword)
      setCreatedUserEmail(formData.email)
      setShowPasswordDialog(true)
    } else {
      // fallback: no password provided nor returned
      onOpenChange(false)
    }
    setFormData({ name: "", email: "", role: "", password: "", sendWelcomeEmail: true, requirePasswordChange: true })
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

  return (
   <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) setShowPasswordDialog(false); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Thêm Người dùng Mới</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tạo tài khoản mới và phân quyền cho người dùng
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
                Mật khẩu (tuỳ chọn)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, để trống để tạo tự động"
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
                      <Badge variant={formData.role === role.id ? "default" : "outline"}>{formData.role === role.id ? "Đã chọn" : "Chọn"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Gửi email chào mừng</Label>
                <p className="text-sm text-muted-foreground">Gửi hướng dẫn đăng nhập đến email người dùng</p>
              </div>
              <Switch
                checked={formData.sendWelcomeEmail}
                onCheckedChange={(checked) => updateFormData("sendWelcomeEmail", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Yêu cầu đổi mật khẩu</Label>
                <p className="text-sm text-muted-foreground">Bắt buộc người dùng đổi mật khẩu khi đăng nhập lần đầu</p>
              </div>
              <Switch
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked) => updateFormData("requirePasswordChange", checked)}
              />
            </div>
          </div> */}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={create.isPending}>
              Tạo Người dùng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {/* Password Dialog */}
    <Dialog open={showPasswordDialog} onOpenChange={(v) => { setShowPasswordDialog(v); if (!v) onOpenChange(false) }}>
      <DialogContent className="sm:max-w-[460px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Copy thông tin tài khoản mới</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {formData.password ? 
              "Hãy copy thông tin tài khoản mới." : 
              "Hãy copy thông tin tài khoản mới."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* <div>
            <Label className="text-foreground">Email</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={createdUserEmail} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(createdUserEmail)}>Sao chép</Button>
            </div>
          </div> */}
          
          {/* <div>
            <Label className="text-foreground">
              {formData.password ? "Mật khẩu đã nhập" : "Mật khẩu tạm thời"}
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={generatedPassword} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(generatedPassword)}>Sao chép</Button>
            </div>
          </div> */}
          
          <div>
            <Label className="text-foreground">Email | Password (để copy)</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={`${createdUserEmail} | ${generatedPassword}`} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => {
                navigator.clipboard.writeText(`${createdUserEmail} | ${generatedPassword}`)
                toast.success("Đã copy thông tin tài khoản mới")
              }}>Sao chép</Button>
            </div>
          </div>
          
          <Separator />
          <p className="text-sm text-muted-foreground">
            {formData.password ? 
              "Người dùng có thể đăng nhập ngay với thông tin này." :
              "Người dùng cần đăng nhập với thông tin này và có thể đổi mật khẩu sau."
            }
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setShowPasswordDialog(false); onOpenChange(false) }}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
