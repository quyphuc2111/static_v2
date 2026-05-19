"use client"

import { useDashboard } from "@/modules/dashboard/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderOpen, FileText, Users, Layers, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

export function StatsCards() {
  const { stats, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm text-slate-500">Không thể tải dữ liệu thống kê</p>
      </div>
    )
  }

  const statsData = [
    {
      title: "Dự án hoạt động",
      value: stats.projects.active,
      total: stats.projects.total,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/30",
    },
    {
      title: "Tổng tài liệu",
      value: stats.content.total,
      subtitle: `+${stats.content.today} hôm nay`,
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
    },
    {
      title: "Tổng Module",
      value: stats.modules.total,
      subtitle: `${stats.modules.active} hoạt động`,
      icon: Layers,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-100 dark:border-purple-900/30",
    },
    {
      title: "Người dùng",
      value: stats.users.total,
      icon: Users,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-100 dark:border-amber-900/30",
    },
  ]

  return (
    <div className="space-y-5">
      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`${stat.bgColor} p-5 rounded-xl border ${stat.borderColor} shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{stat.title}</p>
                <Icon className={`h-5 w-5 ${stat.color} opacity-70`} />
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
              {stat.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              )}
              {stat.total && stat.total !== stat.value && (
                <p className="text-xs text-slate-500 mt-1">/ {stat.total} tổng</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Content status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.content.thisWeek}</p>
            <p className="text-xs text-slate-500">Tài liệu tuần này</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.content.thisMonth}</p>
            <p className="text-xs text-slate-500">Tài liệu tháng này</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.content.growthRate > 0 ? `+${stats.content.growthRate}%` : `${stats.content.growthRate}%`}
            </p>
            <p className="text-xs text-slate-500">Tăng trưởng</p>
          </div>
        </div>
      </div>
    </div>
  )
}
