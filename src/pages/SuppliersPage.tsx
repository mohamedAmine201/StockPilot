import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Truck,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Package,
  Activity,
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
 * Design tokens (consistent across all pages)
 * bg:       #F8F9FC  surface: #FFFFFF  border: #E8ECF2
 * text-1:   #111827  text-2:  #6B7280  text-3: #9CA3AF
 * accent:   #4F6EF7  positive:#16A34A  danger: #DC2626
 * amber:    #D97706
 * ----------------------------------------------------- */

interface RecentMovement {
  date:     string
  product:  string
  quantity: number
  cost:     number
}

interface Supplier {
  id:              number
  name:            string
  contact:         string
  email:           string
  phone:           string
  address:         string
  status:          "active" | "inactive"
  notes:           string
  productsCount:   number
  totalMovements:  number
  totalValue:      number
  recentMovements: RecentMovement[]
  products:        { name: string; sku: string; stock: number }[]
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name:           "TechDistrib",
    contact:        "Karim Mansouri",
    email:          "karim@techdistrib.dz",
    phone:          "+213 555 01 23 45",
    address:        "Zone Industrielle, Rouiba, Alger",
    status:         "active",
    notes:          "Primary electronics supplier. Reliable delivery within 3 days.",
    productsCount:  3,
    totalMovements: 18,
    totalValue:     284500,
    recentMovements: [
      { date: "2026-06-18", product: "HDMI Cable 2m",    quantity: 10, cost: 8500  },
      { date: "2026-06-12", product: "Wireless Mouse",   quantity: 20, cost: 48000 },
      { date: "2026-06-06", product: "USB-C Hub 7-in-1", quantity: 15, cost: 48000 },
    ],
    products: [
      { name: "HDMI Cable 2m",    sku: "ELC-0114", stock: 3  },
      { name: "Wireless Mouse",   sku: "ELC-0098", stock: 5  },
      { name: "USB-C Hub 7-in-1", sku: "ELC-0201", stock: 22 },
    ],
  },
  {
    id: 2,
    name:           "OfficePro",
    contact:        "Samira Benali",
    email:          "samira@officepro.dz",
    phone:          "+213 555 09 87 65",
    address:        "Rue Didouche Mourad, Alger Centre",
    status:         "active",
    notes:          "Best prices on bulk paper and office supplies.",
    productsCount:  3,
    totalMovements: 12,
    totalValue:     67400,
    recentMovements: [
      { date: "2026-06-18", product: "A4 Paper Ream",           quantity: 50, cost: 32500 },
      { date: "2026-06-09", product: "Ballpoint Pens (Box/12)", quantity: 20, cost: 5600  },
    ],
    products: [
      { name: "A4 Paper Ream",           sku: "OFC-0042", stock: 12 },
      { name: "Ballpoint Pens (Box/12)", sku: "OFC-0031", stock: 40 },
      { name: "Stapler Heavy Duty",      sku: "OFC-0055", stock: 0  },
    ],
  },
  {
    id: 3,
    name:           "PackMaster",
    contact:        "Youcef Aïssaoui",
    email:          "youcef@packmaster.dz",
    phone:          "+213 555 03 33 21",
    address:        "Zone d'Activité, Bordj Bou Arréridj",
    status:         "active",
    notes:          "Good for bulk packaging orders. Minimum order 100 units.",
    productsCount:  3,
    totalMovements: 9,
    totalValue:     28600,
    recentMovements: [
      { date: "2026-06-16", product: "Bubble Wrap Roll 50m",   quantity: 10, cost: 9500 },
      { date: "2026-06-08", product: "Cardboard Box (Medium)", quantity: 40, cost: 4800 },
    ],
    products: [
      { name: "Cardboard Box (Medium)", sku: "PKG-0021", stock: 8  },
      { name: "Bubble Wrap Roll 50m",   sku: "PKG-0034", stock: 18 },
      { name: "Packing Tape (x6)",      sku: "PKG-0019", stock: 55 },
    ],
  },
  {
    id: 4,
    name:           "ToolZone",
    contact:        "Rachid Ferhat",
    email:          "rachid@toolzone.dz",
    phone:          "+213 555 07 77 88",
    address:        "Route Nationale 5, Sétif",
    status:         "active",
    notes:          "Specialised in industrial tools and spare parts.",
    productsCount:  2,
    totalMovements: 7,
    totalValue:     103200,
    recentMovements: [
      { date: "2026-06-16", product: "Cordless Drill Battery", quantity: 20, cost: 96000 },
      { date: "2026-06-05", product: "Measuring Tape 5m",      quantity: 15, cost: 8700  },
    ],
    products: [
      { name: "Cordless Drill Battery", sku: "TLS-0007", stock: 2  },
      { name: "Measuring Tape 5m",      sku: "TLS-0041", stock: 20 },
    ],
  },
  {
    id: 5,
    name:           "AlgéPrint",
    contact:        "Nadia Khelifi",
    email:          "nadia@algeprint.dz",
    phone:          "+213 555 02 11 44",
    address:        "Rue des Frères Benhafid, Oran",
    status:         "inactive",
    notes:          "Printing supplies. Paused orders pending contract renewal.",
    productsCount:  0,
    totalMovements: 3,
    totalValue:     14800,
    recentMovements: [
      { date: "2026-04-10", product: "Printer Cartridges", quantity: 12, cost: 14800 },
    ],
    products: [],
  },
]

