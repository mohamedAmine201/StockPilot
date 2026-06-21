import { useState, useMemo } from "react"
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
  Legend,
} from "recharts"

/* -------------------------------------------------------
 * Design tokens
 * bg:       #F8F9FC  surface: #FFFFFF  border:   #E8ECF2
 * text-1:   #111827  text-2:  #6B7280  text-3:   #9CA3AF
 * accent:   #4F6EF7  positive:#16A34A  danger:   #DC2626
 * amber:    #D97706  violet:  #7C3AED
 * ----------------------------------------------------- */

type Period = "week" | "month" | "quarter"

/* ── Raw mock data ──────────────────────────────────── */
const ALL_MOVEMENTS = [
  { date:"2026-06-20", product:"A4 Paper Ream",          sku:"OFC-0042", type:"in",  qty:50, unitCost:650,  supplier:"OfficePro"   },
  { date:"2026-06-20", product:"HDMI Cable 2m",           sku:"ELC-0114", type:"out", qty:12, unitCost:850,  supplier:"—"           },
  { date:"2026-06-19", product:"Wireless Mouse",          sku:"ELC-0098", type:"out", qty:8,  unitCost:2400, supplier:"—"           },
  { date:"2026-06-19", product:"Cardboard Box (Medium)",  sku:"PKG-0021", type:"out", qty:30, unitCost:120,  supplier:"—"           },
  { date:"2026-06-18", product:"Cordless Drill Battery",  sku:"TLS-0007", type:"in",  qty:20, unitCost:4800, supplier:"ToolZone"    },
  { date:"2026-06-18", product:"Bubble Wrap Roll 50m",    sku:"PKG-0034", type:"in",  qty:10, unitCost:950,  supplier:"PackMaster"  },
  { date:"2026-06-17", product:"Stapler Heavy Duty",      sku:"OFC-0055", type:"out", qty:3,  unitCost:1100, supplier:"—"           },
  { date:"2026-06-17", product:"USB-C Hub 7-in-1",        sku:"ELC-0201", type:"in",  qty:15, unitCost:3200, supplier:"TechDistrib" },
  { date:"2026-06-16", product:"Ballpoint Pens (Box/12)", sku:"OFC-0031", type:"in",  qty:20, unitCost:280,  supplier:"OfficePro"   },
  { date:"2026-06-16", product:"Measuring Tape 5m",       sku:"TLS-0041", type:"out", qty:5,  unitCost:580,  supplier:"—"           },
  { date:"2026-06-15", product:"HDMI Cable 2m",           sku:"ELC-0114", type:"in",  qty:10, unitCost:850,  supplier:"TechDistrib" },
  { date:"2026-06-14", product:"Wireless Mouse",          sku:"ELC-0098", type:"in",  qty:20, unitCost:2400, supplier:"TechDistrib" },
  { date:"2026-06-10", product:"Cardboard Box (Medium)",  sku:"PKG-0021", type:"in",  qty:40, unitCost:120,  supplier:"PackMaster"  },
  { date:"2026-06-08", product:"A4 Paper Ream",           sku:"OFC-0042", type:"out", qty:15, unitCost:650,  supplier:"—"           },
  { date:"2026-06-05", product:"Cordless Drill Battery",  sku:"TLS-0007", type:"out", qty:8,  unitCost:4800, supplier:"—"           },
  { date:"2026-05-28", product:"USB-C Hub 7-in-1",        sku:"ELC-0201", type:"out", qty:10, unitCost:3200, supplier:"—"           },
  { date:"2026-05-22", product:"Bubble Wrap Roll 50m",    sku:"PKG-0034", type:"out", qty:8,  unitCost:950,  supplier:"—"           },
  { date:"2026-05-15", product:"Measuring Tape 5m",       sku:"TLS-0041", type:"in",  qty:25, unitCost:580,  supplier:"ToolZone"    },
  { date:"2026-05-10", product:"Ballpoint Pens (Box/12)", sku:"OFC-0031", type:"out", qty:12, unitCost:280,  supplier:"—"           },
  { date:"2026-05-05", product:"Stapler Heavy Duty",      sku:"OFC-0055", type:"in",  qty:10, unitCost:1100, supplier:"OfficePro"   },
  { date:"2026-04-28", product:"HDMI Cable 2m",           sku:"ELC-0114", type:"in",  qty:20, unitCost:850,  supplier:"TechDistrib" },
  { date:"2026-04-20", product:"Wireless Mouse",          sku:"ELC-0098", type:"out", qty:15, unitCost:2400, supplier:"—"           },
  { date:"2026-04-15", product:"A4 Paper Ream",           sku:"OFC-0042", type:"in",  qty:100,unitCost:650,  supplier:"OfficePro"   },
  { date:"2026-04-10", product:"Cordless Drill Battery",  sku:"TLS-0007", type:"in",  qty:15, unitCost:4800, supplier:"ToolZone"    },
]

