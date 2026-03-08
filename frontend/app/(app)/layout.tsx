import Header from "../components/Header"
import Sidebar from "../components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}