// src/lib/api.ts
import { useAuth } from "@/context/AuthContext"

const BASE = `${import.meta.env.VITE_API_URL}/api`

export function useApi() {
  const { csrfToken } = useAuth()

  async function request<T = any>(
    path:   string,
    method: string = "GET",
    body?:  object,
  ): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken":  csrfToken,  // ← comes from context, not document.cookie
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 204) return undefined as T
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw { status: res.status, data }
    return data as T
  }

  return { request }
}