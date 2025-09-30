"use client"

import ScormPlayer from "@/components/scorm-player"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ScormViewPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const entry = typeof sp.entry === "string" ? sp.entry : ""

  if (!entry) {
    return (
      <div className="p-6 text-foreground">
        Thiếu tham số entry. Ví dụ: /scorm/view?entry=/uploads/content/..../course/index.html?type=scorm
      </div>
    )
  }

  return (
    <div className="w-screen h-screen">
      <ScormPlayer entryPoint={entry} className="w-full h-full" />
    </div>
  )
}


