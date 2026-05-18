import { Suspense } from "react"
import { ProjectDetail } from "@/components/project/project-detail"

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
      <ProjectDetail />
    </Suspense>
  )
}
