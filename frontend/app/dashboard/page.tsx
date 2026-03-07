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


export default function Dashboard() {

  const [prediction, setPrediction] = useState<any>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)

  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)



  async function loadData() {

    setLoading(true)

    try {

      const cyclesData = await apiFetch("/cycles/")
      setCycles(cyclesData)

    } catch (err) {
      console.error(err)
    }

    try {

      const p = await apiFetch("/cycles/predict")
      setPrediction(p)

    } catch {
      setPrediction(null)
    }

    setLoading(false)

  }



  useEffect(() => {
    loadData()
  }, [])



  async function saveCycle(e: React.FormEvent) {

    e.preventDefault()

    if (!start || !end) {
      alert("Select dates")
      return
    }

    const start_date = start.toISOString().slice(0, 10)
    const end_date = end.toISOString().slice(0, 10)

    setSaving(true)

    try {

      if (editing) {

        await apiFetch(`/cycles/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ start_date, end_date })
        })

      } else {

        await apiFetch("/cycles/", {
          method: "POST",
          body: JSON.stringify({ start_date, end_date })
        })

      }

      resetForm()
      await loadData()

    } catch (err: any) {
      alert(err.message)
    }

    setSaving(false)

  }



  function resetForm() {

    setEditing(null)
    setStart(null)
    setEnd(null)

  }



  async function deleteCycle(id: number) {

    if (!confirm("Delete cycle?")) return

    try {

      await apiFetch(`/cycles/${id}`, { method: "DELETE" })

      setCycles(prev => prev.filter(c => c.id !== id))

    } catch (err: any) {
      alert(err.message)
    }

  }



  function handleEdit(cycle: any) {

    setEditing(cycle)

    setStart(new Date(cycle.start_date + "T00:00:00"))
    setEnd(new Date(cycle.end_date + "T00:00:00"))

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })

  }



  function isPeriodDay(date: Date) {

    const d = date.toISOString().slice(0, 10)

    return cycles.some(c => d >= c.start_date && d <= c.end_date)

  }



  const chartData = cycles.map(c => ({
    date: c.start_date,
    length: c.cycle_length
  }))



  if (loading) {

    return (
      <div className="p-10 text-center text-gray-400">
        Loading dashboard...
      </div>
    )

  }



  return (

    <div className="p-8 max-w-7xl mx-auto space-y-10">



      {/* HERO STATS */}

      <div className="grid md:grid-cols-3 gap-6">

        <StatCard
          title="Next Period"
          value={prediction?.predicted_next_start || "-"}
        />

        <StatCard
          title="Cycle Length"
          value={
            prediction?.cycle_length_prediction
              ? `${prediction.cycle_length_prediction} days`
              : "-"
          }
        />

        <StatCard
          title="Confidence"
          value={
            prediction?.confidence_score
              ? `${prediction.confidence_score}%`
              : "-"
          }
        />

      </div>



      {/* CALENDAR + FORM */}

      <div className="grid lg:grid-cols-2 gap-10">



        <div className="card">

          <h2 className="section-title">
            Cycle Calendar
          </h2>

          <Calendar
            tileClassName={({ date }) => {
              if (isPeriodDay(date))
                return "period-day"
            }}
          />

        </div>



        <div className="card">

          <h2 className="section-title">

            {editing ? "Edit Cycle" : "Add Cycle"}

          </h2>

          <form onSubmit={saveCycle} className="space-y-4">

            <div>

              <label className="label">
                Start Date
              </label>

              <DatePicker
                selected={start}
                onChange={(date: Date | null) => setStart(date)}
                dateFormat="yyyy-MM-dd"
                className="input"
              />

            </div>



            <div>

              <label className="label">
                End Date
              </label>

              <DatePicker
                selected={end}
                onChange={(date: Date | null) => setEnd(date)}
                minDate={start || undefined}
                dateFormat="yyyy-MM-dd"
                className="input"
              />

            </div>



            <div className="flex gap-3">

              <button
                disabled={saving}
                className="btn-primary flex-1"
              >

                {saving
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Add"}

              </button>



              {editing && (

                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>

              )}

            </div>

          </form>

        </div>

      </div>



      {/* HISTORY */}

      <div className="card">

        <h2 className="section-title">
          Cycle History
        </h2>

        <div className="space-y-2">

          {cycles.map(c => (

            <div
              key={c.id}
              className="history-row"
            >

              <div>

                <div className="font-semibold">
                  {c.start_date}
                </div>

                <div className="text-xs text-gray-400">
                  {c.period_length} day period
                </div>

              </div>



              <div className="flex gap-4">

                <button
                  onClick={() => handleEdit(c)}
                  className="link"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteCycle(c.id)}
                  className="link-delete"
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>



      {/* ANALYTICS */}

      <div className="card">

        <h2 className="section-title">
          Cycle Analytics
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={chartData}>

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="length"
              stroke="#ff7eb6"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>



    </div>

  )

}



function StatCard({ title, value }: { title: string, value: string }) {

  return (

    <div className="stat-card">

      <p className="stat-title">
        {title}
      </p>

      <p className="stat-value">
        {value}
      </p>

    </div>

  )

}