const PRODUCTS_SNAPSHOT = [
  { name:"HDMI Cable 2m",          sku:"ELC-0114", stock:3,  price:850,  category:"Electronics"    },
  { name:"Wireless Mouse",          sku:"ELC-0098", stock:5,  price:2400, category:"Electronics"    },
  { name:"USB-C Hub 7-in-1",        sku:"ELC-0201", stock:22, price:3200, category:"Electronics"    },
  { name:"A4 Paper Ream",           sku:"OFC-0042", stock:12, price:650,  category:"Office Supplies"},
  { name:"Ballpoint Pens (Box/12)", sku:"OFC-0031", stock:40, price:280,  category:"Office Supplies"},
  { name:"Stapler Heavy Duty",      sku:"OFC-0055", stock:0,  price:1100, category:"Office Supplies"},
  { name:"Cardboard Box (Medium)",  sku:"PKG-0021", stock:8,  price:120,  category:"Packaging"      },
  { name:"Bubble Wrap Roll 50m",    sku:"PKG-0034", stock:18, price:950,  category:"Packaging"      },
  { name:"Packing Tape (x6)",       sku:"PKG-0019", stock:55, price:340,  category:"Packaging"      },
  { name:"Cordless Drill Battery",  sku:"TLS-0007", stock:2,  price:4800, category:"Tools"          },
  { name:"Stanley Knife Blades",    sku:"TLS-0022", stock:34, price:220,  category:"Tools"          },
  { name:"Measuring Tape 5m",       sku:"TLS-0041", stock:20, price:580,  category:"Tools"          },
]

const DONUT_COLORS = ["#4F6EF7","#16A34A","#D97706","#7C3AED"]
const BAR_COLORS   = ["#4F6EF7","#16A34A","#D97706","#7C3AED","#DC2626"]

const periodDays: Record<Period, number> = { week:7, month:30, quarter:90 }

const inPeriod = (dateStr: string, days: number) => {
  const diff = (new Date("2026-06-20").getTime() - new Date(dateStr).getTime()) / 86400000
  return diff >= 0 && diff < days
}

const formatDA = (v: number) =>
  v >= 1_000_000
    ? (v / 1_000_000).toFixed(1) + "M DA"
    : v >= 1_000
    ? (v / 1_000).toFixed(0) + "K DA"
    : v + " DA"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#E8ECF2] bg-white px-3 py-2 shadow-md text-xs">
      <p className="mb-1 font-semibold text-[#111827]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 500 ? formatDA(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const exportCSV = (rows: typeof ALL_MOVEMENTS, filename: string) => {
  const header = "Date,Product,SKU,Type,Quantity,Unit Cost (DA),Total (DA),Supplier"
  const lines  = rows.map((r) =>
    [r.date, r.product, r.sku, r.type === "in" ? "Stock In" : "Stock Out",
     r.qty, r.unitCost, r.qty * r.unitCost, r.supplier].join(",")
  )
  const blob = new Blob([[header, ...lines].join("\n")], { type:"text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a"); a.href=url; a.download=filename; a.click()
  URL.revokeObjectURL(url)
}

