"use client"

import { StatsCards } from "./stats-cards"
import { RecentActivity } from "./recent-activity"
import { Sidebar } from "./sidebar"
import { useDashboard } from "@/modules/dashboard/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard() {
  const { stats, isLoading } = useDashboard()

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* <Sidebar /> */}
      <div className="flex-1">
        <div className="space-y-4 md:space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-sm md:text-base text-muted-foreground">Tổng quan hệ thống quản lý tài liệu</p>
          </div>

          <StatsCards />

          <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <RecentActivity />
            </div>
            <div className="lg:col-span-3">
              <div className="grid gap-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Thống kê Nhanh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tài liệu mới hôm nay</span>
                            <span className="text-sm font-medium text-foreground">
                              {stats?.content.today || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tài liệu tuần này</span>
                            <span className="text-sm font-medium text-foreground">
                              {stats?.content.thisWeek || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tài liệu tháng này</span>
                            <span className="text-sm font-medium text-foreground">
                              {stats?.content.thisMonth || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Trạng thái Hệ thống</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Server</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Database</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Kết nối</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tăng trưởng</span>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            (stats?.content.growthRate || 0) > 0 ? 'bg-green-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className={`text-sm ${
                            (stats?.content.growthRate || 0) > 0 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {stats?.content.growthRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
