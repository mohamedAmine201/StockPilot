// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from "react"

const API = import.meta.env.VITE_API_URL

type Role = "admin" | "manager" | "staff"

interface User {
  id: number
  username: string
  email: string
  role: Role
  is_active: boolean
  date_joined: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  csrfToken: string
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [csrfToken, setCsrfToken] = useState("")

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch CSRF token from body — not document.cookie
        const csrfRes  = await fetch(`${API}/api/auth/csrf/`, {
          credentials: "include",
        })
        const csrfData = await csrfRes.json()
        setCsrfToken(csrfData.csrfToken)

        // 2. Restore auth state
        const res = await fetch(`${API}/api/auth/me/`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/api/auth/login/`, {
      method:      "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken":  csrfToken,
      },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Login failed.")
    }

    const { user } = await res.json()
    setUser(user)
  }

  async function logout() {
    await fetch(`${API}/api/auth/logout/`, {
      method:      "POST",
      credentials: "include",
      headers:     { "X-CSRFToken": csrfToken },
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, csrfToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}