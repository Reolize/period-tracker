"use client"

import { useState } from "react"

type Cycle = {
  start: string
  end: string
  length: number
}

export default function CycleHistoryList({ cycles }: { cycles: Cycle[] }) {

  const [selected, setSelected] = useState<Cycle | null>(null)

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

          <div className="bg-white rounded-xl p-6 w-96">

            <h2 className="text-lg font-bold text-pink-500 mb-3">
              Cycle Detail
            </h2>

            <p>Start: {selected.start}</p>
            <p>End: {selected.end}</p>
            <p>Length: {selected.length} days</p>

            <div className="flex gap-2 mt-4">

              <button className="bg-pink-400 text-white px-3 py-1 rounded">
                Edit
              </button>

              <button
                onClick={() => setSelected(null)}
                className="bg-gray-200 px-3 py-1 rounded"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}