import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserManagement } from "@/components/users/user-management"

export default function UsersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <UserManagement />
        </main>
      </div>
    </div>
  )
}
