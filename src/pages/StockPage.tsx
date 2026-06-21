import { useState, useMemo } from "react"
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  AlertTriangle,
  Download,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/* -------------------------------------------------------
 * Design tokens (consistent with Dashboard & Products)
 * bg:       #F8F9FC
 * surface:  #FFFFFF
 * border:   #E8ECF2
 * text-1:   #111827
 * text-2:   #6B7280
 * text-3:   #9CA3AF
 * accent:   #4F6EF7  (indigo  — stock out)
 * positive: #16A34A  (green   — stock in)
 * danger:   #DC2626  (red     — alerts)
 * amber:    #D97706  (warning — low stock)
 * ----------------------------------------------------- */

type MovementType = "in" | "out"
type DateRange    = "today" | "week" | "month" | "all"

const IN_REASONS  = ["Purchase", "Return", "Adjustment", "Transfer In"]
const OUT_REASONS = ["Sale", "Damaged", "Adjustment", "Transfer Out", "Consumed"]
const PRODUCTS    = [
  { name: "HDMI Cable 2m",          sku: "ELC-0114", category: "Electronics",     stock: 3  },
  { name: "Wireless Mouse",          sku: "ELC-0098", category: "Electronics",     stock: 5  },
  { name: "USB-C Hub 7-in-1",        sku: "ELC-0201", category: "Electronics",     stock: 22 },
  { name: "A4 Paper Ream",           sku: "OFC-0042", category: "Office Supplies", stock: 12 },
  { name: "Ballpoint Pens (Box/12)", sku: "OFC-0031", category: "Office Supplies", stock: 40 },
  { name: "Stapler Heavy Duty",      sku: "OFC-0055", category: "Office Supplies", stock: 0  },
  { name: "Cardboard Box (Medium)",  sku: "PKG-0021", category: "Packaging",       stock: 8  },
  { name: "Bubble Wrap Roll 50m",    sku: "PKG-0034", category: "Packaging",       stock: 18 },
  { name: "Cordless Drill Battery",  sku: "TLS-0007", category: "Tools",           stock: 2  },
  { name: "Measuring Tape 5m",       sku: "TLS-0041", category: "Tools",           stock: 20 },
]
const SUPPLIERS = ["TechDistrib", "OfficePro", "PackMaster", "ToolZone"]
const CATEGORIES = ["Electronics", "Office Supplies", "Packaging", "Tools"]

interface Movement {
  id:         number
  date:       string        // ISO string
  productName:string
  productSku: string
  type:       MovementType
  quantity:   number
  reason:     string
  supplier:   string
  unitCost:   number
  notes:      string
  runningBalance: number
}

const NOW = new Date()
const daysAgo = (n: number) => {
  const d = new Date(NOW); d.setDate(d.getDate() - n)
  return d.toISOString()
}