const exportInventoryCSV = () => {
  const header = "Product,SKU,Category,Stock,Unit Price (DA),Total Value (DA)"
  const lines  = PRODUCTS_SNAPSHOT.map((p) =>
    [p.name, p.sku, p.category, p.stock, p.price, p.stock * p.price].join(",")
  )
  const blob = new Blob([[header, ...lines].join("\n")], { type:"text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a"); a.href=url; a.download="inventory-snapshot.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month")
  const days = periodDays[period]

  /* ── Filtered movements ─────────────────────────── */
  const movements = useMemo(
    () => ALL_MOVEMENTS.filter((m) => inPeriod(m.date, days)),
    [days],
  )

  const inMovements  = movements.filter((m) => m.type === "in")
  const outMovements = movements.filter((m) => m.type === "out")

  /* ── Key metrics ────────────────────────────────── */
  const inventoryValue  = PRODUCTS_SNAPSHOT.reduce((s, p) => s + p.stock * p.price, 0)
  const restockedValue  = inMovements.reduce((s, m) => s + m.qty * m.unitCost, 0)
  const dispatchedValue = outMovements.reduce((s, m) => s + m.qty * m.unitCost, 0)
  const totalUnitsOut   = outMovements.reduce((s, m) => s + m.qty, 0)
  const avgStock        = PRODUCTS_SNAPSHOT.reduce((s, p) => s + p.stock, 0) / PRODUCTS_SNAPSHOT.length
  const turnoverRate    = avgStock > 0 ? (totalUnitsOut / avgStock).toFixed(2) : "0"
  const outOfStockCount = PRODUCTS_SNAPSHOT.filter((p) => p.stock === 0).length

  /* ── Bar chart: Stock In vs Out over time ───────── */
  const barData = useMemo(() => {
    const labels = period === "week"
      ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
      : period === "month"
      ? ["Week 1","Week 2","Week 3","Week 4"]
      : ["Jan","Feb","Mar","Apr","May","Jun"]

    if (period === "week") {
      const now = new Date("2026-06-20")
      return labels.map((label, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i))
        const ds = d.toISOString().slice(0, 10)
        const ins  = ALL_MOVEMENTS.filter((m) => m.date === ds && m.type === "in" ).reduce((s,m) => s+m.qty, 0)
        const outs = ALL_MOVEMENTS.filter((m) => m.date === ds && m.type === "out").reduce((s,m) => s+m.qty, 0)
        return { label, in: ins, out: outs }
      })
    }
    if (period === "month") {
      return labels.map((label, i) => {
        const start = i * 7, end = start + 7
        const wMovements = ALL_MOVEMENTS.filter((m) => {
          const diff = (new Date("2026-06-20").getTime() - new Date(m.date).getTime()) / 86400000
          return diff >= start && diff < end
        })
        return {
          label,
          in:  wMovements.filter((m) => m.type==="in" ).reduce((s,m) => s+m.qty, 0),
          out: wMovements.filter((m) => m.type==="out").reduce((s,m) => s+m.qty, 0),
        }
      })
    }
    return labels.map((label) => ({
      label,
      in:  Math.floor(Math.random() * 80 + 20),
      out: Math.floor(Math.random() * 60 + 20),
    }))
  }, [period])

  /* ── Area chart: Inventory value trend ─────────── */
  const areaData = useMemo(() => {
    const base = inventoryValue
    return barData.map((d, i) => ({
      label:  d.label,
      value:  Math.round(base - (barData.length - 1 - i) * 12000 + (d.in - d.out) * 800),
    }))
  }, [barData, inventoryValue])

  /* ── Top 5 products by movement ─────────────────── */
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {}
    movements.forEach((m) => {
      if (!map[m.sku]) map[m.sku] = { name: m.product, total: 0 }
      map[m.sku].total += m.qty
    })
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((p, i) => ({ ...p, color: BAR_COLORS[i % BAR_COLORS.length] }))
  }, [movements])

  /* ── Spending by supplier ───────────────────────── */
  const supplierSpend = useMemo(() => {
    const map: Record<string, number> = {}
    inMovements.forEach((m) => {
      if (m.supplier === "—") return
      map[m.supplier] = (map[m.supplier] ?? 0) + m.qty * m.unitCost
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [inMovements])

  /* ── Most restocked / dispatched tables ─────────── */
  const mostRestocked = useMemo(() => {
    const map: Record<string, { name:string; sku:string; units:number; cost:number; lastDate:string }> = {}
    inMovements.forEach((m) => {
      if (!map[m.sku]) map[m.sku] = { name:m.product, sku:m.sku, units:0, cost:0, lastDate:m.date }
      map[m.sku].units += m.qty
      map[m.sku].cost  += m.qty * m.unitCost
      if (m.date > map[m.sku].lastDate) map[m.sku].lastDate = m.date
    })
    return Object.values(map).sort((a,b) => b.units - a.units).slice(0, 5)
  }, [inMovements])

  const mostDispatched = useMemo(() => {
    const map: Record<string, { name:string; sku:string; units:number; lastDate:string }> = {}
    outMovements.forEach((m) => {
      if (!map[m.sku]) map[m.sku] = { name:m.product, sku:m.sku, units:0, lastDate:m.date }
      map[m.sku].units += m.qty
      if (m.date > map[m.sku].lastDate) map[m.sku].lastDate = m.date
    })
    return Object.values(map).sort((a,b) => b.units - a.units).slice(0, 5)
  }, [outMovements])

  const periodLabel = { week:"This Week", month:"This Month", quarter:"This Quarter" }[period]

  const metrics = [
    {
      label:   "Inventory Value",
      value:   formatDA(inventoryValue),
      sub:     "current stock value",
      icon:    DollarSign,
      color:   "#4F6EF7",
      bg:      "rgba(79,110,247,0.08)",
    },
    {
      label:   "Restocked Value",
      value:   formatDA(restockedValue),
      sub:     `${inMovements.length} inbound movements`,
      icon:    TrendingDown,
      color:   "#16A34A",
      bg:      "rgba(22,163,74,0.08)",
    },
    {
      label:   "Dispatched Value",
      value:   formatDA(dispatchedValue),
      sub:     `${outMovements.length} outbound movements`,
      icon:    TrendingUp,
      color:   "#DC2626",
      bg:      "rgba(220,38,38,0.08)",
    },
    {
      label:   "Stock Turnover",
      value:   `×${turnoverRate}`,
      sub:     "units out ÷ avg stock",
      icon:    RefreshCw,
      color:   "#D97706",
      bg:      "rgba(217,119,6,0.08)",
    },
    {
      label:   "Out of Stock",
      value:   String(outOfStockCount),
      sub:     "products at zero",
      icon:    AlertOctagon,
      color:   outOfStockCount > 0 ? "#DC2626" : "#16A34A",
      bg:      outOfStockCount > 0 ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
    },
  ]

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
              <BarChart data={barData} margin={{ top:4, right:16, left:-20, bottom:0 }} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
                <Bar dataKey="in"  name="Stock In"  fill="#16A34A" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="out" name="Stock Out" fill="#4F6EF7" radius={[4,4,0,0]} maxBarSize={28} />
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
              <AreaChart data={areaData} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F6EF7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => (v/1000).toFixed(0)+"K"} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="value" name="Inventory Value"
                  stroke="#4F6EF7" strokeWidth={2.5}
                  fill="url(#valueGrad)" dot={false}
                  activeDot={{ r:4, strokeWidth:0, fill:"#4F6EF7" }}
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
                          style={{ width:`${pct}%`, backgroundColor: p.color }}
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
                <p className="text-sm text-[#9CA3AF]">No supplier data</p>
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
                          backgroundColor:"#fff", border:"1px solid #E8ECF2",
                          borderRadius:"8px", fontSize:"12px",
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
                        <span className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
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
                      <p className="text-xs text-[#9CA3AF]">{formatDA(p.cost)}</p>
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
                        Last: {new Date(p.lastDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}
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
                icon:  BarChart2,
                title: "Inventory Snapshot",
                desc:  "All products with current stock and value",
                color: "#4F6EF7",
                bg:    "rgba(79,110,247,0.08)",
                action: exportInventoryCSV,
                label:  "Export CSV",
              },
              {
                icon:  TrendingUp,
                title: "Stock Movements",
                desc:  `All movements for ${periodLabel.toLowerCase()}`,
                color: "#16A34A",
                bg:    "rgba(22,163,74,0.08)",
                action: () => exportCSV(movements, "stock-movements.csv"),
                label:  "Export CSV",
              },
              {
                icon:  FileText,
                title: "Print Summary",
                desc:  "Formatted report ready for printing",
                color: "#D97706",
                bg:    "rgba(217,119,6,0.08)",
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