"use client"

import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"

export default function CycleCalendar({cycles}:{cycles:any[]}){

  function isPeriodDay(date:Date){

    const d = date.toISOString().slice(0,10)

    return cycles.some(c=>{

      return d >= c.start_date && d <= c.end_date

    })

  }

  return(

    <div className="border rounded-xl p-6 bg-neutral-900">

      <h2 className="text-xl font-semibold mb-4">
        Cycle Calendar
      </h2>

      <Calendar
        tileClassName={({date})=>{
          if(isPeriodDay(date)) return "bg-red-500 text-white rounded-full"
        }}
      />

    </div>

  )

}