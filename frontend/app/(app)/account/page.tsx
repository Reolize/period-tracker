"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"

export default function AccountPage() {
  return (
    <div className="max-w-xl">

      <h1 className="text-2xl font-bold mb-6">
        Account Settings
      </h1>

      <form className="flex flex-col gap-4">

        <div>
          <label className="block mb-1">
            Name
          </label>
          <input
            type="text"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          className="bg-pink-500 text-white py-2 rounded hover:bg-pink-600"
        >
          Save
        </button>

      </form>
    </div>
  )
}