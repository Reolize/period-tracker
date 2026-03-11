"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Header() {

  const router = useRouter()

  const handleLogout = async () => {

    await fetch("http://127.0.0.1:9000/logout", {
      method: "POST",
      credentials: "include"
    })

    router.push("/login")
  }

  return (

    <header className="flex justify-between items-center p-4 border-b">

      <Link href="/dashboard" className="font-bold">
        Period Tracker
      </Link>

      <div className="flex gap-4">

        <Link href="/profile">
          User
        </Link>

        <button
          onClick={handleLogout}
          className="text-red-500"
        >
          Logout
        </button>

      </div>

    </header>

  )
}