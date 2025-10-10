"use client"

// import { ContentSharingManagement } from "@/components/rbac/content-sharing-management"
import { ContentSharingManager } from "@/components/content-sharing/content-sharing-manager"

export default function ContentSharingPage() {
  return (
    <div className="p-6 space-y-6">
      {/* <ContentSharingManagement /> */}
<ContentSharingManager />
    </div>
  )
}
