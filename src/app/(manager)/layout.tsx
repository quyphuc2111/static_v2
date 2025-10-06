import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ManagerPage({children}: {children: React.ReactNode}) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        <ScrollArea className="flex-1">
          <main className="">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}
