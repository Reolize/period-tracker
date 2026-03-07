"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"



export default function Dashboard(){

  const [prediction,setPrediction] = useState<any>(null)
  const [cycles,setCycles] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  const [start,setStart] = useState<Date | null>(null)
  const [end,setEnd] = useState<Date | null>(null)

  const [editing,setEditing] = useState<any>(null)
  const [saving,setSaving] = useState(false)



  async function loadData(){

    setLoading(true)

    try{

      const p = await apiFetch("/cycles/predict")
      setPrediction(p)

    }catch{}

    try{

      const c = await apiFetch("/cycles/")
      setCycles(c)

    }catch{}

    setLoading(false)

  }



  useEffect(()=>{

    loadData()

  },[])



  async function saveCycle(e:React.FormEvent){

    e.preventDefault()

    if(!start || !end){
      alert("Select dates")
      return
    }

    const start_date = start.toISOString().slice(0,10)
    const end_date = end.toISOString().slice(0,10)

    setSaving(true)

    try{

      if(editing){

        await apiFetch(`/cycles/${editing.id}`,{
          method:"PUT",
          body:JSON.stringify({
            start_date,
            end_date
          })
        })

        setEditing(null)

      }else{

        await apiFetch("/cycles/",{
          method:"POST",
          body:JSON.stringify({
            start_date,
            end_date
          })
        })

      }

      setStart(null)
      setEnd(null)

      await loadData()

    }catch(err:any){

      alert(err.message)

    }

    setSaving(false)

  }



  async function deleteCycle(id:number){

    if(!confirm("Delete this cycle?")) return

    try{

      await apiFetch(`/cycles/${id}`,{
        method:"DELETE"
      })

      await loadData()

    }catch(err:any){

      alert(err.message)

    }

  }



  function handleEdit(cycle:any){

    setEditing(cycle)

    setStart(new Date(cycle.start_date))
    setEnd(new Date(cycle.end_date))

  }



  function isPeriodDay(date:Date){

    const d = date.toISOString().slice(0,10)

    return cycles.some(c=>{
      return d >= c.start_date && d <= c.end_date
    })

  }



  const chartData = cycles.map(c=>({
    date:c.start_date,
    length:c.cycle_length
  }))



  if(loading){

    return(

      <div className="p-10 text-center text-gray-400">
        Loading dashboard...
      </div>

    )

  }



  return(

    <div className="p-8 max-w-7xl mx-auto space-y-10">


      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold">
          Cycle Dashboard
        </h1>

      </div>



      {/* PREDICTION */}

      <div className="grid md:grid-cols-5 gap-4">

        {prediction ?(

          <>

          <Stat
            label="Next Start"
            value={prediction.predicted_next_start}
          />

          <Stat
            label="Next End"
            value={prediction.predicted_next_end}
          />

          <Stat
            label="Cycle Length"
            value={`${prediction.cycle_length_prediction} days`}
          />

          <Stat
            label="Period Length"
            value={`${prediction.period_length_prediction} days`}
          />

          <Stat
            label="Confidence"
            value={`${prediction.confidence_score}%`}
          />

          </>

        ):(

          <div className="col-span-5 border rounded-xl p-6 bg-neutral-900">

            <p className="text-gray-400">
              Add more cycles to generate predictions.
            </p>

          </div>

        )}

      </div>



      {/* MAIN GRID */}

      <div className="grid lg:grid-cols-2 gap-10">



        {/* CALENDAR */}

        <div className="border rounded-xl p-6 bg-neutral-900">

          <h2 className="text-xl font-semibold mb-4">
            Cycle Calendar
          </h2>

          <Calendar
            tileClassName={({date})=>{

              if(isPeriodDay(date)){
                return "bg-red-500 text-white rounded-full"
              }

            }}
          />

        </div>



        {/* ADD / EDIT */}

        <div className="border rounded-xl p-6 bg-neutral-900">

          <h2 className="text-xl font-semibold mb-6">

            {editing ? "Edit Cycle" : "Add Cycle"}

          </h2>

          <form
            onSubmit={saveCycle}
            className="space-y-4"
          >

            <div>

              <label className="block text-sm text-gray-400 mb-1">
                Start Date
              </label>

              <DatePicker
                selected={start}
                onChange={(date: Date | null)=>setStart(date)}
                dateFormat="yyyy-MM-dd"
                className="border bg-black p-2 rounded w-full"
                placeholderText="Select start date"
              />

            </div>



            <div>

              <label className="block text-sm text-gray-400 mb-1">
                End Date
              </label>

              <DatePicker
                selected={end}
                onChange={(date: Date | null)=>setEnd(date)}
                dateFormat="yyyy-MM-dd"
                className="border bg-black p-2 rounded w-full"
                placeholderText="Select end date"
                minDate={start || undefined}
              />

            </div>



            <button
              disabled={saving}
              className="w-full bg-white text-black py-2 rounded font-medium hover:opacity-90"
            >

              {saving
                ? "Saving..."
                : editing
                ? "Update Cycle"
                : "Add Cycle"}

            </button>

          </form>

        </div>

      </div>



      {/* ANALYTICS */}

      <div className="border rounded-xl p-6 bg-neutral-900">

        <h2 className="text-xl font-semibold mb-4">
          Cycle Analytics
        </h2>

        {cycles.length < 2 ?(

          <p className="text-gray-400">
            Add more cycles to see analytics.
          </p>

        ):(

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={chartData}>

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

        )}

      </div>



      {/* HISTORY */}

      <div className="border rounded-xl p-6 bg-neutral-900">

        <h2 className="text-xl font-semibold mb-4">
          Cycle History
        </h2>

        {cycles.length === 0 ?(

          <p className="text-gray-400">
            No cycles recorded
          </p>

        ):(

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b text-gray-400">

                  <th className="text-left p-3">Start</th>
                  <th className="text-left p-3">End</th>
                  <th className="text-left p-3">Cycle Length</th>
                  <th className="text-left p-3">Period Length</th>
                  <th className="text-left p-3">Actions</th>

                </tr>

              </thead>

              <tbody>

                {cycles.map(c=>(

                  <tr
                    key={c.id}
                    className="border-b hover:bg-neutral-800"
                  >

                    <td className="p-3">{c.start_date}</td>
                    <td className="p-3">{c.end_date}</td>
                    <td className="p-3">{c.cycle_length}</td>
                    <td className="p-3">{c.period_length}</td>

                    <td className="p-3 flex gap-4">

                      <button
                        onClick={()=>handleEdit(c)}
                        className="text-blue-400 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={()=>deleteCycle(c.id)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


    </div>

  )

}



function Stat({
  label,
  value
}:{label:string,value:string}){

  return(

    <div className="border rounded-xl p-4 bg-neutral-900">

      <div className="text-gray-400 text-xs">
        {label}
      </div>

      <div className="text-lg font-semibold mt-1">
        {value}
      </div>

    </div>

  )

}