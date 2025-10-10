import { Header } from "@/components/layout/header"
import { Dashboard } from "@/components/dashboard/dashboard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        <ScrollArea className="flex-1">
          <main className="">
            <Dashboard />
          </main>
        </ScrollArea>
      </div>
    </div>  
  )
}
