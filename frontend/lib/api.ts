const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token")

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true", // Add this to bypass localtunnel warning page
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      cache: "no-store", // Force no cache for all API requests to prevent ghost state
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
      return
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "API error" }))
      throw new Error(error.detail || "API error")
    }

    return await res.json()
  } catch (error: any) {
    // Handle network errors like "Failed to fetch"
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error("Unable to connect to the server. Please check your internet connection or make sure the backend server is running.")
    }
    throw error
  }
}