// App.tsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "sonner"

import { ProtectedRoute } from "@/MyComponents/ProtectedRoute"
import MainLayout from "./layouts/MainLayout"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import Dashboard from "./pages/DashboardPage"
import ProductsPage from "./pages/ProductsPage"
import StockPage from "./pages/StockPage"
import SuppliersPage from "./pages/SuppliersPage"
import ReportsPage from "./pages/ReportsPage"
import SettingsPage from "./pages/SettingsPage"

const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────
  { path: "/",       element: <HomePage /> },
  { path: "/login",  element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },

  // ── Protected routes (must be logged in) ───────────────
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/products",  element: <ProductsPage /> },
      { path: "/stock",     element: <StockPage /> },
      { path: "/suppliers", element: <SuppliersPage /> },
      { path: "/reports",   element: <ReportsPage /> },
      {
        path: "/settings",
        element: (
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── Fallback ───────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" richColors />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}