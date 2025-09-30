"use client"

import type React from "react"

import { useState } from "react"
import { User, Mail, Shield } from "lucide-react"
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

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roles = [
  {
    id: "admin",
    name: "Quản trị viên",
    description: "Toàn quyền truy cập và quản lý hệ thống",
    color: "text-red-400",
  },
  {
    id: "editor",
    name: "Biên tập viên",
    description: "Có thể tạo, chỉnh sửa và xóa nội dung",
    color: "text-blue-400",
  },
  {
    id: "viewer",
    name: "Người xem",
    description: "Chỉ có thể xem và tải xuống nội dung",
    color: "text-green-400",
  },
]

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    sendWelcomeEmail: true,
    requirePasswordChange: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log(formData)
    onOpenChange(false)
    // Reset form
    setFormData({
      name: "",
      email: "",
      role: "",
      sendWelcomeEmail: true,
      requirePasswordChange: true,
    })
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-colors border-2 ${
                    formData.role === role.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => updateFormData("role", role.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-5 w-5 ${role.color}`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.role === role.id ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {formData.role === role.id && (
                          <div className="h-full w-full rounded-full bg-primary-foreground scale-50"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Tạo Người dùng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
