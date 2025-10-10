"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectSharing } from "./project-sharing"
import { ModuleSharing } from "./module-sharing"
import { UserContentSharing } from "./user-content-sharing"
import { SharingHistory } from "./sharing-history"

export function ContentSharingManager() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Chia sẻ Nội dung</h2>
        <p className="text-muted-foreground">Quản lý chia sẻ nội dung theo dự án, module và người dùng</p>
      </div>

      <Tabs defaultValue="project" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="project">Chia sẻ theo Dự án</TabsTrigger>
          <TabsTrigger value="module">Chia sẻ theo Module</TabsTrigger>
          <TabsTrigger value="user">Chia sẻ giữa Users</TabsTrigger>
          <TabsTrigger value="history">Lịch sử Chia sẻ</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <ProjectSharing />
        </TabsContent>

        <TabsContent value="module" className="space-y-4">
          <ModuleSharing />
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <UserContentSharing />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <SharingHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
