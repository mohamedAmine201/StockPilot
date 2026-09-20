import { useState, useMemo, useEffect } from "react"
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
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
import { useApi } from "@/lib/api"

/* -------------------------------------------------------
 * Types
 * ----------------------------------------------------- */

type MovementType = "in" | "out" | "adjustment"
type DateRange    = "today" | "week" | "month" | "all"

interface Product {
  id:           number
  name:         string
  sku:          string
  category:     string
  stock:        number
  unit:         string
  threshold:    number
  stock_status: "in" | "low" | "out"
}

interface Movement {
  id:               number
  product:          number
  product_name:     string
  product_sku:      string
  product_unit:     string
  movement_type:    MovementType
  quantity:         number
  unit_cost:        number | null
  reason:           string
  reference:        string
  performed_by_name: string
  created_at:       string
}

interface MovementForm {
  product:       number | ""
  movement_type: MovementType
  quantity:      number
  unit_cost:     number
  reason:        string
  reference:     string
  notes:         string
}

/* -------------------------------------------------------
 * Constants
 * ----------------------------------------------------- */

const IN_REASONS  = ["Purchase", "Return", "Adjustment", "Transfer In"]
const OUT_REASONS = ["Sale", "Damaged", "Adjustment", "Transfer Out", "Consumed"]
const CATEGORIES  = ["Electronics", "Office Supplies", "Packaging", "Tools"]

const EMPTY_FORM: MovementForm = {
  product: "", movement_type: "in",
  quantity: 1, unit_cost: 0,
  reason: "", reference: "", notes: "",
}

/* -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  })

const isInRange = (iso: string, range: DateRange) => {
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  if (range === "today") return diff < 1
  if (range === "week")  return diff < 7
  if (range === "month") return diff < 30
  return true
}

const exportCSV = (rows: Movement[]) => {
  const header = "Date,Product,SKU,Type,Quantity,Reason,Reference,Unit Cost (DA),Performed By"
  const lines  = rows.map((r) =>
    [
      formatDate(r.created_at),
      r.product_name,
      r.product_sku,
      r.movement_type === "in" ? "Stock In" : r.movement_type === "out" ? "Stock Out" : "Adjustment",
      r.quantity,
      r.reason,
      r.reference || "—",
      r.unit_cost ?? "—",
      r.performed_by_name,
    ].join(",")
  )
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = "stock-movements.csv"; a.click()
  URL.revokeObjectURL(url)
}

/* -------------------------------------------------------
 * Component
 * ----------------------------------------------------- */

