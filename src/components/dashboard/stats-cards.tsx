"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Database, TrendingUp, FolderOpen, Archive } from "lucide-react"
import { useDashboard } from "@/modules/dashboard/hooks"
import { Skeleton } from "@/components/ui/skeleton"

export function StatsCards() {
  const { stats, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Không thể tải dữ liệu thống kê</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsData = [
    {
      title: "Tổng Dự án",
      value: stats.projects.total.toLocaleString(),
      change: `${stats.projects.active}/${stats.projects.total} đang hoạt động`,
      changeType: "neutral" as const,
      icon: FolderOpen,
    },
    {
      title: "Tổng Module",
      value: stats.modules.total.toLocaleString(),
      change: `${stats.modules.active}/${stats.modules.total} đang hoạt động`,
      changeType: "neutral" as const,
      icon: Archive,
    },
    {
      title: "Tổng Tài liệu",
      value: stats.content.total.toLocaleString(),
      change: `${stats.content.today} mới hôm nay`,
      changeType: "positive" as const,
      icon: FileText,
    },
    {
      title: "Người dùng",
      value: stats.users.total.toLocaleString(),
      change: stats.content.growthRate > 0 ? `+${stats.content.growthRate}%` : `${stats.content.growthRate}%`,
      changeType: stats.content.growthRate > 0 ? "positive" : "negative",
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p
              className={`text-xs ${
                stat.changeType === "positive"
                  ? "text-green-400"
                  : stat.changeType === "negative"
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {/* {stat.change} */}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
