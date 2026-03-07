import "./globals.css"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">

      <body>

        <Header />

        <div style={{
          display:"flex",
          minHeight:"calc(100vh - 64px)"
        }}>

          <Sidebar />

          <main style={{
            flex:1,
            padding:32
          }}>

            {children}

          </main>

        </div>

      </body>

    </html>
  )

}