import { useState, useEffect } from "react"
import {
  Search,
  Bell,
  Package,
  AlertTriangle,
  Boxes,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
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
import { useApi } from "@/lib/api"

/* -------------------------------------------------------
 * Design tokens
 * ----------------------------------------------------- */
const ACCENT   = "#4F6EF7"
const POSITIVE = "#16A34A"
const DANGER   = "#DC2626"

/* -------------------------------------------------------
 * Types
 * ----------------------------------------------------- */
interface DashboardData {
  stats: {
    inventory_value:     number
    total_products:      number
    low_stock_count:     number
    movements_7d:        number
    movements_last_week: number
  }
  low_stock: {
    id:        number
    name:      string
    sku:       string
    category:  string
    stock:     number
    threshold: number
  }[]
  movement_chart: { day: string; in: number; out: number }[]
  category_chart: { name: string; value: number }[]
  recent_activity: {
    product:  string
    type:     "in" | "out" | "adjustment"
    quantity: number
    time:     string
  }[]
}

/* -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */
function formatDA(value: number): string {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M DA"
  if (value >= 1_000)     return (value / 1_000).toFixed(0)     + "K DA"
  return Math.round(value) + " DA"
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const pct = ((current - previous) / previous) * 100
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%"
}

// Generates a distinct color for each category slice, however many there are —
// fixes categories collapsing onto repeated colors once there are more than 4.
function getCategoryColor(index: number, total: number): string {
  const hue = Math.round((360 / Math.max(total, 1)) * index)
  return `hsl(${hue}, 65%, 55%)`
}

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

/* -------------------------------------------------------
 * Component
 * ----------------------------------------------------- */
export default function Dashboard() {
  const { request } = useApi()

  const [query,   setQuery]   = useState("")
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    request<DashboardData>("/reports/dashboard/")
      .then(setData)
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#F8F9FC]">
        <Loader2 className="h-6 w-6 animate-spin text-[#4F6EF7]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-[#F8F9FC] gap-3">
        <p className="text-sm text-[#DC2626]">{error || "No data available."}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium text-[#4F6EF7] hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const { stats, low_stock, movement_chart, category_chart, recent_activity } = data

  // Filtered low stock for the search bar
  const filteredLowStock = low_stock.filter(
    (p) =>
      query.trim() === "" ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  )

  // Movements change vs last week
  const movementsChange = pctChange(stats.movements_7d, stats.movements_last_week)
  const movementsTrend  =
    stats.movements_7d >= stats.movements_last_week ? "up" : "down"

  const inventoryValueNumber = Number(stats.inventory_value)

  const statCards = [
    {
      label:  "Inventory Value",
      value:  formatDA(inventoryValueNumber),
      // No historical snapshot to compare against yet, so don't show a fake
      // "+0%" — leave it blank until real week-over-week data exists.
      change: "",
      trend:  "up" as const,
      icon:   TrendingUp,
    },
    {
      label:  "Total Products",
      value:  String(stats.total_products),
      change: "",
      trend:  "up" as const,
      icon:   Package,
    },
    {
      label:  "Low Stock Items",
      value:  String(stats.low_stock_count),
      change: "",
      trend:  stats.low_stock_count > 0 ? "down" as const : "up" as const,
      icon:   AlertTriangle,
    },
    {
      label:  "Movements (7d)",
      value:  String(stats.movements_7d),
      change: movementsChange,
      trend:  movementsTrend,
      icon:   Boxes,
    },
  ]

  const hasAlerts = stats.low_stock_count > 0

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* ── Top bar ─────────────────────────────────── */}
      <div className="mb-7 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search low stock products…"
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
        {statCards.map((stat) => {
          const Icon   = stat.icon
          const isDown = stat.trend === "down"
          return (
            <Card key={stat.label} className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
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
                {stat.change && (
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
                )}
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
            {stats.low_stock_count} need attention
          </Badge>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {filteredLowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Package className="h-8 w-8 text-[#9CA3AF]" />
              <p className="text-sm text-[#9CA3AF]">
                {query ? "No products match your search." : "All products are well stocked."}
              </p>
            </div>
          ) : (
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
                {filteredLowStock.map((p) => {
                  const ratio   = p.threshold > 0 ? p.stock / p.threshold : 0
                  const urgency = ratio < 0.3 ? DANGER : "#D97706"
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
          )}
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
              <LineChart data={movement_chart} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
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
            {category_chart.length === 0 ? (
              <div className="flex h-52 items-center justify-center">
                <p className="text-sm text-[#9CA3AF]">No category data yet.</p>
              </div>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={category_chart}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="white"
                        strokeWidth={2}
                      >
                        {category_chart.map((_, i) => (
                          <Cell
                            key={i}
                            fill={getCategoryColor(i, category_chart.length)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} units`, name]}
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
                  {category_chart.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: getCategoryColor(i, category_chart.length) }}
                      />
                      <span className="truncate">{cat.name}</span>
                      <span className="ml-auto text-[#9CA3AF]">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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
          {recent_activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Boxes className="h-8 w-8 text-[#9CA3AF]" />
              <p className="text-sm text-[#9CA3AF]">No recent movements.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F3F4F6]">
              {recent_activity.map((a, i) => (
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
                        : <ArrowUpRight   className="h-4 w-4" style={{ color: ACCENT }}   />
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
          )}
        </CardContent>
      </Card>

    </div>
  )
}