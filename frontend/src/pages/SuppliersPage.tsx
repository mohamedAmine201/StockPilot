import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Search, Plus, Pencil, Trash2, X, Truck, TrendingUp, DollarSign,
  ChevronDown, ChevronUp, Phone, Mail, MapPin, Package, Activity,
  Loader2, AlertCircle,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
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
import { useApi } from "@/lib/api"

/* -------------------------------------------------------
 * Config
 * ----------------------------------------------------- */

/* -------------------------------------------------------
 * Types
 * ----------------------------------------------------- */
interface RecentMovement {
  date:     string
  product:  string
  quantity: number
  cost:     number
}

interface SupplierProduct {
  name:  string
  sku:   string
  stock: number
}

interface Supplier {
  id:              number
  name:            string
  contact:         string
  email:           string
  phone:           string
  address:         string
  is_active:       boolean
  notes:           string
  products_count:  number
  total_movements: number
  total_value:     number
  created_at:      string
  updated_at:      string
  recentMovements?: RecentMovement[]
  products?:        SupplierProduct[]
}

type FormData = {
  name:      string
  contact:   string
  email:     string
  phone:     string
  address:   string
  is_active: boolean
  notes:     string
}

const EMPTY_FORM: FormData = {
  name: "", contact: "", email: "", phone: "",
  address: "", is_active: true, notes: "",
}

const formatDA   = (v: number) => (v ?? 0).toLocaleString() + " DA"
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })

/* -------------------------------------------------------
 * Component
 * ----------------------------------------------------- */
