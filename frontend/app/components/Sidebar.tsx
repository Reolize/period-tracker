import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md p-6">

      <h2 className="text-lg font-bold mb-6">
        Menu
      </h2>

      <nav className="flex flex-col gap-4">

        <Link href="/dashboard" className="hover:text-pink-500">
          Dashboard
        </Link>

        <Link href="/add-cycle" className="hover:text-pink-500">
          Add Cycle
        </Link>

        <Link href="/account" className="hover:text-pink-500">
          Account
        </Link>

      </nav>
    </aside>
  )
}