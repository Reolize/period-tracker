const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token")

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
    return
  }

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "API error")
  }

  return res.json()
}