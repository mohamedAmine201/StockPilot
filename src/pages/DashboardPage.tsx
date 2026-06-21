import { useState } from "react"
import {
  Search,
  Bell,
  Package,
  AlertTriangle,
  Boxes,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

/* -------------------------------------------------------
 * Design tokens
 * bg:        #F8F9FC  (cool off-white — not pure white, avoids harshness)
 * surface:   #FFFFFF  (cards)
 * border:    #E8ECF2  (subtle, cool-toned)
 * text-1:    #111827  (near-black headings)
 * text-2:    #6B7280  (muted labels)
 * accent:    #4F6EF7  (indigo — confident, legible on white)
 * positive:  #16A34A  (green — stock in / up trends)
 * danger:    #DC2626  (red — low stock / down trends)
 * amber:     #D97706  (warning threshold proximity)
 * chart[]:   indigo, green, amber, violet
 * ----------------------------------------------------- */

const ACCENT   = "#4F6EF7"
const POSITIVE = "#16A34A"
const DANGER   = "#DC2626"
const CATEGORY_COLORS = ["#4F6EF7", "#16A34A", "#D97706", "#7C3AED"]

const stats = [
  { label: "Inventory Value",     value: "452,300 DA", change: "+4.2%", trend: "up",   icon: TrendingUp  },
  { label: "Total Products",      value: "186",        change: "+3",    trend: "up",   icon: Package     },
  { label: "Low Stock Items",     value: "7",          change: "+2",    trend: "down", icon: AlertTriangle },
  { label: "Movements (7d)",      value: "134",        change: "+18%",  trend: "up",   icon: Boxes       },
]

const movementData = [
  { day: "Mon", in: 40, out: 24 },
  { day: "Tue", in: 30, out: 28 },
  { day: "Wed", in: 50, out: 35 },
  { day: "Thu", in: 27, out: 32 },
  { day: "Fri", in: 60, out: 45 },
  { day: "Sat", in: 22, out: 18 },
  { day: "Sun", in: 15, out: 10 },
]

const categoryData = [
  { name: "Electronics",    value: 48 },
  { name: "Office Supplies",value: 32 },
  { name: "Packaging",      value: 21 },
  { name: "Tools",          value: 14 },
]

const lowStockProducts = [
  { name: "Cardboard Box (Medium)", sku: "PKG-0021", stock: 8,  threshold: 20, category: "Packaging"      },
  { name: "HDMI Cable 2m",          sku: "ELC-0114", stock: 3,  threshold: 15, category: "Electronics"    },
  { name: "A4 Paper Ream",          sku: "OFC-0042", stock: 12, threshold: 25, category: "Office Supplies" },
  { name: "Wireless Mouse",         sku: "ELC-0098", stock: 5,  threshold: 10, category: "Electronics"    },
  { name: "Cordless Drill Battery", sku: "TLS-0007", stock: 2,  threshold: 8,  category: "Tools"          },
]

const recentActivity = [
  { product: "HDMI Cable 2m",          type: "out", quantity: 12, time: "2 hours ago"  },
  { product: "A4 Paper Ream",          type: "in",  quantity: 50, time: "5 hours ago"  },
  { product: "Wireless Mouse",         type: "out", quantity: 8,  time: "Yesterday"    },
  { product: "Cardboard Box (Medium)", type: "out", quantity: 30, time: "Yesterday"    },
  { product: "Cordless Drill Battery", type: "in",  quantity: 20, time: "2 days ago"   },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#E8ECF2] bg-white px-3 py-2 shadow-md text-xs">
      <p className="mb-1 font-medium text-[#111827]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const hasAlerts = lowStockProducts.length > 0

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* ── Top bar ─────────────────────────────────── */}
      <div className="mb-7 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, suppliers, stock…"
            className="pl-9 h-10 rounded-lg border-[#E8ECF2] !bg-white text-sm text-[#111827]
                       placeholder:text-[#9CA3AF] shadow-none
                       focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
          />
        </div>

        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg
                     border border-[#E8ECF2] bg-white shadow-none hover:bg-[#F3F4F6] transition-colors"
        >
          <Bell className="h-4 w-4 text-[#6B7280]" />
          {hasAlerts && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon   = stat.icon
          const isDown = stat.trend === "down"
          return (
            <Card
              key={stat.label}
              className="border-[#E8ECF2] bg-white shadow-none rounded-xl"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    {stat.label}
                  </p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: isDown
                        ? "rgba(220,38,38,0.08)"
                        : "rgba(79,110,247,0.08)",
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: isDown ? DANGER : ACCENT }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[#111827]">
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {isDown
                    ? <ArrowDownRight className="h-3 w-3 text-[#DC2626]" />
                    : <ArrowUpRight   className="h-3 w-3 text-[#16A34A]" />
                  }
                  <span style={{ color: isDown ? DANGER : POSITIVE }}>
                    {stat.change}
                  </span>
                  <span className="text-[#9CA3AF]">vs last week</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Low stock table ─────────────────────────── */}
      <Card className="mb-6 border-[#E8ECF2] bg-white shadow-none rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Low Stock Products
            </CardTitle>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Items that have fallen below their reorder threshold
            </p>
          </div>
          <Badge
            className="rounded-md px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: "rgba(220,38,38,0.08)", color: DANGER }}
          >
            {lowStockProducts.length} need attention
          </Badge>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E8ECF2] hover:bg-transparent">
                <TableHead className="text-xs text-[#9CA3AF] font-medium">Product</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] font-medium">SKU</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] font-medium">Category</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] font-medium text-right">Stock</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] font-medium text-right">Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((p) => {
                const ratio    = p.stock / p.threshold
                const urgency  = ratio < 0.3 ? DANGER : "#D97706"
                return (
                  <TableRow key={p.sku} className="border-[#E8ECF2] hover:bg-[#F8F9FC]">
                    <TableCell className="text-sm font-medium text-[#111827]">
                      {p.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#9CA3AF]">
                      {p.sku}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold" style={{ color: urgency }}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#9CA3AF]">
                      {p.threshold}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Charts ──────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Line chart */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Stock Movements — Last 7 Days
            </CardTitle>
            <div className="mt-1 flex items-center gap-4 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: POSITIVE }} />
                Stock In
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: ACCENT }} />
                Stock Out
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-64 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F5" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="in" name="Stock In"
                  stroke={POSITIVE} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone" dataKey="out" name="Stock Out"
                  stroke={ACCENT} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Stock by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="white"
                    strokeWidth={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E8ECF2",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full px-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent activity ─────────────────────────── */}
      <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold text-[#111827]">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ul className="divide-y divide-[#F3F4F6]">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor:
                        a.type === "in"
                          ? "rgba(22,163,74,0.08)"
                          : "rgba(79,110,247,0.08)",
                    }}
                  >
                    {a.type === "in"
                      ? <ArrowDownRight className="h-4 w-4" style={{ color: POSITIVE }} />
                      : <ArrowUpRight   className="h-4 w-4" style={{ color: ACCENT   }} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{a.product}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {a.type === "in" ? "Stock added" : "Stock removed"}
                      {" · "}
                      <span className="font-medium text-[#6B7280]">{a.quantity} units</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#9CA3AF] flex-shrink-0 ml-4">{a.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  )
}