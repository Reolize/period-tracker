"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function CycleChart({cycles}:{cycles:any[]}){

  const data = cycles.map(c=>({
    date:c.start_date,
    length:c.cycle_length
  }))

  return(

    <div className="border rounded-xl p-6 bg-neutral-900">

      <h2 className="text-xl font-semibold mb-4">
        Cycle Analytics
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={data}>

          <XAxis dataKey="date"/>

          <YAxis/>

          <Tooltip/>

          <Line
            type="monotone"
            dataKey="length"
            stroke="#ff4d6d"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  )

}