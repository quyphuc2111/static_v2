import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    user: "Nguyễn Văn A",
    action: "đã tạo tài liệu mới",
    document: "Báo cáo Q4 2024",
    time: "2 phút trước",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "create",
  },
  {
    id: 2,
    user: "Trần Thị B",
    action: "đã cập nhật",
    document: "Hướng dẫn sử dụng",
    time: "15 phút trước",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "update",
  },
  {
    id: 3,
    user: "Lê Văn C",
    action: "đã xóa",
    document: "Tài liệu cũ v1.0",
    time: "1 giờ trước",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "delete",
  },
  {
    id: 4,
    user: "Phạm Thị D",
    action: "đã chia sẻ",
    document: "Kế hoạch Marketing",
    time: "2 giờ trước",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "share",
  },
  {
    id: 5,
    user: "Hoàng Văn E",
    action: "đã tải lên",
    document: "Presentation.pptx",
    time: "3 giờ trước",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "upload",
  },
]

const getActionBadge = (type: string) => {
  switch (type) {
    case "create":
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
          Tạo mới
        </Badge>
      )
    case "update":
      return (
        <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Cập nhật
        </Badge>
      )
    case "delete":
      return (
        <Badge variant="default" className="bg-red-500/20 text-red-400 border-red-500/30">
          Xóa
        </Badge>
      )
    case "share":
      return (
        <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          Chia sẻ
        </Badge>
      )
    case "upload":
      return (
        <Badge variant="default" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          Tải lên
        </Badge>
      )
    default:
      return <Badge variant="secondary">Khác</Badge>
  }
}

export function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Hoạt động Gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{activity.user}</p>
                  {getActionBadge(activity.type)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.action} <span className="font-medium">{activity.document}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
