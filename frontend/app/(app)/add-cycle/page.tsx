"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api"

export default function AddCycle() {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  async function handleSubmit() {
    await apiFetch("/cycles/", {
      method: "POST",
      body: JSON.stringify({
        start_date: start,
        end_date: end,
      }),
    })

    window.location.href = "/dashboard"
  }

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Add Cycle</h1>

      <input
        type="date"
        className="border p-2"
        onChange={(e) => setStart(e.target.value)}
      />

      <input
        type="date"
        className="border p-2"
        onChange={(e) => setEnd(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2"
      >
        Save
      </button>
    </div>
  )
}