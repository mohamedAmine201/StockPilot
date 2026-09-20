import { useState, useMemo, useEffect } from "react"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertOctagon,
  BarChart2,
  FileText,
  Printer,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useApi } from "@/lib/api"

/* -------------------------------------------------------
 * Design tokens
 * ----------------------------------------------------- */

type Period = "week" | "month" | "quarter"

const DONUT_COLORS = ["#4F6EF7", "#16A34A", "#D97706", "#7C3AED"]
const BAR_COLORS   = ["#4F6EF7", "#16A34A", "#D97706", "#7C3AED", "#DC2626"]
const periodDays: Record<Period, number> = { week: 7, month: 30, quarter: 90 }

/* -------------------------------------------------------
 * API response types
 * ----------------------------------------------------- */

interface CategoryBreakdown {
  category:      string
  product_count: number
  total_value:   number
  low_stock:     number
  out_of_stock:  number
}

interface InventoryOverview {
  total_products:     number
  total_value:        number
  low_stock_count:    number
  out_of_stock_count: number
  in_stock_count:     number
  categories:         CategoryBreakdown[]
}

interface DailySummary {
  date:      string
  stock_in:  number
  stock_out: number
  net:       number
}

interface MovementsReport {
  total_in:       number
  total_out:      number
  net_change:     number
  total_in_value: number
  daily:          DailySummary[]
}

interface SupplierPerformance {
  id:             number
  name:           string
  product_count:  number
  total_received: number
  total_value:    number
  last_delivery:  string | null
}

interface RawMovement {
  id:               number
  product:          number
  product_name:     string
  product_sku:      string
  product_unit:     string
  movement_type:    "in" | "out" | "adjustment"
  quantity:         number
  unit_cost:        number | null
  reason:           string
  reference:        string
  performed_by_name: string
  created_at:       string
}

/* -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */

const formatDA = (v: number) =>
  v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M DA"
  : v >= 1_000   ? (v / 1_000).toFixed(0) + "K DA"
  : Math.round(v) + " DA"

function isInPeriod(isoDate: string, days: number): boolean {
  const diff = (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff < days
}

function buildBarData(daily: DailySummary[], period: Period) {
  if (period === "week") {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const now = new Date()
    return dayNames.map((label, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().slice(0, 10)
      const row = daily.find((r) => r.date === ds)
      return { label, in: row?.stock_in ?? 0, out: row?.stock_out ?? 0 }
    })
  }

  if (period === "month") {
    const labels = ["Week 1", "Week 2", "Week 3", "Week 4"]
    return labels.map((label, i) => {
      const startDay = i * 7
      const endDay   = startDay + 7
      const bucket   = daily.filter((r) => {
        const diff = (Date.now() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24)
        return diff >= startDay && diff < endDay
      })
      return {
        label,
        in:  bucket.reduce((s, r) => s + r.stock_in,  0),
        out: bucket.reduce((s, r) => s + r.stock_out, 0),
      }
    })
  }

  // quarter — last 3 calendar months
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (2 - i))
    const label   = d.toLocaleString("default", { month: "short" })
    const targetM = d.getMonth()
    const targetY = d.getFullYear()
    const bucket  = daily.filter((r) => {
      const rd = new Date(r.date)
      return rd.getMonth() === targetM && rd.getFullYear() === targetY
    })
    return {
      label,
      in:  bucket.reduce((s, r) => s + r.stock_in,  0),
      out: bucket.reduce((s, r) => s + r.stock_out, 0),
    }
  })
}

