"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

export default function RegisterPage() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleRegister(e: React.FormEvent) {

    e.preventDefault()

    try {

      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })

      router.push("/login")

    } catch (err: any) {
      alert(err.message)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-pink-50">

      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow w-96 space-y-4"
      >

        <h1 className="text-2xl font-bold text-center">
          Register
        </h1>

        <input
          type="email"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
          className="input"
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          className="input"
        />

        <button className="btn-primary w-full">
          Create Account
        </button>

      </form>

    </div>
  )
}