const INITIAL_MOVEMENTS: Movement[] = [
  { id:1,  date: daysAgo(0),  productName:"HDMI Cable 2m",          productSku:"ELC-0114", type:"out", quantity:12, reason:"Sale",        supplier:"—",          unitCost:850,  notes:"",                      runningBalance:3  },
  { id:2,  date: daysAgo(0),  productName:"A4 Paper Ream",           productSku:"OFC-0042", type:"in",  quantity:50, reason:"Purchase",    supplier:"OfficePro",  unitCost:650,  notes:"Monthly restock",       runningBalance:62 },
  { id:3,  date: daysAgo(1),  productName:"Wireless Mouse",          productSku:"ELC-0098", type:"out", quantity:8,  reason:"Sale",        supplier:"—",          unitCost:2400, notes:"",                      runningBalance:5  },
  { id:4,  date: daysAgo(1),  productName:"Cardboard Box (Medium)",  productSku:"PKG-0021", type:"out", quantity:30, reason:"Consumed",    supplier:"—",          unitCost:120,  notes:"Used for order packing",runningBalance:8  },
  { id:5,  date: daysAgo(2),  productName:"Cordless Drill Battery",  productSku:"TLS-0007", type:"in",  quantity:20, reason:"Purchase",    supplier:"ToolZone",   unitCost:4800, notes:"",                      runningBalance:22 },
  { id:6,  date: daysAgo(2),  productName:"Bubble Wrap Roll 50m",    productSku:"PKG-0034", type:"in",  quantity:10, reason:"Purchase",    supplier:"PackMaster", unitCost:950,  notes:"",                      runningBalance:28 },
  { id:7,  date: daysAgo(3),  productName:"Stapler Heavy Duty",      productSku:"OFC-0055", type:"out", quantity:3,  reason:"Sale",        supplier:"—",          unitCost:1100, notes:"",                      runningBalance:0  },
  { id:8,  date: daysAgo(3),  productName:"USB-C Hub 7-in-1",        productSku:"ELC-0201", type:"in",  quantity:15, reason:"Purchase",    supplier:"TechDistrib",unitCost:3200, notes:"New stock",             runningBalance:22 },
  { id:9,  date: daysAgo(4),  productName:"Ballpoint Pens (Box/12)", productSku:"OFC-0031", type:"in",  quantity:20, reason:"Purchase",    supplier:"OfficePro",  unitCost:280,  notes:"",                      runningBalance:40 },
  { id:10, date: daysAgo(4),  productName:"Measuring Tape 5m",       productSku:"TLS-0041", type:"out", quantity:5,  reason:"Sale",        supplier:"—",          unitCost:580,  notes:"",                      runningBalance:20 },
  { id:11, date: daysAgo(5),  productName:"HDMI Cable 2m",           productSku:"ELC-0114", type:"in",  quantity:10, reason:"Purchase",    supplier:"TechDistrib",unitCost:850,  notes:"Emergency restock",     runningBalance:15 },
  { id:12, date: daysAgo(6),  productName:"Wireless Mouse",          productSku:"ELC-0098", type:"in",  quantity:20, reason:"Purchase",    supplier:"TechDistrib",unitCost:2400, notes:"",                      runningBalance:13 },
  { id:13, date: daysAgo(8),  productName:"Cardboard Box (Medium)",  productSku:"PKG-0021", type:"in",  quantity:40, reason:"Purchase",    supplier:"PackMaster", unitCost:120,  notes:"",                      runningBalance:38 },
  { id:14, date: daysAgo(10), productName:"A4 Paper Ream",           productSku:"OFC-0042", type:"out", quantity:15, reason:"Sale",        supplier:"—",          unitCost:650,  notes:"",                      runningBalance:12 },
  { id:15, date: daysAgo(12), productName:"Cordless Drill Battery",  productSku:"TLS-0007", type:"out", quantity:8,  reason:"Damaged",     supplier:"—",          unitCost:4800, notes:"Faulty batch returned",  runningBalance:2  },
]

const LOW_STOCK_PRODUCTS = PRODUCTS.filter((p) => p.stock <= 8)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
}
const formatTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })
}
const isInRange = (iso: string, range: DateRange) => {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  if (range === "today") return diff < 1
  if (range === "week")  return diff < 7
  if (range === "month") return diff < 30
  return true
}

const exportCSV = (rows: Movement[]) => {
  const header = "Date,Product,SKU,Type,Quantity,Reason,Supplier,Unit Cost (DA),Notes"
  const lines  = rows.map((r) =>
    [formatDate(r.date), r.productName, r.productSku, r.type === "in" ? "Stock In" : "Stock Out",
     r.quantity, r.reason, r.supplier, r.unitCost, `"${r.notes}"`].join(",")
  )
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a"); a.href = url; a.download = "stock-movements.csv"; a.click()
  URL.revokeObjectURL(url)
}

const EMPTY_FORM = {
  productSku: "", type: "in" as MovementType,
  quantity: 1, reason: "", supplier: "", unitCost: 0, notes: "",
}

