"use client"

// import { ContentSharingManagement } from "@/components/rbac/content-sharing-management"
import { ContentSharingManager } from "@/components/content-sharing/content-sharing-manager"

export default function ContentSharingPage() {
  return (
    <div className="space-y-6">
      {/* <ContentSharingManagement /> */}
<ContentSharingManager />
    </div>
  )
}
