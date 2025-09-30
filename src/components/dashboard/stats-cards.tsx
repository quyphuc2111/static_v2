import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Database, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Tổng Tài liệu",
    value: "2,847",
    change: "+12%",
    changeType: "positive" as const,
    icon: FileText,
  },
  {
    title: "Người dùng Hoạt động",
    value: "1,234",
    change: "+8%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Dung lượng Sử dụng",
    value: "45.2 GB",
    change: "+2.1 GB",
    changeType: "neutral" as const,
    icon: Database,
  },
  {
    title: "Lượt Truy cập",
    value: "12,847",
    change: "+23%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
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
              {stat.change} từ tháng trước
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
