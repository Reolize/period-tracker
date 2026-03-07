"use client"

export default function SideMenu() {
  return (
    <aside className="w-60 bg-pink-100 min-h-screen p-4">
      <nav className="flex flex-col gap-3">

        <a
          href="/"
          className="p-2 rounded-lg hover:bg-pink-200"
        >
          Dashboard
        </a>

        <a
          href="/add-cycle"
          className="p-2 rounded-lg hover:bg-pink-200"
        >
          Add Cycle
        </a>

        <a
          href="/history"
          className="p-2 rounded-lg hover:bg-pink-200"
        >
          Cycle History
        </a>

      </nav>
    </aside>
  )
}