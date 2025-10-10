"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecentActivity } from "@/modules/dashboard/hooks"
import { ActivityItem } from "@/modules/dashboard/dashboard.service"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

const getActionBadge = (action: string, type: string) => {
  const actionMap: Record<string, { label: string; variant: string; className: string }> = {
    'created': { label: 'Tạo mới', variant: 'default', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    'updated': { label: 'Cập nhật', variant: 'default', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    'deleted': { label: 'Xóa', variant: 'default', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    'shared': { label: 'Chia sẻ', variant: 'default', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    'uploaded': { label: 'Tải lên', variant: 'default', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    'restored': { label: 'Khôi phục', variant: 'default', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  }

  const config = actionMap[action.toLowerCase()] || { label: action, variant: 'secondary', className: '' }
  
  return (
    <Badge variant={config.variant as any} className={config.className}>
      {config.label}
    </Badge>
  )
}

const getActivityDescription = (activity: ActivityItem) => {
  const { action, entityType, metadata } = activity
  
  switch (entityType) {
    case 'ContentData':
      return {
        action: action === 'created' ? 'đã tạo tài liệu' : 
                action === 'updated' ? 'đã cập nhật tài liệu' :
                action === 'deleted' ? 'đã xóa tài liệu' : 'đã thực hiện hành động',
        target: metadata?.title || 'Tài liệu',
        context: metadata?.projectName ? `trong dự án ${metadata.projectName}` : ''
      }
    case 'Project':
      return {
        action: action === 'created' ? 'đã tạo dự án' :
                action === 'updated' ? 'đã cập nhật dự án' :
                action === 'deleted' ? 'đã xóa dự án' : 'đã thực hiện hành động',
        target: metadata?.name || 'Dự án',
        context: ''
      }
    case 'User':
      return {
        action: action === 'created' ? 'đã tạo người dùng' :
                action === 'updated' ? 'đã cập nhật người dùng' :
                action === 'deleted' ? 'đã xóa người dùng' : 'đã thực hiện hành động',
        target: metadata?.name || metadata?.email || 'Người dùng',
        context: ''
      }
    default:
      return {
        action: `đã ${action}`,
        target: entityType,
        context: ''
      }
  }
}

export function RecentActivity() {
  const { data: activity, isLoading } = useRecentActivity()

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Hoạt động Gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activity || activity.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Hoạt động Gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Không có hoạt động nào gần đây</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Hoạt động Gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.slice(0, 10).map((activityItem: ActivityItem) => {
            const description = getActivityDescription(activityItem)
            const actorName = activityItem.actor?.name || activityItem.actor?.email || 'Hệ thống'
            const actorInitial = actorName.charAt(0).toUpperCase()
            
            return (
              <div key={activityItem.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{actorInitial}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{actorName}</p>
                    {getActionBadge(activityItem.action, activityItem.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {description.action} <span className="font-medium">{description.target}</span>
                    {description.context && <span className="text-muted-foreground"> {description.context}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activityItem.createdAt), { 
                      addSuffix: true, 
                      locale: vi 
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
