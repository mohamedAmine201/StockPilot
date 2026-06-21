import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Package,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/* -------------------------------------------------------
 * Design tokens (same as Dashboard)
 * bg:       #F8F9FC
 * surface:  #FFFFFF
 * border:   #E8ECF2
 * text-1:   #111827
 * text-2:   #6B7280
 * text-3:   #9CA3AF
 * accent:   #4F6EF7
 * positive: #16A34A
 * danger:   #DC2626
 * amber:    #D97706
 * ----------------------------------------------------- */

type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

interface Product {
  id: number
  name: string
  sku: string
  category: string
  supplier: string
  unit: string
  price: number
  stock: number
  threshold: number
  description: string
}

const getStatus = (stock: number, threshold: number): StockStatus => {
  if (stock === 0) return "out_of_stock"
  if (stock <= threshold) return "low_stock"
  return "in_stock"
}

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string }> = {
  in_stock:      { label: "In Stock",      color: "#16A34A", bg: "rgba(22,163,74,0.08)"   },
  low_stock:     { label: "Low Stock",     color: "#D97706", bg: "rgba(217,119,6,0.08)"   },
  out_of_stock:  { label: "Out of Stock",  color: "#DC2626", bg: "rgba(220,38,38,0.08)"   },
}

const CATEGORIES = ["Electronics", "Office Supplies", "Packaging", "Tools"]
const SUPPLIERS  = ["TechDistrib", "OfficePro", "PackMaster", "ToolZone"]
const UNITS      = ["pcs", "kg", "liters", "boxes", "rolls"]

const INITIAL_PRODUCTS: Product[] = [
  { id: 1,  name: "HDMI Cable 2m",          sku: "ELC-0114", category: "Electronics",    supplier: "TechDistrib", unit: "pcs",   price: 850,   stock: 3,   threshold: 15, description: "High-speed HDMI 2.0 cable, 2 meters." },
  { id: 2,  name: "Wireless Mouse",          sku: "ELC-0098", category: "Electronics",    supplier: "TechDistrib", unit: "pcs",   price: 2400,  stock: 5,   threshold: 10, description: "Ergonomic wireless mouse, 2.4GHz." },
  { id: 3,  name: "USB-C Hub 7-in-1",        sku: "ELC-0201", category: "Electronics",    supplier: "TechDistrib", unit: "pcs",   price: 3200,  stock: 22,  threshold: 10, description: "7-port USB-C hub with HDMI and SD card reader." },
  { id: 4,  name: "A4 Paper Ream",           sku: "OFC-0042", category: "Office Supplies", supplier: "OfficePro",  unit: "reams", price: 650,   stock: 12,  threshold: 25, description: "500 sheets, 80gsm white A4 paper." },
  { id: 5,  name: "Ballpoint Pens (Box/12)", sku: "OFC-0031", category: "Office Supplies", supplier: "OfficePro",  unit: "boxes", price: 280,   stock: 40,  threshold: 20, description: "Blue ballpoint pens, box of 12." },
  { id: 6,  name: "Stapler Heavy Duty",      sku: "OFC-0055", category: "Office Supplies", supplier: "OfficePro",  unit: "pcs",   price: 1100,  stock: 0,   threshold: 5,  description: "Heavy duty stapler, up to 50 sheets." },
  { id: 7,  name: "Cardboard Box (Medium)",  sku: "PKG-0021", category: "Packaging",       supplier: "PackMaster", unit: "pcs",   price: 120,   stock: 8,   threshold: 20, description: "Medium corrugated cardboard box 40x30x20cm." },
  { id: 8,  name: "Bubble Wrap Roll 50m",    sku: "PKG-0034", category: "Packaging",       supplier: "PackMaster", unit: "rolls", price: 950,   stock: 18,  threshold: 10, description: "50m bubble wrap roll, 1.2m wide." },
  { id: 9,  name: "Packing Tape (x6)",       sku: "PKG-0019", category: "Packaging",       supplier: "PackMaster", unit: "pcs",   price: 340,   stock: 55,  threshold: 20, description: "Clear packing tape, pack of 6 rolls." },
  { id: 10, name: "Cordless Drill Battery",  sku: "TLS-0007", category: "Tools",           supplier: "ToolZone",   unit: "pcs",   price: 4800,  stock: 2,   threshold: 8,  description: "18V Li-Ion replacement battery for cordless drills." },
  { id: 11, name: "Stanley Knife Blades",    sku: "TLS-0022", category: "Tools",           supplier: "ToolZone",   unit: "boxes", price: 220,   stock: 34,  threshold: 15, description: "Snap-off knife blades, pack of 10." },
  { id: 12, name: "Measuring Tape 5m",       sku: "TLS-0041", category: "Tools",           supplier: "ToolZone",   unit: "pcs",   price: 580,   stock: 20,  threshold: 10, description: "5-meter steel measuring tape with lock." },
]

