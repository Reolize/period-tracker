"use client"

import { useState } from "react"

interface Cycle {
  id: number
  start_date: string
  end_date: string
  notes?: string
}

interface EditCycleModalProps {
  cycle: Cycle
  onSave: () => void
}

export default function EditCycleModal({ cycle, onSave }: EditCycleModalProps) {

  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(cycle.start_date)
  const [endDate, setEndDate] = useState(cycle.end_date)
  const [notes, setNotes] = useState(cycle.notes || "")

  const handleSubmit = async () => {

    await fetch(`http://127.0.0.1:8000/cycles/${cycle.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        notes
      })
    })

    onSave()
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-500 hover:underline"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white rounded-lg p-6 w-[400px]">

            <h2 className="text-lg font-semibold mb-4">
              Edit Cycle
            </h2>

            <div className="space-y-3">

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Notes"
              />

            </div>

            <div className="flex justify-end gap-2 mt-4">

              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  )
}