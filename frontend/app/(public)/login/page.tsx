"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {

const router = useRouter()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [loading,setLoading] = useState(false)
const [error,setError] = useState("")

async function handleLogin(){

setError("")
setLoading(true)

const formData = new URLSearchParams()

formData.append("username",email)
formData.append("password",password)

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
{
method:"POST",
headers:{
"Content-Type":"application/x-www-form-urlencoded"
},
body:formData.toString()
}
)

setLoading(false)

if(!res.ok){
setError("Invalid email or password")
return
}

const data = await res.json()

localStorage.setItem("token",data.access_token)

router.push("/dashboard")

}

return (

<div className="min-h-screen flex items-center justify-center bg-gray-50">

<div className="bg-white shadow-lg rounded-xl p-8 w-[380px] space-y-5">

<h1 className="text-2xl font-bold text-center">
Login
</h1>

<input
className="border rounded-lg p-2 w-full"
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
className="border rounded-lg p-2 w-full"
type="password"
placeholder="Password"
onChange={(e)=>setPassword(e.target.value)}
/>

{error && (

<p className="text-red-500 text-sm">
{error}
</p>
)}

<button
onClick={handleLogin}
disabled={loading}
className="bg-black text-white w-full py-2 rounded-lg hover:opacity-90"

>

{loading ? "Logging in..." : "Login"}

</button>

<p className="text-sm text-center text-gray-500">

Don't have an account?{" "}

<span
className="underline cursor-pointer"
onClick={()=>router.push("/register")}

>

Register </span>

</p>

</div>

</div>

)
}
