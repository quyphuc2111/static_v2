"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download } from "lucide-react"
import { useRoles, usePermissions } from "@/modules/rbac/hooks"

export function PermissionsMatrix() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permissionsLoading } = usePermissions()

  // Group permissions by category
  const permissionCategories = [
    {
      category: "Content Management",
      items: permissions?.filter(p => p.name.includes("CONTENT") || p.name.includes("SHARE")) || []
    },
    {
      category: "Project/Module Management", 
      items: permissions?.filter(p => p.name.includes("PROJECT") || p.name.includes("MODULE")) || []
    },
    {
      category: "User Management",
      items: permissions?.filter(p => p.name.includes("USER")) || []
    },
    {
      category: "Audit & Dashboard",
      items: permissions?.filter(p => p.name.includes("AUDIT") || p.name.includes("DASHBOARD")) || []
    }
  ]

  const categories = ["all", ...permissionCategories.map((p) => p.category)]

  const filteredPermissions = selectedCategory === "all" 
    ? permissionCategories 
    : permissionCategories.filter((p) => p.category === selectedCategory)

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải ma trận quyền hạn...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm quyền hạn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {cat === "all" ? "Tất cả" : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ma trận phân quyền</CardTitle>
          <CardDescription>Xem và quản lý quyền hạn của từng vai trò trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[300px_repeat(3,1fr)] gap-2 mb-4">
                <div className="font-medium text-sm">Quyền hạn</div>
                {roles?.map((role) => (
                  <div key={role.id} className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {role.name}
                    </Badge>
                  </div>
                ))}
              </div>

              {filteredPermissions.map((category) => (
                <div key={category.category} className="space-y-2 mb-6">
                  <h4 className="font-semibold text-sm bg-muted px-3 py-2 rounded-lg">{category.category}</h4>
                  {category.items
                    .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((permission) => (
                      <div
                        key={permission.id}
                        className="grid grid-cols-[300px_repeat(3,1fr)] gap-2 items-center py-3 px-3 rounded-lg hover:bg-accent border-b border-border/50"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {permission.description || 'Không có mô tả'}
                          </div>
                        </div>
                        {roles?.map((role) => {
                          const hasPermission = role.permissions?.some(rp => rp.permissionId === permission.id)
                          return (
                            <div key={role.id} className="flex justify-center">
                              <Checkbox checked={hasPermission} disabled />
                            </div>
                          )
                        })}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thống kê quyền hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles?.map((role) => {
                const totalPermissions = role.permissions?.length || 0
                const allPermissions = permissions?.length || 0
                const percentage = allPermissions > 0 ? Math.round((totalPermissions / allPermissions) * 100) : 0

                const colorMap: { [key: string]: string } = {
                  "ADMINISTRATOR": "red",
                  "DEV": "blue", 
                  "TESTER": "green"
                }
                const color = colorMap[role.name] || "gray"

                return (
                  <div key={role.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-muted-foreground">
                        {totalPermissions}/{allPermissions} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full bg-${color}-500`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quyền phổ biến nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {permissions
                ?.map(permission => ({
                  ...permission,
                  roleCount: roles?.filter(role => 
                    role.permissions?.some(rp => rp.permissionId === permission.id)
                  ).length || 0
                }))
                .sort((a, b) => b.roleCount - a.roleCount)
                .slice(0, 6)
                .map((permission) => (
                  <div key={permission.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{permission.name}</span>
                      <Badge variant="secondary">{permission.roleCount} vai trò</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {permission.description || 'Không có mô tả'}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
