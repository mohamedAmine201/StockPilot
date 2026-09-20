import { useState, useMemo, useEffect } from "react"
import {
  Search, Plus, Pencil, Trash2, X,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Package, Loader2, AlertCircle,
} from "lucide-react"
import { Input }     from "@/components/ui/input"
import { Button }    from "@/components/ui/button"
import { Badge }     from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/* ── Native fetch helper (no axios / useApi) ────────── */
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:8000/api"

function getCsrf(): string {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith("csrftoken="))
    ?.split("=")[1] ?? ""
}

async function request<T = any>(path: string, method = "GET", body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrf() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, data }
  return data as T
}

/* ── Types ──────────────────────────────────────────── */

interface Category {
  id:             number
  name:           string
  products_count: number
}

interface Supplier {
  id:   number
  name: string
}

interface Product {
  id:            number
  name:          string
  sku:           string
  category:      number | null
  category_name: string
  supplier:      number | null
  supplier_name: string
  unit:          string
  unit_price:    number
  stock:         number
  threshold:     number
  description:   string
  status:        StockStatus
}

interface ProductForm {
  name:        string
  sku:         string
  category:    number | ""
  supplier:    number | ""
  unit:        string
  unit_price:  number
  stock:       number
  threshold:   number
  description: string
}

/* ── Constants ──────────────────────────────────────── */
type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string }> = {
  in_stock:      { label: "In Stock",     color: "#16A34A", bg: "rgba(22,163,74,0.08)"  },
  low_stock:     { label: "Low Stock",    color: "#D97706", bg: "rgba(217,119,6,0.08)"  },
  out_of_stock:  { label: "Out of Stock", color: "#DC2626", bg: "rgba(220,38,38,0.08)"  },
}

const UNITS = ["pcs", "kg", "liters", "boxes", "rolls"]

const EMPTY_FORM: ProductForm = {
  name: "", sku: "", category: "", supplier: "",
  unit: "pcs", unit_price: 0, stock: 0, threshold: 10, description: "",
}

type SortKey = "name" | "category_name" | "stock" | "unit_price"
type SortDir = "asc" | "desc" | null

