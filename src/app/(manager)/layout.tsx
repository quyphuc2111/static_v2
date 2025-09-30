import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ContentManagement } from "@/components/content/content-management"

export default function ManagerPage({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
             {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