export default function SuppliersPage() {
  const { request } = useApi();
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const [search,       setSearch]       = useState("")
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [form,         setForm]         = useState<FormData>({ ...EMPTY_FORM })
  const [formErrors,   setFormErrors]   = useState<Record<string, string>>({})
  const [saving,       setSaving]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [expandedId,   setExpandedId]   = useState<number | null>(null)
  const [bannerError,  setBannerError]  = useState<string | null>(null)

  /* ── Fetch all suppliers ────────────────────────── */
  const fetchSuppliers = useCallback(async (searchTerm = "") => {
    setLoading(true)
    setFetchError(null)
    try {
      const path = searchTerm
        ? `/suppliers/?search=${encodeURIComponent(searchTerm)}`
        : "/suppliers/"
      const data = await request<Supplier[]>(path)
      setSuppliers(data)
    } catch (err: any) {
      setFetchError(err?.data?.error ?? "Failed to load suppliers.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  // Debounced search — 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => fetchSuppliers(search), 400)
    return () => clearTimeout(timer)
  }, [search, fetchSuppliers])

  /* ── Derived stats ──────────────────────────────── */
  const totalSuppliers  = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.is_active).length
  const mostActive      = [...suppliers].sort((a, b) => b.total_movements - a.total_movements)[0]
  const totalValue      = suppliers.reduce((s, x) => s + (x.total_value ?? 0), 0)

  /* ── Client-side filter (instant while debounce fires) */
  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q)    ||
        s.contact.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    )
  }, [suppliers, search])

  /* ── Drawer helpers ─────────────────────────────── */
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setFormErrors({})
    setDrawerOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditingId(s.id)
    setForm({
      name: s.name, contact: s.contact, email: s.email,
      phone: s.phone, address: s.address,
      is_active: s.is_active, notes: s.notes,
    })
    setFormErrors({})
    setDrawerOpen(true)
  }

  /* ── Save (create or update) ────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormErrors({ name: "Supplier name is required." })
      return
    }
    setSaving(true)
    setFormErrors({})
    try {
      if (editingId !== null) {
        const updated = await request<Supplier>(`/suppliers/${editingId}/`, "PATCH", form)
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
      } else {
        const created = await request<Supplier>("/suppliers/", "POST", form)
        setSuppliers((prev) => [created, ...prev])
      }
      setDrawerOpen(false)
    } catch (err: any) {
      const djangoErrors = err?.data
      if (djangoErrors && typeof djangoErrors === "object") {
        const mapped: Record<string, string> = {}
        Object.entries(djangoErrors).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? (val[0] as string) : String(val)
        })
        setFormErrors(mapped)
      } else {
        setFormErrors({ general: "Something went wrong. Please try again." })
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── Toggle active status inline ────────────────── */
  const toggleStatus = async (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = await request<Supplier>(
        `/suppliers/${s.id}/`, "PATCH", { is_active: !s.is_active }
      )
      setSuppliers((prev) => prev.map((x) => (x.id === s.id ? updated : x)))
    } catch {
      setBannerError("Could not update supplier status. Please try again.")
    }
  }

  /* ── Delete ─────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await request(`/suppliers/${deleteTarget.id}/`, "DELETE")
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      const msg = err?.data?.error ?? "Could not delete supplier."
      setBannerError(msg)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = (id: number) =>
    setExpandedId((prev) => (prev === id ? null : id))

  /* ── Loading / error states ─────────────────────── */
  if (loading && suppliers.length === 0) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#4F6EF7]" />
          <p className="text-sm text-[#6B7280]">Loading suppliers…</p>
        </div>
      </div>
    )
  }

  if (fetchError && suppliers.length === 0) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
            <AlertCircle className="h-6 w-6 text-[#DC2626]" />
          </div>
          <p className="text-sm font-medium text-[#111827]">Failed to load suppliers</p>
          <p className="text-xs text-[#9CA3AF]">{fetchError}</p>
          <Button
            onClick={() => fetchSuppliers()}
            className="mt-2 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

      {/* Banner error (non-fatal) */}
      {bannerError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#DC2626]" />
          <p className="text-sm text-[#DC2626]">{bannerError}</p>
          <button
            onClick={() => setBannerError(null)}
            className="ml-auto text-[#DC2626] hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Suppliers</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {activeSuppliers} active · {totalSuppliers} total
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* ── Summary cards ───────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(79,110,247,0.08)]">
            <Truck className="h-5 w-5 text-[#4F6EF7]" />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF]">Total Suppliers</p>
            <p className="text-2xl font-semibold text-[#111827]">{totalSuppliers}</p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#16A34A]">{activeSuppliers} active</span>
              {" · "}{totalSuppliers - activeSuppliers} inactive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(22,163,74,0.08)]">
            <TrendingUp className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#9CA3AF]">Most Active Supplier</p>
            <p className="truncate text-lg font-semibold text-[#111827]">
              {mostActive?.name ?? "—"}
            </p>
            <p className="text-xs text-[#6B7280]">
              {mostActive?.total_movements ?? 0} stock movements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(217,119,6,0.08)]">
            <DollarSign className="h-5 w-5 text-[#D97706]" />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF]">Total Purchased Value</p>
            <p className="text-2xl font-semibold text-[#111827]">{formatDA(totalValue)}</p>
            <p className="text-xs text-[#6B7280]">across all suppliers</p>
          </div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact or email…"
            className="pl-9 h-9 rounded-lg border-[#E8ECF2] !bg-white !text-[#111827] text-sm
                       placeholder:text-[#9CA3AF] focus-visible:ring-2
                       focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#DC2626] transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8ECF2] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E8ECF2] hover:bg-transparent bg-[#F8F9FC]">
              <TableHead className="text-xs font-medium text-[#6B7280] w-8" />
              <TableHead className="text-xs font-medium text-[#6B7280]">Supplier</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Contact</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-center">Products</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-center">Movements</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Total Value</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
              <TableHead className="text-xs font-medium text-[#6B7280] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4F6EF7]" />
                    <span className="text-sm text-[#6B7280]">Loading…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
                      <Truck className="h-6 w-6 text-[#9CA3AF]" />
                    </div>
                    <p className="text-sm font-medium text-[#111827]">No suppliers found</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {search ? "Try a different search term" : "Add your first supplier to get started"}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="text-xs font-medium text-[#4F6EF7] hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <>
                  <TableRow
                    key={s.id}
                    className="border-[#E8ECF2] hover:bg-[#F8F9FC] transition-colors cursor-pointer"
                    onClick={() => toggleExpand(s.id)}
                  >
                    <TableCell className="pl-4 pr-0">
                      {expandedId === s.id
                        ? <ChevronUp   className="h-4 w-4 text-[#9CA3AF]" />
                        : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                      }
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-semibold text-[#111827]">{s.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <Mail className="h-3 w-3" />{s.email}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm text-[#111827]">{s.contact || "—"}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <Phone className="h-3 w-3" />{s.phone || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className="border-0 bg-[rgba(79,110,247,0.08)] text-[#4F6EF7] text-xs font-medium">
                        {s.products_count}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-[#111827]">{s.total_movements}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-[#111827]">{formatDA(s.total_value)}</span>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge
                        className="border-0 rounded-md px-2 py-0.5 text-xs font-medium cursor-pointer"
                        style={
                          s.is_active
                            ? { backgroundColor:"rgba(22,163,74,0.08)",   color:"#16A34A" }
                            : { backgroundColor:"rgba(107,114,128,0.08)", color:"#6B7280" }
                        }
                        onClick={(e) => toggleStatus(s, e)}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#EEF2FF] transition-colors"
                          aria-label="Edit supplier"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#4F6EF7]" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#FEF2F2] transition-colors"
                          aria-label="Delete supplier"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedId === s.id && (
                    <TableRow key={`${s.id}-detail`} className="border-[#E8ECF2] bg-[#F8F9FC]">
                      <TableCell colSpan={8} className="px-6 py-5">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Contact Info
                            </p>
                            <div className="flex flex-col gap-2">
                              {[
                                { icon: Mail,   val: s.email   },
                                { icon: Phone,  val: s.phone   },
                                { icon: MapPin, val: s.address },
                              ].map(({ icon: Icon, val }) => (
                                <div key={val} className="flex items-start gap-2 text-sm text-[#6B7280]">
                                  <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF]" />
                                  <span>{val || "—"}</span>
                                </div>
                              ))}
                              {s.notes && (
                                <p className="mt-1 rounded-lg border border-[#E8ECF2] bg-white px-3 py-2 text-xs text-[#6B7280]">
                                  {s.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Products Supplied
                            </p>
                            {!s.products || s.products.length === 0 ? (
                              <p className="text-xs text-[#9CA3AF]">No products linked yet</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {s.products.map((p) => (
                                  <div
                                    key={p.sku}
                                    className="flex items-center justify-between rounded-lg border border-[#E8ECF2] bg-white px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Package className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                      <div>
                                        <p className="text-xs font-medium text-[#111827]">{p.name}</p>
                                        <p className="font-mono text-xs text-[#9CA3AF]">{p.sku}</p>
                                      </div>
                                    </div>
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: p.stock <= 5 ? "#DC2626" : p.stock <= 10 ? "#D97706" : "#16A34A" }}
                                    >
                                      {p.stock} units
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Recent Movements
                            </p>
                            {!s.recentMovements || s.recentMovements.length === 0 ? (
                              <p className="text-xs text-[#9CA3AF]">No movements recorded yet</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {s.recentMovements.map((m, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg border border-[#E8ECF2] bg-white px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF]" />
                                      <div>
                                        <p className="text-xs font-medium text-[#111827]">{m.product}</p>
                                        <p className="text-xs text-[#9CA3AF]">{formatDate(m.date)}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-semibold text-[#16A34A]">+{m.quantity} units</p>
                                      <p className="text-xs text-[#9CA3AF]">{formatDA(m.cost)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="border-t border-[#E8ECF2] px-4 py-3">
            <p className="text-xs text-[#9CA3AF]">
              Showing{" "}
              <span className="font-medium text-[#6B7280]">{filtered.length}</span> of{" "}
              <span className="font-medium text-[#6B7280]">{suppliers.length}</span> suppliers
            </p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Drawer ───────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white border-[#E8ECF2] overflow-y-auto px-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold text-[#111827]">
              {editingId !== null ? "Edit Supplier" : "Add New Supplier"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">
                Supplier Name <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. TechDistrib"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
              {formErrors.name && <p className="text-xs text-[#DC2626]">{formErrors.name}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Contact Person</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g. Karim Mansouri"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
                {formErrors.email && <p className="text-xs text-[#DC2626]">{formErrors.email}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-[#111827]">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+213 555 …"
                  className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City, Wilaya"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Status</Label>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setForm({ ...form, is_active: val })}
                    className="flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors"
                    style={
                      form.is_active === val
                        ? val
                          ? { borderColor:"#16A34A", backgroundColor:"rgba(22,163,74,0.08)", color:"#16A34A" }
                          : { borderColor:"#6B7280", backgroundColor:"rgba(107,114,128,0.08)", color:"#6B7280" }
                        : { borderColor:"#E8ECF2", backgroundColor:"#fff", color:"#9CA3AF" }
                    }
                  >
                    {val ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes about this supplier…"
                rows={3}
                className="border-[#E8ECF2] !bg-white !text-[#111827] text-sm resize-none placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {formErrors.general && (
              <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs text-[#DC2626]">
                {formErrors.general}
              </p>
            )}

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
                className="flex-1 bg-[#4F6EF7] text-white hover:bg-[#3D5CE8]"
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
              >
                {saving
                  ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span>
                  : editingId !== null ? "Save Changes" : "Add Supplier"
                }
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
              Delete supplier?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-[#6B7280]">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-[#111827]">{deleteTarget?.name}</span>.
                </p>
                {deleteTarget && deleteTarget.products_count > 0 && (
                  <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-sm text-[#92400E]">
                    ⚠ This supplier is linked to{" "}
                    <span className="font-semibold">
                      {deleteTarget.products_count} product{deleteTarget.products_count > 1 ? "s" : ""}
                    </span>. Reassign those products first.
                  </p>
                )}
                <p className="text-sm text-[#6B7280]">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-[#E8ECF2] text-[#6B7280] hover:bg-[#F8F9FC]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="!bg-[#DC2626] !text-white hover:!bg-[#B91C1C]"
            >
              {deleting
                ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Deleting…</span>
                : "Delete"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}