const EMPTY_FORM = {
  name: "", contact: "", email: "", phone: "",
  address: "", status: "active" as "active" | "inactive", notes: "",
}

const formatDA = (v: number) => v.toLocaleString() + " DA"
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export default function SuppliersPage() {
  const [suppliers,    setSuppliers]    = useState<Supplier[]>(INITIAL_SUPPLIERS)
  const [search,       setSearch]       = useState("")
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [form,         setForm]         = useState({ ...EMPTY_FORM })
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [expandedId,   setExpandedId]   = useState<number | null>(null)

  /* ── Filtered list ──────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return suppliers
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q)    ||
        s.contact.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    )
  }, [suppliers, search])

  /* ── Summary stats ──────────────────────────────── */
  const totalSuppliers  = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length
  const mostActive      = [...suppliers].sort((a, b) => b.totalMovements - a.totalMovements)[0]
  const totalValue      = suppliers.reduce((s, x) => s + x.totalValue, 0)

  /* ── Drawer helpers ─────────────────────────────── */
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setDrawerOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditingId(s.id)
    setForm({
      name: s.name, contact: s.contact, email: s.email,
      phone: s.phone, address: s.address, status: s.status, notes: s.notes,
    })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingId !== null) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, name: form.name, contact: form.contact, email: form.email,
                phone: form.phone, address: form.address, status: form.status, notes: form.notes }
            : s,
        ),
      )
    } else {
      const newId = Math.max(0, ...suppliers.map((s) => s.id)) + 1
      setSuppliers((prev) => [
        ...prev,
        {
          id: newId, ...form,
          productsCount: 0, totalMovements: 0, totalValue: 0,
          recentMovements: [], products: [],
        },
      ])
    }
    setDrawerOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const toggleExpand = (id: number) =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FC] p-6">

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
        {/* Total suppliers */}
        <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(79,110,247,0.08)]">
            <Truck className="h-5 w-5 text-[#4F6EF7]" />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF]">Total Suppliers</p>
            <p className="text-2xl font-semibold text-[#111827]">{totalSuppliers}</p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#16A34A]">{activeSuppliers} active</span>
              {" · "}
              {totalSuppliers - activeSuppliers} inactive
            </p>
          </div>
        </div>

        {/* Most active */}
        <div className="flex items-center gap-4 rounded-xl border border-[#E8ECF2] bg-white px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(22,163,74,0.08)]">
            <TrendingUp className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#9CA3AF]">Most Active Supplier</p>
            <p className="truncate text-lg font-semibold text-[#111827]">{mostActive?.name}</p>
            <p className="text-xs text-[#6B7280]">{mostActive?.totalMovements} stock movements</p>
          </div>
        </div>

        {/* Total purchased value */}
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
            {filtered.length === 0 ? (
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
                  {/* ── Main row ── */}
                  <TableRow
                    key={s.id}
                    className="border-[#E8ECF2] hover:bg-[#F8F9FC] transition-colors cursor-pointer"
                    onClick={() => toggleExpand(s.id)}
                  >
                    {/* Expand chevron */}
                    <TableCell className="pl-4 pr-0">
                      {expandedId === s.id
                        ? <ChevronUp   className="h-4 w-4 text-[#9CA3AF]" />
                        : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                      }
                    </TableCell>

                    {/* Supplier name + email */}
                    <TableCell>
                      <p className="text-sm font-semibold text-[#111827]">{s.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <Mail className="h-3 w-3" />{s.email}
                      </p>
                    </TableCell>

                    {/* Contact person + phone */}
                    <TableCell>
                      <p className="text-sm text-[#111827]">{s.contact}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <Phone className="h-3 w-3" />{s.phone}
                      </p>
                    </TableCell>

                    {/* Products count */}
                    <TableCell className="text-center">
                      <Badge className="border-0 bg-[rgba(79,110,247,0.08)] text-[#4F6EF7] text-xs font-medium">
                        {s.productsCount}
                      </Badge>
                    </TableCell>

                    {/* Movements */}
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-[#111827]">{s.totalMovements}</span>
                    </TableCell>

                    {/* Total value */}
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-[#111827]">{formatDA(s.totalValue)}</span>
                    </TableCell>

                    {/* Status */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge
                        className="border-0 rounded-md px-2 py-0.5 text-xs font-medium cursor-pointer"
                        style={
                          s.status === "active"
                            ? { backgroundColor: "rgba(22,163,74,0.08)", color: "#16A34A" }
                            : { backgroundColor: "rgba(107,114,128,0.08)", color: "#6B7280" }
                        }
                        onClick={() =>
                          setSuppliers((prev) =>
                            prev.map((x) =>
                              x.id === s.id
                                ? { ...x, status: x.status === "active" ? "inactive" : "active" }
                                : x,
                            ),
                          )
                        }
                      >
                        {s.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
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

                  {/* ── Expanded detail panel ── */}
                  {expandedId === s.id && (
                    <TableRow key={`${s.id}-detail`} className="border-[#E8ECF2] bg-[#F8F9FC]">
                      <TableCell colSpan={8} className="px-6 py-5">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                          {/* Contact info */}
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Contact Info
                            </p>
                            <div className="flex flex-col gap-2">
                              {[
                                { icon: Mail,    val: s.email   },
                                { icon: Phone,   val: s.phone   },
                                { icon: MapPin,  val: s.address },
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

                          {/* Products supplied */}
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Products Supplied
                            </p>
                            {s.products.length === 0 ? (
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

                          {/* Recent movements */}
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Recent Movements
                            </p>
                            {s.recentMovements.length === 0 ? (
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
            {/* Name */}
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
            </div>

            {/* Contact person */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Contact Person</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g. Karim Mansouri"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* Email + Phone */}
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

            {/* Address */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City, Wilaya"
                className="h-9 border-[#E8ECF2] !bg-white !text-[#111827] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#4F6EF7]/30 focus-visible:border-[#4F6EF7]"
              />
            </div>

            {/* Status */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-[#111827]">Status</Label>
              <div className="flex gap-2">
                {(["active", "inactive"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, status: val })}
                    className="flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors"
                    style={
                      form.status === val
                        ? val === "active"
                          ? { borderColor: "#16A34A", backgroundColor: "rgba(22,163,74,0.08)", color: "#16A34A" }
                          : { borderColor: "#6B7280", backgroundColor: "rgba(107,114,128,0.08)", color: "#6B7280" }
                        : { borderColor: "#E8ECF2", backgroundColor: "#fff", color: "#9CA3AF" }
                    }
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
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
                disabled={!form.name.trim()}
              >
                {editingId !== null ? "Save Changes" : "Add Supplier"}
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
                {deleteTarget && deleteTarget.productsCount > 0 && (
                  <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-sm text-[#92400E]">
                    ⚠ This supplier is linked to{" "}
                    <span className="font-semibold">{deleteTarget.productsCount} product{deleteTarget.productsCount > 1 ? "s" : ""}</span>.
                    Those products will have no supplier assigned.
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