export default function StockPage() {
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS)
  const [search,    setSearch]    = useState("")
  const [typeFilter,    setTypeFilter]    = useState<"all" | MovementType>("all")
  const [dateRange,     setDateRange]     = useState<DateRange>("all")
  const [catFilter,     setCatFilter]     = useState("all")
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerType,    setDrawerType]    = useState<MovementType>("in")
  const [form,          setForm]          = useState({ ...EMPTY_FORM })
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [undoQueue,     setUndoQueue]     = useState<{ id: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; id: number } | null>(null)

  /* ── Derived stats ──────────────────────────────── */
  const weekMovements = movements.filter((m) => isInRange(m.date, "week"))
  const totalWeek     = weekMovements.length
  const unitsIn       = weekMovements.filter((m) => m.type === "in").reduce((s, m) => s + m.quantity, 0)
  const unitsOut      = weekMovements.filter((m) => m.type === "out").reduce((s, m) => s + m.quantity, 0)
  const netChange     = unitsIn - unitsOut

  /* ── Filtered rows ──────────────────────────────── */
  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const q = search.toLowerCase()
      if (q && !m.productName.toLowerCase().includes(q) && !m.productSku.toLowerCase().includes(q)) return false
      if (typeFilter !== "all" && m.type !== typeFilter) return false
      if (!isInRange(m.date, dateRange)) return false
      if (catFilter !== "all") {
        const p = PRODUCTS.find((p) => p.sku === m.productSku)
        if (!p || p.category !== catFilter) return false
      }
      return true
    })
  }, [movements, search, typeFilter, dateRange, catFilter])

  const filtersActive = search || typeFilter !== "all" || dateRange !== "all" || catFilter !== "all"
  const clearFilters  = () => { setSearch(""); setTypeFilter("all"); setDateRange("all"); setCatFilter("all") }

  /* ── Drawer helpers ─────────────────────────────── */
  const openDrawer = (type: MovementType) => {
    setDrawerType(type)
    setForm({ ...EMPTY_FORM, type })
    setDrawerOpen(true)
  }

  const showToast = (msg: string, id: number) => {
    setToast({ msg, id })
    setTimeout(() => setToast(null), 5000)
  }

  const handleRecord = () => {
    if (!form.productSku || !form.reason || form.quantity < 1) return
    const product   = PRODUCTS.find((p) => p.sku === form.productSku)!
    const newId     = Math.max(0, ...movements.map((m) => m.id)) + 1
    const newMovement: Movement = {
      id:           newId,
      date:         new Date().toISOString(),
      productName:  product.name,
      productSku:   product.sku,
      type:         drawerType,
      quantity:     form.quantity,
      reason:       form.reason,
      supplier:     drawerType === "in" ? form.supplier : "—",
      unitCost:     form.unitCost,
      notes:        form.notes,
      runningBalance: drawerType === "in"
        ? product.stock + form.quantity
        : Math.max(0, product.stock - form.quantity),
    }
    setMovements((prev) => [newMovement, ...prev])
    setDrawerOpen(false)

    /* undo window */
    const timer = setTimeout(() => {
      setUndoQueue(null)
      setToast(null)
    }, 5000)
    if (undoQueue) clearTimeout(undoQueue.timer)
    setUndoQueue({ id: newId, timer })
    showToast(
      `${drawerType === "in" ? "Stock In" : "Stock Out"} recorded for ${product.name}`,
      newId,
    )
  }

  const handleUndo = () => {
    if (!undoQueue) return
    clearTimeout(undoQueue.timer)
    setMovements((prev) => prev.filter((m) => m.id !== undoQueue.id))
    setUndoQueue(null)
    setToast(null)
  }

  const reasons = drawerType === "in" ? IN_REASONS : OUT_REASONS
  const selectedProduct = PRODUCTS.find((p) => p.sku === form.productSku)

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* ── Low stock banner ────────────────────────── */}
      {!bannerDismissed && LOW_STOCK_PRODUCTS.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#D97706]" />
            <p className="text-sm text-[#92400E]">
              <span className="font-semibold">{LOW_STOCK_PRODUCTS.length} products</span> are below
              their reorder threshold —{" "}
              {LOW_STOCK_PRODUCTS.slice(0, 2).map((p) => (
                <span key={p.sku} className="font-medium">{p.name}{" "}</span>
              ))}
              {LOW_STOCK_PRODUCTS.length > 2 && (
                <span>and {LOW_STOCK_PRODUCTS.length - 2} more</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="flex-shrink-0 rounded-lg p-1 hover:bg-[#FDE68A]/50 transition-colors"
          >
            <X className="h-4 w-4 text-[#D97706]" />
          </button>
        </div>
      )}

      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Stock Movements</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Track every stock in and out across your inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => exportCSV(filtered)}
            variant="outline"
            className="flex items-center gap-2 border-[#E8ECF2] bg-white text-sm text-[#6B7280] hover:bg-[#F8F9FC]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => openDrawer("in")}
            className="flex items-center gap-2 bg-[#16A34A] text-white hover:bg-[#15803D] text-sm"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Stock In
          </Button>
          <Button
            onClick={() => openDrawer("out")}
            className="flex items-center gap-2 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8] text-sm"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Stock Out
          </Button>
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label:"Movements this week", value: totalWeek,                    icon: Activity,     color:"#4F6EF7", bg:"rgba(79,110,247,0.08)"  },
          { label:"Units received",       value: `+${unitsIn}`,               icon: TrendingDown, color:"#16A34A", bg:"rgba(22,163,74,0.08)"   },
          { label:"Units dispatched",     value: `-${unitsOut}`,              icon: TrendingUp,   color:"#DC2626", bg:"rgba(220,38,38,0.08)"   },
          { label:"Net change",           value: (netChange >= 0 ? "+" : "") + netChange, icon: PackageCheck, color: netChange >= 0 ? "#16A34A" : "#DC2626", bg: netChange >= 0 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#E8ECF2] bg-white px-4 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">{label}</p>
              <p className="text-lg font-semibold text-[#111827]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product or SKU…"
            className="pl-9 h-9 rounded-lg border-[#E8ECF2] !bg-white !text-[#111827] text-sm
                       placeholder:text-[#9CA3AF] focus-visible:ring-2
                       focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | MovementType)}>
          <SelectTrigger className="h-9 w-36 rounded-lg border-[#E8ECF2] bg-white text-sm !text-[#111827]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="h-9 w-36 rounded-lg border-[#E8ECF2] bg-white text-sm !text-[#111827]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm !text-[#111827]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#DC2626] transition-colors"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Movements table ─────────────────────────── */}
      <div className="rounded-xl border border-[#E8ECF2] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E8ECF2] hover:bg-transparent bg-[#F8F9FC]">
              <TableHead className="text-xs font-medium text-[#6B7280]">Date & Time</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Product</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Type</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Quantity</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Reason</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Supplier</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Unit Cost</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Balance After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
                      <Activity className="h-6 w-6 text-[#9CA3AF]" />
                    </div>
                    <p className="text-sm font-medium text-[#111827]">No movements found</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {filtersActive ? "Try adjusting your filters" : "Record your first stock movement"}
                    </p>
                    {filtersActive && (
                      <button
                        onClick={clearFilters}
                        className="mt-1 text-xs font-medium text-[#4F6EF7] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} className="border-[#E8ECF2] hover:bg-[#F8F9FC] transition-colors">
                  {/* Date */}
                  <TableCell>
                    <p className="text-sm text-[#111827]">{formatDate(m.date)}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatTime(m.date)}</p>
                  </TableCell>

                  {/* Product */}
                  <TableCell>
                    <p className="text-sm font-medium text-[#111827]">{m.productName}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">{m.productSku}</p>
                  </TableCell>

                  {/* Type badge */}
                  <TableCell>
                    {m.type === "in" ? (
                      <Badge className="border-0 rounded-md px-2 py-0.5 text-xs font-medium bg-[rgba(22,163,74,0.08)] text-[#16A34A]">
                        <ArrowDownToLine className="mr-1 h-3 w-3" /> Stock In
                      </Badge>
                    ) : (
                      <Badge className="border-0 rounded-md px-2 py-0.5 text-xs font-medium bg-[rgba(79,110,247,0.08)] text-[#4F6EF7]">
                        <ArrowUpFromLine className="mr-1 h-3 w-3" /> Stock Out
                      </Badge>
                    )}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="text-right">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: m.type === "in" ? "#16A34A" : "#DC2626" }}
                    >
                      {m.type === "in" ? "+" : "−"}{m.quantity}
                    </span>
                  </TableCell>

                  {/* Reason */}
                  <TableCell>
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                      {m.reason}
                    </span>
                  </TableCell>

                  {/* Supplier */}
                  <TableCell className="text-sm text-[#6B7280]">{m.supplier}</TableCell>

                  {/* Unit cost */}
                  <TableCell className="text-right text-sm text-[#111827]">
                    {m.unitCost > 0 ? `${m.unitCost.toLocaleString()} DA` : "—"}
                  </TableCell>

                  {/* Running balance */}
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-[#111827]">{m.runningBalance}</span>
                    <span className="ml-1 text-xs text-[#9CA3AF]">units</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="border-t border-[#E8ECF2] px-4 py-3">
            <p className="text-xs text-[#9CA3AF]">
              Showing{" "}
              <span className="font-medium text-[#6B7280]">{filtered.length}</span> of{" "}
              <span className="font-medium text-[#6B7280]">{movements.length}</span> movements
            </p>
          </div>
        )}
      </div>

      {/* ── Record drawer ───────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white border-[#E8ECF2] overflow-y-auto px-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-[#111827]">
              {drawerType === "in" ? (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(22,163,74,0.1)]">
                    <ArrowDownToLine className="h-4 w-4 text-[#16A34A]" />
                  </span>
                  Record Stock In
                </>
              ) : (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(79,110,247,0.1)]">
                    <ArrowUpFromLine className="h-4 w-4 text-[#4F6EF7]" />
                  </span>
                  Record Stock Out
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {/* Product */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Product <span className="text-[#DC2626]">*</span>
              </Label>
              <Select value={form.productSku} onValueChange={(v) => setForm({ ...form, productSku: v })}>
                <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p.sku} value={p.sku}>
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 font-mono text-xs text-[#9CA3AF]">{p.sku}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-[#6B7280]">
                  Current stock:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: selectedProduct.stock <= 8 ? "#DC2626" : "#111827" }}
                  >
                    {selectedProduct.stock} units
                  </span>
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Quantity <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
              {selectedProduct && form.quantity > 0 && (
                <p className="text-xs text-[#6B7280]">
                  Stock after this movement:{" "}
                  <span className="font-semibold text-[#111827]">
                    {drawerType === "in"
                      ? selectedProduct.stock + form.quantity
                      : Math.max(0, selectedProduct.stock - form.quantity)
                    } units
                  </span>
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Reason <span className="text-[#DC2626]">*</span>
              </Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                  <SelectValue placeholder="Select reason…" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier (Stock In only) */}
            {drawerType === "in" && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Supplier</Label>
                <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                  <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                    <SelectValue placeholder="Select supplier…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unit cost (Stock In only) */}
            {drawerType === "in" && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Unit Cost (DA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes…"
                rows={3}
                className="border-[#E8ECF2] !bg-white !text-[#111827] text-sm resize-none placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-[#E8ECF2] text-[#6B7280] hover:bg-[#F8F9FC]"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-white"
                style={{
                  backgroundColor: drawerType === "in" ? "#16A34A" : "#4F6EF7",
                }}
                onClick={handleRecord}
                disabled={!form.productSku || !form.reason || form.quantity < 1}
              >
                {drawerType === "in" ? "Record Stock In" : "Record Stock Out"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Undo toast ──────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-4 py-3 shadow-lg">
            <p className="text-sm text-[#111827]">{toast.msg}</p>
            <button
              onClick={handleUndo}
              className="text-xs font-semibold text-[#4F6EF7] hover:underline"
            >
              Undo
            </button>
          </div>
        </div>
      )}

    </div>
  )
}