export default function StockPage() {
  const { request } = useApi()

  // ── Data state ──────────────────────────────────────
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState("")

  // ── Filter state ────────────────────────────────────
  const [search,      setSearch]      = useState("")
  const [typeFilter,  setTypeFilter]  = useState<"all" | MovementType>("all")
  const [dateRange,   setDateRange]   = useState<DateRange>("all")
  const [catFilter,   setCatFilter]   = useState("all")

  // ── Drawer state ────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [drawerType,  setDrawerType]  = useState<MovementType>("in")
  const [form,        setForm]        = useState<MovementForm>({ ...EMPTY_FORM })
  const [formError,   setFormError]   = useState("")
  const [saving,      setSaving]      = useState(false)

  // ── Banner state ────────────────────────────────────
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // ── Initial fetch ───────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [movementsData, productsData] = await Promise.all([
          request<Movement[]>("/stock/"),
          request<Product[]>("/products/"),
        ])
        setMovements(movementsData)
        setProducts(productsData)
      } catch {
        setFetchError("Failed to load stock data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Derived data ────────────────────────────────────
  const lowStockProducts = products.filter(
    (p) => p.stock_status === "low" || p.stock_status === "out"
  )

  // product lookup map for the drawer
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  const selectedProduct = form.product ? productMap.get(Number(form.product)) : null

  // category lookup from product_sku → category
  const skuCategoryMap = useMemo(
    () => new Map(products.map((p) => [p.sku, p.category])),
    [products]
  )

  // ── Summary stats (last 7 days) ─────────────────────
  const weekMovements = movements.filter((m) => isInRange(m.created_at, "week"))
  const totalWeek     = weekMovements.length
  const unitsIn       = weekMovements
    .filter((m) => m.movement_type === "in")
    .reduce((s, m) => s + m.quantity, 0)
  const unitsOut      = weekMovements
    .filter((m) => m.movement_type === "out")
    .reduce((s, m) => s + m.quantity, 0)
  const netChange     = unitsIn - unitsOut

  // ── Filtered rows ───────────────────────────────────
  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const q = search.toLowerCase()
      if (q && !m.product_name.toLowerCase().includes(q) && !m.product_sku.toLowerCase().includes(q))
        return false
      if (typeFilter !== "all" && m.movement_type !== typeFilter)
        return false
      if (!isInRange(m.created_at, dateRange))
        return false
      if (catFilter !== "all" && skuCategoryMap.get(m.product_sku) !== catFilter)
        return false
      return true
    })
  }, [movements, search, typeFilter, dateRange, catFilter, skuCategoryMap])

  const filtersActive =
    search || typeFilter !== "all" || dateRange !== "all" || catFilter !== "all"

  const clearFilters = () => {
    setSearch(""); setTypeFilter("all"); setDateRange("all"); setCatFilter("all")
  }

  // ── Drawer helpers ───────────────────────────────────
  const openDrawer = (type: MovementType) => {
    setDrawerType(type)
    setForm({ ...EMPTY_FORM, movement_type: type })
    setFormError("")
    setDrawerOpen(true)
  }

  // ── Record movement ──────────────────────────────────
  const handleRecord = async () => {
    if (!form.product || !form.reason || form.quantity < 1) {
      setFormError("Product, reason and quantity are required.")
      return
    }

    setSaving(true)
    setFormError("")

    try {
      const payload = {
        product:       form.product,
        movement_type: drawerType,
        quantity:      form.quantity,
        unit_cost:     drawerType === "in" ? form.unit_cost || null : null,
        reason:        form.reason,
        reference:     form.reference || "",
      }

      const created = await request<Movement>("/stock/", "POST", payload)

      // Add new movement to the top of the list
      setMovements((prev) => [created, ...prev])

      // Update the product's stock in local state so the
      // drawer's "stock after" preview stays accurate
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== form.product) return p
          const newStock =
            drawerType === "in"
              ? p.stock + form.quantity
              : Math.max(0, p.stock - form.quantity)
          return {
            ...p,
            stock: newStock,
            stock_status:
              newStock === 0 ? "out"
              : newStock <= p.threshold ? "low"
              : "in",
          }
        })
      )

      setDrawerOpen(false)

      toast.success(
        `${drawerType === "in" ? "Stock In" : "Stock Out"} recorded`,
        {
          description: `${form.quantity} × ${selectedProduct?.name}`,
        }
      )
    } catch (err: any) {
      const msg = err?.data
        ? Object.values(err.data).flat().join(" ")
        : "Something went wrong. Please try again."
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const reasons = drawerType === "in" ? IN_REASONS : OUT_REASONS

  // ── Loading / error ──────────────────────────────────
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

      {/* ── Low stock banner ────────────────────────── */}
      {!bannerDismissed && lowStockProducts.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#D97706]" />
            <p className="text-sm text-[#92400E]">
              <span className="font-semibold">{lowStockProducts.length} products</span> are below
              their reorder threshold —{" "}
              {lowStockProducts.slice(0, 2).map((p) => (
                <span key={p.id} className="font-medium">{p.name} </span>
              ))}
              {lowStockProducts.length > 2 && (
                <span>and {lowStockProducts.length - 2} more</span>
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
          { label: "Movements this week", value: totalWeek,                              icon: Activity,     color: "#4F6EF7", bg: "rgba(79,110,247,0.08)"  },
          { label: "Units received",       value: `+${unitsIn}`,                         icon: TrendingDown, color: "#16A34A", bg: "rgba(22,163,74,0.08)"   },
          { label: "Units dispatched",     value: `-${unitsOut}`,                        icon: TrendingUp,   color: "#DC2626", bg: "rgba(220,38,38,0.08)"   },
          { label: "Net change",           value: (netChange >= 0 ? "+" : "") + netChange, icon: PackageCheck, color: netChange >= 0 ? "#16A34A" : "#DC2626", bg: netChange >= 0 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)" },
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
            <SelectItem value="adjustment">Adjustment</SelectItem>
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
              <TableHead className="text-xs font-medium text-[#6B7280]">Reference</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Unit Cost</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Recorded by</TableHead>
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
                      {filtersActive
                        ? "Try adjusting your filters"
                        : "Record your first stock movement"}
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
                    <p className="text-sm text-[#111827]">{formatDate(m.created_at)}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatTime(m.created_at)}</p>
                  </TableCell>

                  {/* Product */}
                  <TableCell>
                    <p className="text-sm font-medium text-[#111827]">{m.product_name}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">{m.product_sku}</p>
                  </TableCell>

                  {/* Type badge */}
                  <TableCell>
                    {m.movement_type === "in" ? (
                      <Badge className="border-0 rounded-md px-2 py-0.5 text-xs font-medium bg-[rgba(22,163,74,0.08)] text-[#16A34A]">
                        <ArrowDownToLine className="mr-1 h-3 w-3" /> Stock In
                      </Badge>
                    ) : m.movement_type === "out" ? (
                      <Badge className="border-0 rounded-md px-2 py-0.5 text-xs font-medium bg-[rgba(79,110,247,0.08)] text-[#4F6EF7]">
                        <ArrowUpFromLine className="mr-1 h-3 w-3" /> Stock Out
                      </Badge>
                    ) : (
                      <Badge className="border-0 rounded-md px-2 py-0.5 text-xs font-medium bg-[rgba(217,119,6,0.08)] text-[#D97706]">
                        Adjustment
                      </Badge>
                    )}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="text-right">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: m.movement_type === "in"
                          ? "#16A34A"
                          : m.movement_type === "out"
                          ? "#DC2626"
                          : "#D97706",
                      }}
                    >
                      {m.movement_type === "in" ? "+" : m.movement_type === "out" ? "−" : "±"}
                      {m.quantity}
                    </span>
                  </TableCell>

                  {/* Reason */}
                  <TableCell>
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                      {m.reason || "—"}
                    </span>
                  </TableCell>

                  {/* Reference */}
                  <TableCell className="text-sm text-[#6B7280]">
                    {m.reference || "—"}
                  </TableCell>

                  {/* Unit cost */}
                  <TableCell className="text-right text-sm text-[#111827]">
                    {m.unit_cost ? `${Number(m.unit_cost).toLocaleString()} DA` : "—"}
                  </TableCell>

                  {/* Performed by */}
                  <TableCell className="text-sm text-[#6B7280]">
                    {m.performed_by_name || "—"}
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

            {formError && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                {formError}
              </p>
            )}

            {/* Product */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Product <span className="text-[#DC2626]">*</span>
              </Label>
              <Select
                value={form.product ? String(form.product) : ""}
                onValueChange={(v) => setForm({ ...form, product: Number(v) })}
              >
                <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
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
                    style={{
                      color: selectedProduct.stock_status === "out"
                        ? "#DC2626"
                        : selectedProduct.stock_status === "low"
                        ? "#D97706"
                        : "#111827",
                    }}
                  >
                    {selectedProduct.stock} {selectedProduct.unit}
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
                    } {selectedProduct.unit}
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

            {/* Reference (replaces Supplier — more accurate to the model) */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Reference{" "}
                <span className="font-normal text-[#9CA3AF]">
                  {drawerType === "in" ? "(PO / invoice number)" : "(optional)"}
                </span>
              </Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder={drawerType === "in" ? "e.g. PO-2024-001" : "optional"}
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* Unit cost (Stock In only) */}
            {drawerType === "in" && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Unit Cost (DA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
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
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: drawerType === "in" ? "#16A34A" : "#4F6EF7" }}
                onClick={handleRecord}
                disabled={saving || !form.product || !form.reason || form.quantity < 1}
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : drawerType === "in" ? "Record Stock In" : "Record Stock Out"
                }
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}