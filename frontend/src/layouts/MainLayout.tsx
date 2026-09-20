// layouts/MainLayout.tsx
import { Outlet } from "react-router-dom"
import Sidebar from "../MyComponents/Sidebar"

export default function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <Outlet />
    </div>
  )
}