function buildAreaData(
  barData: { label: string; in: number; out: number }[],
  currentValue: number,
) {
  const result: { label: string; value: number }[] = []
  let value = currentValue
  for (let i = barData.length - 1; i >= 0; i--) {
    result.unshift({ label: barData[i].label, value: Math.max(0, Math.round(value)) })
    value -= (barData[i].in - barData[i].out) * 800
  }
  return result
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#E8ECF2] bg-white px-3 py-2 shadow-md text-xs">
      <p className="mb-1 font-semibold text-[#111827]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }} className="font-medium">
          {p.name}:{" "}
          {typeof p.value === "number" && p.value > 500 ? formatDA(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

/* -------------------------------------------------------
 * Component
 * ----------------------------------------------------- */

export default function ReportsPage() {
  const { request } = useApi()

  const [period, setPeriod] = useState<Period>("month")

  // ── API state ────────────────────────────────────────
  const [inventory,    setInventory]    = useState<InventoryOverview | null>(null)
  const [movReport,    setMovReport]    = useState<MovementsReport | null>(null)
  const [suppliers,    setSuppliers]    = useState<SupplierPerformance[]>([])
  const [rawMovements, setRawMovements] = useState<RawMovement[]>([])

  const [loadingStatic,  setLoadingStatic]  = useState(true)
  const [loadingPeriod,  setLoadingPeriod]  = useState(true)
  const [fetchError,     setFetchError]     = useState("")

  const loading = loadingStatic || loadingPeriod

  // ── Fetch inventory + raw movements once ─────────────
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const [inv, raw] = await Promise.all([
          request<InventoryOverview>("/reports/inventory/"),
          request<RawMovement[]>("/stock/"),
        ])
        setInventory(inv)
        setRawMovements(raw)
      } catch {
        setFetchError("Failed to load report data. Please try again.")
      } finally {
        setLoadingStatic(false)
      }
    }
    fetchStatic()
  }, [])

  // ── Refetch on period change ──────────────────────────
  useEffect(() => {
    const fetchPeriodData = async () => {
      setLoadingPeriod(true)
      try {
        const [mov, sup] = await Promise.all([
          request<MovementsReport>(`/reports/movements/?range=${period}`),
          request<SupplierPerformance[]>(`/reports/suppliers/?range=${period}`),
        ])
        setMovReport(mov)
        setSuppliers(sup)
      } catch {
        setFetchError("Failed to load period data. Please try again.")
      } finally {
        setLoadingPeriod(false)
      }
    }
    fetchPeriodData()
  }, [period])

  // ── Period-filtered raw movements ────────────────────
  const days = periodDays[period]

  const periodMovements = useMemo(
    () => rawMovements.filter((m) => isInPeriod(m.created_at, days)),
    [rawMovements, days],
  )

  const inMovements  = periodMovements.filter((m) => m.movement_type === "in")
  const outMovements = periodMovements.filter((m) => m.movement_type === "out")

  // ── Charts ────────────────────────────────────────────
  const barData  = useMemo(() => buildBarData(movReport?.daily ?? [], period), [movReport, period])
  const areaData = useMemo(
    () => buildAreaData(barData, Number(inventory?.total_value ?? 0)),
    [barData, inventory],
  )

  // ── Top 5 products by total movement ─────────────────
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {}
    periodMovements.forEach((m) => {
      if (!map[m.product_sku]) map[m.product_sku] = { name: m.product_name, total: 0 }
      map[m.product_sku].total += m.quantity
    })
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((p, i) => ({ ...p, color: BAR_COLORS[i % BAR_COLORS.length] }))
  }, [periodMovements])

  // ── Most restocked ────────────────────────────────────
  const mostRestocked = useMemo(() => {
    const map: Record<string, {
      name: string; sku: string; units: number; cost: number; lastDate: string
    }> = {}
    inMovements.forEach((m) => {
      if (!map[m.product_sku])
        map[m.product_sku] = { name: m.product_name, sku: m.product_sku, units: 0, cost: 0, lastDate: m.created_at }
      map[m.product_sku].units += m.quantity
      map[m.product_sku].cost  += m.quantity * (m.unit_cost ?? 0)
      if (m.created_at > map[m.product_sku].lastDate)
        map[m.product_sku].lastDate = m.created_at
    })
    return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5)
  }, [inMovements])

  // ── Most dispatched ───────────────────────────────────
  const mostDispatched = useMemo(() => {
    const map: Record<string, {
      name: string; sku: string; units: number; lastDate: string
    }> = {}
    outMovements.forEach((m) => {
      if (!map[m.product_sku])
        map[m.product_sku] = { name: m.product_name, sku: m.product_sku, units: 0, lastDate: m.created_at }
      map[m.product_sku].units += m.quantity
      if (m.created_at > map[m.product_sku].lastDate)
        map[m.product_sku].lastDate = m.created_at
    })
    return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5)
  }, [outMovements])

  // ── Supplier spending donut ───────────────────────────
  const supplierSpend = useMemo(
    () =>
      suppliers
        .filter((s) => s.total_value > 0)
        .map((s) => ({ name: s.name, value: Number(s.total_value) }))
        .slice(0, 5),
    [suppliers],
  )

  // ── Key metrics ───────────────────────────────────────
  const dispatchedValue = outMovements.reduce(
    (s, m) => s + m.quantity * (m.unit_cost ?? 0), 0
  )
  const totalUnitsOut = movReport?.total_out ?? 0
  const totalUnitsIn  = movReport?.total_in  ?? 0
  const avgStock      =
    (inventory?.total_products ?? 0) > 0
      ? (rawMovements.reduce((s) => s, 0) || totalUnitsOut)
      : 0
  const turnoverRate  =
    avgStock > 0 ? (totalUnitsOut / avgStock).toFixed(2) : "0"

  const outOfStock = inventory?.out_of_stock_count ?? 0

  const metrics = [
    {
      label: "Inventory Value",
      value: formatDA(Number(inventory?.total_value ?? 0)),
      sub:   "current stock value",
      icon:  DollarSign,
      color: "#4F6EF7",
      bg:    "rgba(79,110,247,0.08)",
    },
    {
      label: "Restocked Value",
      value: formatDA(Number(movReport?.total_in_value ?? 0)),
      sub:   `${totalUnitsIn} units received`,
      icon:  TrendingDown,
      color: "#16A34A",
      bg:    "rgba(22,163,74,0.08)",
    },
    {
      label: "Dispatched Units",
      value: String(totalUnitsOut),
      sub:   `${outMovements.length} outbound movements`,
      icon:  TrendingUp,
      color: "#DC2626",
      bg:    "rgba(220,38,38,0.08)",
    },
    {
      label: "Net Change",
      value: (movReport?.net_change ?? 0) >= 0
        ? `+${movReport?.net_change ?? 0}`
        : String(movReport?.net_change ?? 0),
      sub:   "units in − units out",
      icon:  RefreshCw,
      color: (movReport?.net_change ?? 0) >= 0 ? "#16A34A" : "#DC2626",
      bg:    (movReport?.net_change ?? 0) >= 0
        ? "rgba(22,163,74,0.08)"
        : "rgba(220,38,38,0.08)",
    },
    {
      label: "Out of Stock",
      value: String(outOfStock),
      sub:   "products at zero",
      icon:  AlertOctagon,
      color: outOfStock > 0 ? "#DC2626" : "#16A34A",
      bg:    outOfStock > 0 ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
    },
  ]

  const periodLabel = { week: "This Week", month: "This Month", quarter: "This Quarter" }[period]

  // ── Export helpers ────────────────────────────────────
  const exportMovementsCSV = () => {
    const header = "Date,Product,SKU,Type,Quantity,Unit Cost (DA),Reference,Performed By"
    const lines  = periodMovements.map((m) =>
      [
        new Date(m.created_at).toLocaleDateString("en-GB"),
        m.product_name,
        m.product_sku,
        m.movement_type === "in" ? "Stock In" : "Stock Out",
        m.quantity,
        m.unit_cost ?? "—",
        m.reference || "—",
        m.performed_by_name,
      ].join(",")
    )
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = "stock-movements.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const exportInventoryCSV = () => {
    const header = "Category,Products,Total Value (DA),Low Stock,Out of Stock"
    const lines  = (inventory?.categories ?? []).map((c) =>
      [c.category, c.product_count, c.total_value, c.low_stock, c.out_of_stock].join(",")
    )
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = "inventory-snapshot.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Loading / error ───────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#F8F9FC]">
        <Loader2 className="h-6 w-6 animate-spin text-[#4F6EF7]" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-[#F8F9FC] gap-3">
        <p className="text-sm text-[#DC2626]">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium text-[#4F6EF7] hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Reports</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Analytical overview of your inventory performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-[#E8ECF2] bg-white text-sm !text-[#111827]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-[#E8ECF2] bg-white text-sm text-[#6B7280] hover:bg-[#F8F9FC]"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* ── Key metrics ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label} className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#9CA3AF]">{m.label}</p>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: m.bg }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                  </div>
                </div>
                <p className="mt-2 text-xl font-bold text-[#111827]">{m.value}</p>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">{m.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Charts row 1 ────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Stock In vs Out bar chart */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Stock In vs Out — {periodLabel}
            </CardTitle>
            <div className="mt-1 flex items-center gap-4 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm bg-[#16A34A]" /> In
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm bg-[#4F6EF7]" /> Out
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-60 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="in"  name="Stock In"  fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="out" name="Stock Out" fill="#4F6EF7" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory value area chart */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Inventory Value Trend — {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F6EF7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v / 1000).toFixed(0) + "K"}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="value" name="Inventory Value"
                  stroke="#4F6EF7" strokeWidth={2.5}
                  fill="url(#valueGrad)" dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#4F6EF7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Top 5 products horizontal bar */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Top Products by Movement — {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {topProducts.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-[#9CA3AF]">No movement data for this period</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {topProducts.map((p) => {
                  const maxTotal = topProducts[0].total
                  const pct = Math.round((p.total / maxTotal) * 100)
                  return (
                    <div key={p.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-[#111827] truncate max-w-[200px]">{p.name}</span>
                        <span className="font-semibold text-[#111827] ml-2">{p.total} units</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F3F4F6]">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by supplier donut */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Spending by Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {supplierSpend.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-[#9CA3AF]">No supplier data for this period</p>
              </div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierSpend} dataKey="value" nameKey="name"
                        innerRadius={45} outerRadius={72}
                        paddingAngle={3} stroke="white" strokeWidth={2}
                      >
                        {supplierSpend.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E8ECF2",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => [formatDA(v), "Spent"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex flex-col gap-1.5">
                  {supplierSpend.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                        />
                        <span className="text-[#6B7280]">{s.name}</span>
                      </div>
                      <span className="font-medium text-[#111827]">{formatDA(s.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Data tables row ──────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Most restocked */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <TrendingDown className="h-4 w-4 text-[#16A34A]" />
              Most Restocked Products
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {mostRestocked.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No inbound movements in this period</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#F3F4F6]">
                {mostRestocked.map((p, i) => (
                  <div key={p.sku} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{p.name}</p>
                        <p className="font-mono text-xs text-[#9CA3AF]">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#16A34A]">+{p.units} units</p>
                      {p.cost > 0 && (
                        <p className="text-xs text-[#9CA3AF]">{formatDA(p.cost)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most dispatched */}
        <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <TrendingUp className="h-4 w-4 text-[#4F6EF7]" />
              Most Dispatched Products
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {mostDispatched.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No outbound movements in this period</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#F3F4F6]">
                {mostDispatched.map((p, i) => (
                  <div key={p.sku} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{p.name}</p>
                        <p className="font-mono text-xs text-[#9CA3AF]">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#4F6EF7]">−{p.units} units</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Last:{" "}
                        {new Date(p.lastDate).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Export panel ────────────────────────────── */}
      <Card className="border-[#E8ECF2] bg-white shadow-none rounded-xl">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold text-[#111827]">Export Data</CardTitle>
          <p className="text-xs text-[#6B7280]">
            Download reports based on your selected period ({periodLabel})
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon:   BarChart2,
                title:  "Inventory Snapshot",
                desc:   "All categories with current stock and value",
                color:  "#4F6EF7",
                bg:     "rgba(79,110,247,0.08)",
                action: exportInventoryCSV,
                label:  "Export CSV",
              },
              {
                icon:   TrendingUp,
                title:  "Stock Movements",
                desc:   `All movements for ${periodLabel.toLowerCase()}`,
                color:  "#16A34A",
                bg:     "rgba(22,163,74,0.08)",
                action: exportMovementsCSV,
                label:  "Export CSV",
              },
              {
                icon:   FileText,
                title:  "Print Summary",
                desc:   "Formatted report ready for printing",
                color:  "#D97706",
                bg:     "rgba(217,119,6,0.08)",
                action: () => window.print(),
                label:  "Print / PDF",
              },
            ].map((e) => {
              const Icon = e.icon
              return (
                <div
                  key={e.title}
                  className="flex items-start gap-3 rounded-xl border border-[#E8ECF2] p-4"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: e.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: e.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827]">{e.title}</p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">{e.desc}</p>
                    <button
                      onClick={e.action}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold transition-colors hover:underline"
                      style={{ color: e.color }}
                    >
                      <Download className="h-3 w-3" />
                      {e.label}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}