/* ── Component ──────────────────────────────────────── */
export default function ProductsPage() {

  /* ── Data ─────────────────────────────────────────── */
  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState("")

  /* ── Filters ──────────────────────────────────────── */
  const [search,          setSearch]          = useState("")
  const [filterCategory,  setFilterCategory]  = useState("all")
  const [filterStatus,    setFilterStatus]    = useState("all")
  const [filterSupplier,  setFilterSupplier]  = useState("all")
  const [sortKey,         setSortKey]         = useState<SortKey | null>(null)
  const [sortDir,         setSortDir]         = useState<SortDir>(null)

  /* ── Drawer ───────────────────────────────────────── */
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form,           setForm]           = useState<ProductForm>(EMPTY_FORM)
  const [formError,      setFormError]      = useState("")
  const [saving,         setSaving]         = useState(false)

  /* ── New category inline ──────────────────────────── */
  const [showNewCat,    setShowNewCat]    = useState(false)
  const [newCatName,    setNewCatName]    = useState("")
  const [creatingCat,   setCreatingCat]   = useState(false)
  const [newCatError,   setNewCatError]   = useState("")

  /* ── Delete ───────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  /* ── Initial fetch ────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats, supps] = await Promise.all([
          request<Product[]>("/products/"),
          request<Category[]>("/products/categories/"),
          request<Supplier[]>("/suppliers/minimal/"),
        ])
        setProducts(prods)
        setCategories(cats)
        setSuppliers(supps)
      } catch {
        setFetchError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Filtering + sorting ──────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    if (filterCategory !== "all")
      list = list.filter((p) => String(p.category) === filterCategory)
    if (filterSupplier !== "all")
      list = list.filter((p) => String(p.supplier) === filterSupplier)
    if (filterStatus !== "all")
      list = list.filter((p) => p.status === filterStatus)
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

  /* ── Sorting ──────────────────────────────────────── */
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

  /* ── Drawer helpers ───────────────────────────────── */
  const openAdd = () => {
    setEditingProduct(null); setForm(EMPTY_FORM)
    setFormError(""); setShowNewCat(false); setNewCatName(""); setNewCatError("")
    setDrawerOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name, sku: p.sku,
      category:  p.category  ?? "",
      supplier:  p.supplier  ?? "",
      unit: p.unit, unit_price: p.unit_price,
      stock: p.stock, threshold: p.threshold, description: p.description,
    })
    setFormError(""); setShowNewCat(false); setNewCatName(""); setNewCatError("")
    setDrawerOpen(true)
  }

  /* ── Create category inline ───────────────────────── */
  const handleCreateCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setNewCatError("Category already exists."); return
    }
    setCreatingCat(true); setNewCatError("")
    try {
      const created = await request<Category>("/products/categories/", "POST", { name })
      setCategories((prev) => [...prev, created])
      setForm((f) => ({ ...f, category: created.id }))
      setNewCatName(""); setShowNewCat(false)
    } catch (e: any) {
      setNewCatError(e?.data?.name?.[0] ?? "Failed to create category.")
    } finally { setCreatingCat(false) }
  }

  /* ── Save ─────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name || !form.sku || !form.category) {
      setFormError("Name, SKU and category are required."); return
    }
    setSaving(true); setFormError("")
    try {
      const payload = {
        name:        form.name,
        sku:         form.sku,
        category:    form.category,
        supplier:    form.supplier || null,
        unit:        form.unit,
        unit_price:  form.unit_price,
        stock:       form.stock,
        threshold:   form.threshold,
        description: form.description,
      }
      if (editingProduct) {
        const updated = await request<Product>(`/products/${editingProduct.id}/`, "PATCH", payload)
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
      } else {
        const created = await request<Product>("/products/", "POST", payload)
        setProducts((prev) => [created, ...prev])
      }
      setDrawerOpen(false)
    } catch (err: any) {
      setFormError(
        err?.data ? Object.values(err.data).flat().join(" ") : "Something went wrong."
      )
    } finally { setSaving(false) }
  }

  /* ── Delete ───────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await request(`/products/${deleteTarget.id}/`, "DELETE")
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch { setDeleteTarget(null) }
    finally { setDeleting(false) }
  }

  /* ── Stock bar ────────────────────────────────────── */
  const StockBar = ({ stock, threshold, status }: { stock: number; threshold: number; status: StockStatus }) => {
    const pct   = threshold === 0 ? 100 : Math.min((stock / (threshold * 2)) * 100, 100)
    const color = STATUS_CONFIG[status].color
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full bg-[#F3F4F6] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-sm font-medium text-[#111827]">{stock}</span>
      </div>
    )
  }

  /* ── Loading / error ──────────────────────────────── */
  if (loading) return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-[#F8F9FC]">
      <Loader2 className="h-6 w-6 animate-spin text-[#4F6EF7]" />
    </div>
  )

  if (fetchError) return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-[#F8F9FC] gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
        <AlertCircle className="h-6 w-6 text-[#DC2626]" />
      </div>
      <p className="text-sm text-[#DC2626]">{fetchError}</p>
      <button onClick={() => window.location.reload()}
        className="text-xs font-medium text-[#4F6EF7] hover:underline">
        Retry
      </button>
    </div>
  )

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Products</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {products.length} products across {categories.length} categories
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
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

        {/* Category filter — populated from API */}
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm text-[#111827]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
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

        {/* Supplier filter — populated from API */}
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="h-9 w-40 rounded-lg border-[#E8ECF2] bg-white text-sm text-[#111827]">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#DC2626] transition-colors">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E8ECF2] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E8ECF2] hover:bg-transparent bg-[#F8F9FC]">
              <TableHead className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("name")}>
                <span className="flex items-center">Product <SortIcon col="name" /></span>
              </TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("category_name")}>
                <span className="flex items-center">Category <SortIcon col="category_name" /></span>
              </TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Supplier</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] cursor-pointer select-none text-right"
                onClick={() => handleSort("unit_price")}>
                <span className="flex items-center justify-end">Price <SortIcon col="unit_price" /></span>
              </TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] cursor-pointer select-none"
                onClick={() => handleSort("stock")}>
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
                      <button onClick={clearFilters}
                        className="mt-1 text-xs font-medium text-[#4F6EF7] hover:underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const { label, color, bg } = STATUS_CONFIG[p.status] ?? STATUS_CONFIG["in_stock"]
                return (
                  <TableRow key={p.id} className="border-[#E8ECF2] hover:bg-[#F8F9FC] transition-colors">
                    <TableCell>
                      <p className="text-sm font-medium text-[#111827]">{p.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">{p.sku}</p>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                        {p.category_name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7280]">{p.supplier_name || "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#111827]">
                      {Number(p.unit_price).toLocaleString()} DA
                    </TableCell>
                    <TableCell>
                      <StockBar stock={p.stock} threshold={p.threshold} status={p.status} />
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-md px-2 py-0.5 text-xs font-medium border-0"
                        style={{ backgroundColor: bg, color }}>
                        {label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#EEF2FF] transition-colors"
                          aria-label="Edit product">
                          <Pencil className="h-3.5 w-3.5 text-[#4F6EF7]" />
                        </button>
                        <button onClick={() => setDeleteTarget(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#FEF2F2] transition-colors"
                          aria-label="Delete product">
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
        {filtered.length > 0 && (
          <div className="border-t border-[#E8ECF2] px-4 py-3">
            <p className="text-xs text-[#9CA3AF]">
              Showing <span className="font-medium text-[#6B7280]">{filtered.length}</span> of{" "}
              <span className="font-medium text-[#6B7280]">{products.length}</span> products
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white border-[#E8ECF2] overflow-y-auto px-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold text-[#111827]">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {formError && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {formError}
              </p>
            )}

            {/* Name */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Product Name <span className="text-[#DC2626]">*</span>
              </Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wireless Mouse"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
            </div>

            {/* SKU */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                SKU <span className="text-[#DC2626]">*</span>
              </Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. ELC-0098"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] font-mono text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Category <span className="text-[#DC2626]">*</span>
              </Label>

              {!showNewCat ? (
                <div className="flex gap-2">
                  <Select
                    value={form.category ? String(form.category) : ""}
                    onValueChange={(v) => setForm({ ...form, category: Number(v) })}
                  >
                    <SelectTrigger className="h-9 flex-1 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                      <SelectValue placeholder="Select a category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Inline "create new" trigger */}
                  <button
                    onClick={() => { setShowNewCat(true); setNewCatName(""); setNewCatError("") }}
                    className="flex h-9 items-center gap-1 rounded-lg border border-[#E8ECF2]
                               px-2.5 text-xs font-medium text-[#4F6EF7] hover:bg-[#EEF2FF] transition-colors"
                    title="Create new category"
                  >
                    <Plus className="h-3.5 w-3.5" /> New
                  </button>
                </div>
              ) : (
                /* Inline category creation form */
                <div className="rounded-lg border border-[#4F6EF7]/30 bg-[#EEF2FF]/40 p-3">
                  <p className="mb-2 text-xs font-medium text-[#4F6EF7]">New category</p>
                  {newCatError && (
                    <p className="mb-2 text-xs text-[#DC2626]">{newCatError}</p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                      placeholder="Category name…"
                      autoFocus
                      className="h-9 flex-1 border-[#E8ECF2] !bg-white !text-[#111827] text-sm
                                 placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={!newCatName.trim() || creatingCat}
                      className="flex h-9 items-center gap-1 rounded-lg bg-[#4F6EF7] px-3
                                 text-xs font-medium text-white hover:bg-[#3D5CE8] transition-colors disabled:opacity-60"
                    >
                      {creatingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
                    </button>
                    <button
                      onClick={() => { setShowNewCat(false); setNewCatError("") }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8ECF2]
                                 hover:bg-[#F8F9FC] transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Supplier */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Supplier</Label>
              <Select
                value={form.supplier ? String(form.supplier) : ""}
                onValueChange={(v) => setForm({ ...form, supplier: Number(v) })}
              >
                <SelectTrigger className="h-9 border-[#E8ECF2] !bg-white text-sm !text-[#111827]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input type="number" min={0} value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
              </div>
            </div>

            {/* Stock + Threshold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Current Stock</Label>
                <Input type="number" min={0} value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Low Stock Threshold</Label>
                <Input type="number" min={0} value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional product description…" rows={3}
                className="border-[#E8ECF2] !bg-white !text-[#111827] text-sm resize-none placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline"
                className="flex-1 border-[#E8ECF2] text-[#6B7280] hover:bg-[#F8F9FC]"
                onClick={() => setDrawerOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
                onClick={handleSave}
                disabled={saving || !form.name || !form.sku || !form.category}>
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : editingProduct ? "Save Changes" : "Add Product"
                }
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
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
                  <span className="font-semibold text-[#111827]">{deleteTarget?.name}</span>{" "}
                  <span className="font-mono text-xs text-[#9CA3AF]">({deleteTarget?.sku})</span>
                </p>
                <p className="text-sm text-[#6B7280]">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-[#E8ECF2] text-[#6B7280] hover:bg-[#F8F9FC]" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="!bg-[#DC2626] !text-white hover:!bg-[#B91C1C]">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}