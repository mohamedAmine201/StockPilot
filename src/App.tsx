// App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"

import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"

import Dashboard from "./pages/DashboardPage" 
import ProductsPage from "./pages/ProductsPage"
import StockPage from "./pages/StockPage"
import SuppliersPage from './pages/SuppliersPage'
import ReportsPage from "./pages/ReportsPage"
import SettingsPage from "./pages/SettingsPage"


const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
    {
    element: <MainLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/stock', element: <StockPage /> },
      { path: '/suppliers', element: <SuppliersPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> }
    ],
  }
])

export default function App() {
  return <RouterProvider router={router} />
}