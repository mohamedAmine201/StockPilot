import { NavLink, Link } from "react-router-dom"
import {
  Boxes,
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Products",  to: "/products",  icon: Package },
  { label: "Stock",     to: "/stock",     icon: ArrowLeftRight },
  { label: "Suppliers", to: "/suppliers", icon: Truck },
  { label: "Reports",   to: "/reports",   icon: FileBarChart },
  { label: "Settings",  to: "/settings",  icon: Settings, adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  )

  return (
    <aside className="flex w-64 flex-col border-r border-slate-100 bg-white">

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Link to="/dashboard">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E3A5F]">
              <Boxes className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-black">
              Stock<span className="text-[#22A06B]">Pilot</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#E8F5EE] text-[#1E3A5F]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      "h-4 w-4",
                      isActive ? "text-[#22A06B]" : "text-slate-400",
                    ].join(" ")}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}

        {/* Logout — directly below nav items */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                     text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 group"
        >
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          Log out
        </button>
      </nav>

      {/* Footer — user info + version */}
      <div className="border-t border-slate-100 px-6 py-4">
        <p className="text-sm font-medium text-slate-900 truncate">{user?.username}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        <p className="mt-2 text-xs text-slate-300">StockPilot v1.0</p>
      </div>

    </aside>
  )
}