export default function Header() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold">
        Period Tracker
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          User
        </span>

        <button className="text-red-500 hover:text-red-700">
          Logout
        </button>
      </div>
    </header>
  )
}