// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Spinner } from "@/components/ui/spinner"

export function ProtectedRoute({ children, requiredRole }: {
  children: React.ReactNode
  requiredRole?: "admin" | "manager" | "staff"
}) {
  const { user, loading } = useAuth()

  if (loading) return 
    <div className="flex justify-center items-center min-h-screen"><Spinner /></div> // waiting for /me/ to resolve

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && user.role !== requiredRole)
    return <Navigate to="/dashboard" replace /> // logged in but wrong role

  return <>{children}</>
}