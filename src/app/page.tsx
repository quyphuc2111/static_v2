import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Dashboard } from "@/components/dashboard/dashboard"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
    </div>
  )
}
