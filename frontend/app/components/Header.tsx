"use client"

export default function Header() {

  return (
    <header style={{
      height: 64,
      background: "#ffffff",
      borderBottom: "1px solid #f2d6e4",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px"
    }}>

      <div style={{
        fontWeight: 700,
        fontSize: 18,
        color: "#ff7eb6"
      }}>
        CycleSense
      </div>

      <div style={{display:"flex",gap:16}}>

        <a href="/dashboard">Dashboard</a>
        <a href="/add-cycle">Add Cycle</a>

        <div style={{
          width:36,
          height:36,
          borderRadius:"50%",
          background:"#ffd6e8"
        }}/>

      </div>

    </header>
  )

}