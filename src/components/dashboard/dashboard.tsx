import { StatsCards } from "./stats-cards"
import { RecentActivity } from "./recent-activity"
import { Sidebar } from "./sidebar"

export function Dashboard() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* <Sidebar /> */}
      <div className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">Tổng quan hệ thống quản lý tài liệu</p>
          </div>

          <StatsCards />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <RecentActivity />
            </div>
            <div className="col-span-3">
              <div className="grid gap-4">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-4">Thống kê Nhanh</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tài liệu mới hôm nay</span>
                      <span className="text-sm font-medium text-foreground">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Người dùng online</span>
                      <span className="text-sm font-medium text-foreground">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tài liệu được xem nhiều</span>
                      <span className="text-sm font-medium text-foreground">892</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-4">Trạng thái Hệ thống</h3>
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
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm text-yellow-400">75% đầy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
