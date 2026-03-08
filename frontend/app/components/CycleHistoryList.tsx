"use client"

import { useState } from "react"

type Cycle = {
  id?: number
  start: string
  end: string
  length: number
  notes?: string
}

export default function CycleHistoryList({ cycles }: { cycles: Cycle[] }) {

  const [selected, setSelected] = useState<Cycle | null>(null)
  const [editMode, setEditMode] = useState(false)

  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [notes, setNotes] = useState("")

  const openEdit = (cycle: Cycle) => {
    setStart(cycle.start)
    setEnd(cycle.end)
    setNotes(cycle.notes || "")
    setEditMode(true)
  }

  const handleSave = async () => {

    if (!selected) return

    await fetch(`http://127.0.0.1:8000/cycles/${selected.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start,
        end,
        notes,
      }),
    })

    setEditMode(false)
    setSelected(null)

    location.reload()
  }

  return (
    <div className="space-y-4">

      {cycles.map((cycle, i) => (

        <div
          key={i}
          onClick={() => setSelected(cycle)}
          className="cursor-pointer rounded-2xl border border-pink-100 bg-white p-4 shadow hover:shadow-md transition"
        >

          <div className="text-pink-500 font-semibold">
            Cycle
          </div>

          <div className="text-gray-800">
            {cycle.start} - {cycle.end}
          </div>

          <div className="text-sm text-gray-500">
            Length {cycle.length} days
          </div>

        </div>

      ))}

      {selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white rounded-xl p-6 w-96 space-y-3">

            {!editMode ? (

              <>
                <h2 className="text-lg font-bold text-pink-500 mb-3">
                  Cycle Detail
                </h2>

                <p><b>Start:</b> {selected.start}</p>
                <p><b>End:</b> {selected.end}</p>
                <p><b>Length:</b> {selected.length} days</p>

                {selected.notes && (
                  <p><b>Notes:</b> {selected.notes}</p>
                )}

                <div className="flex gap-2 mt-4">

                  <button
                    onClick={() => openEdit(selected)}
                    className="bg-pink-400 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setSelected(null)}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    Close
                  </button>

                </div>
              </>

            ) : (

              <>
                <h2 className="text-lg font-bold text-pink-500 mb-3">
                  Edit Cycle
                </h2>

                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full border rounded p-2"
                />

                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full border rounded p-2"
                />

                <textarea
                  placeholder="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded p-2"
                />

                <div className="flex gap-2 mt-4">

                  <button
                    onClick={handleSave}
                    className="bg-pink-500 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>

                </div>

              </>
            )}

          </div>

        </div>

      )}

    </div>
  )
}