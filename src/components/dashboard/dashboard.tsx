"use client"

import { StatsCards } from "./stats-cards"
import { RecentActivity } from "./recent-activity"
import { useDashboard } from "@/modules/dashboard/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

export function Dashboard() {
  const { stats, isLoading, refetch } = useDashboard()

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống quản lý tài liệu</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Activity section - full width */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Hoạt động gần đây</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
