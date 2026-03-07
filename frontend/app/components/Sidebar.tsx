"use client"

export default function Sidebar() {

  return (
    <aside style={{
      width:220,
      background:"#ffffff",
      borderRight:"1px solid #f2d6e4",
      padding:20
    }}>

      <nav style={{display:"flex",flexDirection:"column",gap:16}}>

        <a href="/dashboard">Dashboard</a>

        <a href="/add-cycle">Log Period</a>

        <a href="/predict">Prediction</a>

        <a href="/analytics">Analytics</a>

      </nav>

    </aside>
  )

}