const EMPTY_FORM: Omit<Product, "id"> = {
  name: "", sku: "", category: "", supplier: "",
  unit: "pcs", price: 0, stock: 0, threshold: 10, description: "",
}

type SortKey = keyof Pick<Product, "name" | "category" | "stock" | "price">
type SortDir = "asc" | "desc" | null

export default function ProductsPage() {
  const [products, setProducts]         = useState<Product[]>(INITIAL_PRODUCTS)
  const [search, setSearch]             = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus]     = useState("all")
  const [filterSupplier, setFilterSupplier] = useState("all")
  const [sortKey, setSortKey]           = useState<SortKey | null>(null)
  const [sortDir, setSortDir]           = useState<SortDir>(null)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm]                 = useState<Omit<Product, "id">>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  /* Filtering + sorting */
  const filtered = useMemo(() => {
    let list = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    if (filterCategory !== "all") list = list.filter((p) => p.category === filterCategory)
    if (filterSupplier  !== "all") list = list.filter((p) => p.supplier  === filterSupplier)
    if (filterStatus    !== "all") {
      list = list.filter((p) => getStatus(p.stock, p.threshold) === filterStatus)
    }
    if (sortKey && sortDir) {
      list.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey]
        if (typeof va === "number" && typeof vb === "number")
          return sortDir === "asc" ? va - vb : vb - va
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va))
      })
    }
    return list
  }, [products, search, filterCategory, filterStatus, filterSupplier, sortKey, sortDir])

  const filtersActive =
    search || filterCategory !== "all" || filterStatus !== "all" || filterSupplier !== "all"

  const clearFilters = () => {
    setSearch(""); setFilterCategory("all"); setFilterStatus("all"); setFilterSupplier("all")
  }

  /* Sorting */
  const handleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return }
    if (sortDir === "asc")  { setSortDir("desc"); return }
    setSortKey(null); setSortDir(null)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 text-[#9CA3AF]" />
    return sortDir === "asc"
      ? <ChevronUp   className="ml-1 h-3 w-3 text-[#4F6EF7]" />
      : <ChevronDown className="ml-1 h-3 w-3 text-[#4F6EF7]" />
  }

  /* Drawer helpers */
  const openAdd = () => {
    setEditingProduct(null)
    setForm(EMPTY_FORM)
    setDrawerOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    const { id, ...rest } = p
    setForm(rest)
    setDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.sku || !form.category) return
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...form, id: editingProduct.id } : p))
      )
    } else {
      const newId = Math.max(0, ...products.map((p) => p.id)) + 1
      setProducts((prev) => [...prev, { ...form, id: newId }])
    }
    setDrawerOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  /* Stock bar */
  const StockBar = ({ stock, threshold }: { stock: number; threshold: number }) => {
    const pct    = threshold === 0 ? 100 : Math.min((stock / (threshold * 2)) * 100, 100)
    const status = getStatus(stock, threshold)
    const color  = STATUS_CONFIG[status].color
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full bg-[#F3F4F6] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-sm font-medium text-[#111827]">{stock}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Products</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {products.length} products across {CATEGORIES.length} categories
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-9 h-9 rounded-lg border-[#E8ECF2] !bg-white text-sm
                       text-[#111827] placeholder:text-[#9CA3AF]
                       focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm text-[#111827]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm text-[#111827]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm text-[#111827]">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {SUPPLIERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      {/* ── Table ───────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8ECF2] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E8ECF2] hover:bg-transparent bg-[#F8F9FC]">
              <TableHead
                className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <span className="flex items-center">Product <SortIcon col="name" /></span>
              </TableHead>
              <TableHead
                className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("category")}
              >
                <span className="flex items-center">Category <SortIcon col="category" /></span>
              </TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Supplier</TableHead>
              <TableHead
                className="text-xs font-medium text-[#6B7280] cursor-pointer select-none text-right"
                onClick={() => handleSort("price")}
              >
                <span className="flex items-center justify-end">Price <SortIcon col="price" /></span>
              </TableHead>
              <TableHead
                className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("stock")}
              >
                <span className="flex items-center">Stock <SortIcon col="stock" /></span>
              </TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
                      <Package className="h-6 w-6 text-[#9CA3AF]" />
                    </div>
                    <p className="text-sm font-medium text-[#111827]">No products found</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {filtersActive ? "Try adjusting your filters" : "Add your first product to get started"}
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
              filtered.map((p) => {
                const status = getStatus(p.stock, p.threshold)
                const { label, color, bg } = STATUS_CONFIG[status]
                return (
                  <TableRow key={p.id} className="border-[#E8ECF2] hover:bg-[#F8F9FC] transition-colors">
                    {/* Name + SKU */}
                    <TableCell>
                      <p className="text-sm font-medium text-[#111827]">{p.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">{p.sku}</p>
                    </TableCell>
                    {/* Category */}
                    <TableCell>
                      <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                        {p.category}
                      </span>
                    </TableCell>
                    {/* Supplier */}
                    <TableCell className="text-sm text-[#6B7280]">{p.supplier}</TableCell>
                    {/* Price */}
                    <TableCell className="text-right text-sm font-medium text-[#111827]">
                      {p.price.toLocaleString()} DA
                    </TableCell>
                    {/* Stock bar */}
                    <TableCell>
                      <StockBar stock={p.stock} threshold={p.threshold} />
                    </TableCell>
                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        className="rounded-md px-2 py-0.5 text-xs font-medium border-0"
                        style={{ backgroundColor: bg, color }}
                      >
                        {label}
                      </Badge>
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg
                                     hover:bg-[#EEF2FF] transition-colors"
                          aria-label="Edit product"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#4F6EF7]" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg
                                     hover:bg-[#FEF2F2] transition-colors"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="border-t border-[#E8ECF2] px-4 py-3">
            <p className="text-xs text-[#9CA3AF]">
              Showing <span className="font-medium text-[#6B7280]">{filtered.length}</span> of{" "}
              <span className="font-medium text-[#6B7280]">{products.length}</span> products
            </p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Drawer ───────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white border-[#E8ECF2] overflow-y-auto px-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold text-[#111827]">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Product Name <span className="text-[#DC2626]">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wireless Mouse"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* SKU */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">SKU <span className="text-[#DC2626]">*</span></Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. ELC-0098"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] font-mono text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* Category + Supplier */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Category <span className="text-[#DC2626]">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Supplier</Label>
                <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                  <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unit + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Unit Price (DA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
              </div>
            </div>

            {/* Stock + Threshold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Current Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Low Stock Threshold</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional product description…"
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
                className="flex-1 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
                onClick={handleSave}
                disabled={!form.name || !form.sku || !form.category}
              >
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete confirmation ─────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#E8ECF2] bg-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-[#111827]">
              Delete product?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-[#6B7280]">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-[#111827]">{deleteTarget?.name}</span>
                  {" "}
                  <span className="font-mono text-xs text-[#9CA3AF]">({deleteTarget?.sku})</span>
                </p>
                <p className="text-sm text-[#6B7280]">
                  This will remove it from your inventory. This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-white mt-4">
            <AlertDialogCancel className="border-[#E8ECF2] text-[#6B7280] hover:bg-[#F8F9FC]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="!bg-[#DC2626] !text-white hover:!bg-[#B91C1C]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}