"use client"

export default function Header() {
  return (
    <header className="w-full bg-pink-200 px-6 py-4 shadow flex justify-between items-center">
      <h1 className="text-xl font-bold text-pink-700">
        Period Tracker
      </h1>

      <div className="text-sm text-gray-700">
        User
      </div>
    </header>
  )
}