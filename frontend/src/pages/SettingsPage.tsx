import { useState, useEffect, useRef } from "react"
import {
  Building2, SlidersHorizontal, Tags, Bell, Users, Database,
  ShieldCheck, AlertTriangle, Plus, X, Check, Trash2,
  UploadCloud, DownloadCloud, Mail, Loader2,
} from "lucide-react"
import { Input }            from "@/components/ui/input"
import { Card, CardContent} from "@/components/ui/card"
import { Badge }            from "@/components/ui/badge"
import { useAuth }          from "@/context/AuthContext"

/* ── Design tokens ──────────────────────────────────── */
const NAVY       = "#1E3A5F"
const GREEN      = "#22A06B"
const GREEN_TINT = "#E8F5EE"
const DANGER     = "#DC2626"

const UNITS      = ["pcs", "box", "pack", "roll", "kg", "L"]
const CURRENCIES = ["DA — Algerian Dinar", "USD — US Dollar", "EUR — Euro"]
const VALUATION_OPTIONS = [
  { value: "weighted_average", label: "Weighted Average" },
  { value: "fifo",             label: "FIFO"              },
  { value: "last_purchase",    label: "Last Purchase Price"},
]
const ROLE_DESCRIPTIONS = {
  admin:   "Full access — manage products, team, and settings.",
  manager: "Can edit products and stock, cannot manage team or billing.",
  staff:   "View-only access plus the ability to log stock movements.",
}
const ROLE_BADGE_COLOR: Record<string, string> = {
  admin:   NAVY,
  manager: GREEN,
  staff:   "#64748B",
}
const SECTIONS = [
  { id: "company",       label: "Company Profile",        icon: Building2         },
  { id: "inventory",     label: "Inventory Preferences",  icon: SlidersHorizontal },
  { id: "categories",    label: "Categories & Suppliers", icon: Tags              },
  { id: "notifications", label: "Notifications",          icon: Bell              },
  { id: "team",          label: "Team & Permissions",     icon: Users             },
  { id: "data",          label: "Data Management",        icon: Database          },
  { id: "account",       label: "Account & Security",     icon: ShieldCheck       },
]
const DANGER_SECTION = { id: "danger", label: "Danger Zone", icon: AlertTriangle }

/* ── Native fetch helper ────────────────────────────── */
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:8000/api"

function getCsrf(): string {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith("csrftoken="))
    ?.split("=")[1] ?? ""
}

async function api<T = any>(path: string, method = "GET", body?: object): Promise<T> {
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

async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH", credentials: "include",
    headers: { "X-CSRFToken": getCsrf() },
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, data }
  return data as T
}

/* ── Shared UI helpers ──────────────────────────────── */
const inputCls =
  "h-10 rounded-lg border-slate-200 !bg-white text-sm text-slate-900 " +
  "placeholder:text-slate-400 shadow-none " +
  "focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/20 focus-visible:border-[#1E3A5F]"

const selectCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"

const labelCls = "mb-1.5 block text-xs font-medium text-slate-500"

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
                 border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      style={{ backgroundColor: checked ? GREEN : "#CBD5E1" }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block h-4 w-4 transform rounded-full
                   bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0px)" }}
      />
    </button>
  )
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="pr-4">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SecHead({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
  )
}

function SaveBar({ onSave, saving, saved, error }: {
  onSave: () => void; saving: boolean; saved: boolean; error: string
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {saved && !error && (
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: GREEN }}>
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      <button
        onClick={onSave} disabled={saving}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                   text-white transition-colors hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: NAVY }}
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save changes
      </button>
    </div>
  )
}

function Err({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
      {msg}
    </p>
  )
}

/* ── Component ──────────────────────────────────────── */
export default function SettingsPage() {
  const { user: authUser, logout } = useAuth()
  const [activeSection, setActiveSection] = useState("company")

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved,  setSaved]  = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function startSave(id: string) { setSaving((p) => ({ ...p, [id]: true })) }
  function finishSave(id: string, error = "") {
    setSaving((p) => ({ ...p, [id]: false }))
    setErrors((p) => ({ ...p, [id]: error }))
    if (!error) {
      setSaved((p) => ({ ...p, [id]: true }))
      setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2000)
    }
  }
  function errStr(e: any): string {
    return e?.data ? Object.values(e.data).flat().join(" ") : "Failed to save."
  }

  /* ── Company ──────────────────────────────────────── */
  const [company, setCompany] = useState({
    name: "", address: "", phone: "", tax_id: "", currency: CURRENCIES[0], logo: "",
  })
  const logoRef = useRef<HTMLInputElement>(null)
  const [logoPreview,   setLogoPreview]   = useState("")
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    api("/settings/company/")
      .then((d: any) => {
        setCompany({
          name: d.name ?? "", address: d.address ?? "", phone: d.phone ?? "",
          tax_id: d.tax_id ?? "", currency: d.currency ?? CURRENCIES[0], logo: d.logo ?? "",
        })
        if (d.logo) setLogoPreview(d.logo)
      })
      .catch(() => {})
    console.log(company);
    console.log(`${BASE}${company.logo}`);
  }, [])

  async function saveCompany() {
    startSave("company")
    try {
      const d: any = await api("/settings/company/", "PATCH", {
        name: company.name, address: company.address,
        phone: company.phone, tax_id: company.tax_id, currency: company.currency,
      })
      setCompany((p) => ({ ...p, ...d }))
      finishSave("company")
    } catch (e: any) { finishSave("company", errStr(e)) }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)
      const d: any = await apiUpload("/settings/company/", fd)
      setCompany((p) => ({ ...p, logo: d.logo ?? "" }))
    } catch {
      setErrors((p) => ({ ...p, company: "Logo upload failed." }))
    } finally { setLogoUploading(false) }
  }

  /* ── Inventory ────────────────────────────────────── */
  const [inv, setInv] = useState({
    default_threshold: "10", default_unit: UNITS[0],
    valuation_method: "weighted_average", allow_negative_stock: false,
  })

  useEffect(() => {
    api("/settings/inventory/")
      .then((d: any) => setInv({
        default_threshold:    String(d.default_threshold ?? "10"),
        default_unit:         d.default_unit         ?? UNITS[0],
        valuation_method:     d.valuation_method     ?? "weighted_average",
        allow_negative_stock: d.allow_negative_stock ?? false,
      }))
      .catch(() => {})
  }, [])

  async function saveInventory() {
    startSave("inventory")
    try {
      await api("/settings/inventory/", "PATCH", {
        ...inv, default_threshold: Number(inv.default_threshold),
      })
      finishSave("inventory")
    } catch (e: any) { finishSave("inventory", errStr(e)) }
  }

  /* ── Categories ───────────────────────────────────── */
  const [categories,  setCategories]  = useState<{ id: number; name: string; products_count: number }[]>([])
  const [newCatName,  setNewCatName]  = useState("")
  const [catError,    setCatError]    = useState("")
  const [addingCat,   setAddingCat]   = useState(false)

  useEffect(() => {
    api("/products/categories/")
      .then((d: any[]) => setCategories(d))
      .catch(() => {})
  }, [])

  async function addCategory() {
    const name = newCatName.trim()
    if (!name) return
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setCatError("Category already exists."); return
    }
    setAddingCat(true); setCatError("")
    try {
      const created: any = await api("/products/categories/", "POST", { name })
      setCategories((p) => [...p, { id: created.id, name: created.name, products_count: 0 }])
      setNewCatName("")
    } catch (e: any) {
      setCatError(e?.data?.name?.[0] ?? "Failed to create category.")
    } finally { setAddingCat(false) }
  }

  async function removeCategory(id: number) {
    try {
      await api(`/products/categories/${id}/`, "DELETE")
      setCategories((p) => p.filter((c) => c.id !== id)); setCatError("")
    } catch (e: any) {
      setCatError(e?.data?.error ?? "Cannot delete — reassign linked products first.")
    }
  }

  /* ── Suppliers ────────────────────────────────────── */
  const [suppliers,   setSuppliers]   = useState<{ id: number; name: string; email: string; products_count: number }[]>([])
  const [newSupName,  setNewSupName]  = useState("")
  const [newSupEmail, setNewSupEmail] = useState("")
  const [suppError,   setSuppError]   = useState("")
  const [addingSupp,  setAddingSupp]  = useState(false)

  useEffect(() => {
    api("/suppliers/")
      .then((d: any[]) => setSuppliers(d.map((s) => ({
        id: s.id, name: s.name, email: s.email ?? "", products_count: s.products_count ?? 0,
      }))))
      .catch(() => {})
  }, [])

  async function addSupplier() {
    const name  = newSupName.trim()
    const email = newSupEmail.trim()
    if (!name)  { setSuppError("Supplier name is required."); return }
    if (!email) { setSuppError("Email is required."); return }
    setAddingSupp(true); setSuppError("")
    try {
      const created: any = await api("/suppliers/", "POST", { name, email, is_active: true })
      setSuppliers((p) => [...p, { id: created.id, name: created.name, email: created.email, products_count: 0 }])
      setNewSupName(""); setNewSupEmail("")
    } catch (e: any) {
      const d = (e as any)?.data
      setSuppError(d?.email?.[0] ?? d?.name?.[0] ?? d?.detail ?? "Failed to create supplier.")
    } finally { setAddingSupp(false) }
  }

  async function removeSupplier(id: number) {
    try {
      await api(`/suppliers/${id}/`, "DELETE")
      setSuppliers((p) => p.filter((s) => s.id !== id)); setSuppError("")
    } catch (e: any) {
      setSuppError((e as any)?.data?.error ?? "Cannot delete — reassign linked products first.")
    }
  }

  /* ── Notifications ────────────────────────────────── */
  const [notif, setNotif] = useState({
    low_stock_in_app: true, low_stock_email: true,
    daily_digest: false, weekly_digest: true, alert_threshold: "20",
  })

  useEffect(() => {
    api("/settings/notifications/")
      .then((d: any) => setNotif({
        low_stock_in_app: d.low_stock_in_app ?? true,
        low_stock_email:  d.low_stock_email  ?? true,
        daily_digest:     d.daily_digest     ?? false,
        weekly_digest:    d.weekly_digest    ?? true,
        alert_threshold:  String(d.alert_threshold ?? "20"),
      }))
      .catch(() => {})
  }, [])

  async function saveNotif() {
    startSave("notifications")
    try {
      await api("/settings/notifications/", "PATCH", {
        ...notif, alert_threshold: Number(notif.alert_threshold),
      })
      finishSave("notifications")
    } catch { finishSave("notifications", "Failed to save.") }
  }

  /* ── Team ─────────────────────────────────────────── */
  const [team,        setTeam]        = useState<{ id:number; username:string; email:string; role:string; is_active:boolean }[]>([])
  const [invUsername, setInvUsername] = useState("")
  const [invEmail,    setInvEmail]    = useState("")
  const [invPassword, setInvPassword] = useState("")
  const [invRole,     setInvRole]     = useState("staff")
  const [teamError,   setTeamError]   = useState("")
  const [inviting,    setInviting]    = useState(false)

  useEffect(() => {
    api("/auth/users/").then((d: any[]) => setTeam(d)).catch(() => {})
  }, [])

  async function sendInvite() {
    if (!invUsername.trim() || !invEmail.trim() || !invPassword) {
      setTeamError("Username, email and password are required."); return
    }
    setInviting(true); setTeamError("")
    try {
      const created: any = await api("/auth/users/create/", "POST", {
        username: invUsername.trim(), email: invEmail.trim(),
        password: invPassword, password2: invPassword, role: invRole,
      })
      setTeam((p) => [...p, created.user ?? created])
      setInvUsername(""); setInvEmail(""); setInvPassword(""); setInvRole("staff")
    } catch (e: any) { setTeamError(errStr(e)) }
    finally { setInviting(false) }
  }

  async function deactivateMember(id: number) {
    try {
      await api(`/auth/users/${id}/`, "PATCH", { is_active: false })
      setTeam((p) => p.filter((m) => m.id !== id))
    } catch { setTeamError("Failed to deactivate user.") }
  }

  /* ── Account ──────────────────────────────────────── */
  const [account, setAccount] = useState({ username: authUser?.username ?? "", email: authUser?.email ?? "" })
  const [pwForm,  setPwForm]  = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)
  const [pwBusy,  setPwBusy]  = useState(false)

  useEffect(() => {
    if (authUser) setAccount({ username: authUser.username, email: authUser.email })
  }, [authUser])

  async function saveAccount() {
    startSave("account")
    try {
      await api("/auth/me/update/", "PATCH", { username: account.username, email: account.email })
      finishSave("account")
    } catch (e: any) { finishSave("account", errStr(e)) }
  }

  async function changePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError("All fields are required."); return }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords do not match."); return }
    setPwBusy(true); setPwError("")
    try {
      await api("/settings/password/", "POST", {
        current_password: pwForm.current, new_password: pwForm.next, confirm_password: pwForm.confirm,
      })
      setPwForm({ current: "", next: "", confirm: "" })
      setPwSaved(true); setTimeout(() => setPwSaved(false), 2000)
    } catch (e: any) { setPwError(errStr(e)) }
    finally { setPwBusy(false) }
  }

  /* ── Data ─────────────────────────────────────────── */
  function exportProducts() { window.open(`${BASE}/settings/export/products/`, "_blank") }

  /* ── Danger ───────────────────────────────────────── */
  const [resetConfirm,  setResetConfirm]  = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [dangerError,   setDangerError]   = useState("")
  const [resetting,     setResetting]     = useState(false)
  const [deactivating,  setDeactivating]  = useState(false)

  async function handleReset() {
    setResetting(true); setDangerError("")
    try { await api("/settings/danger/reset/", "POST", { confirm: company.name }); setResetConfirm("") }
    catch (e: any) { setDangerError((e as any)?.data?.error ?? "Failed to reset.") }
    finally { setResetting(false) }
  }

  async function handleDeactivate() {
    setDeactivating(true); setDangerError("")
    try { await api("/settings/danger/deactivate/", "POST", { confirm: "DELETE" }); await logout() }
    catch (e: any) { setDangerError((e as any)?.data?.error ?? "Failed to deactivate.") }
    finally { setDeactivating(false) }
  }

  /* ── Section renderers ────────────────────────────── */
  function renderCompany() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Company Profile" description="Basic information about your business, shown on reports and invoices." />
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden">
              {logoPreview || company.logo ? (
                <img
                  src={`http://localhost:8000${company.logo}`}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-slate-300" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => logoRef.current?.click()} disabled={logoUploading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2
                           text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {logoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                {logoUploading ? "Uploading…" : "Upload logo"}
              </button>
              <p className="text-[11px] text-slate-400">PNG, JPG or WebP — max 2 MB</p>
            </div>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp"
              className="hidden" onChange={handleLogoChange} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Company name</label>
              <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tax / registration number</label>
              <Input value={company.tax_id} onChange={(e) => setCompany({ ...company, tax_id: e.target.value })} className={inputCls + " font-mono"} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={selectCls} value={company.currency} onChange={(e) => setCompany({ ...company, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <SaveBar onSave={saveCompany} saving={saving["company"] ?? false} saved={saved["company"] ?? false} error={errors["company"] ?? ""} />
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderInventory() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Inventory Preferences" description="Defaults applied when new products are added." />
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Default low-stock threshold</label>
              <Input type="number" min="0" value={inv.default_threshold}
                onChange={(e) => setInv({ ...inv, default_threshold: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Default unit</label>
              <select className={selectCls} value={inv.default_unit}
                onChange={(e) => setInv({ ...inv, default_unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Stock valuation method</label>
              <select className={selectCls} value={inv.valuation_method}
                onChange={(e) => setInv({ ...inv, valuation_method: e.target.value })}>
                {VALUATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-1 divide-y divide-slate-100">
            <Row title="Allow negative stock" description="Lets stock-out movements push a product below zero, useful for backorders.">
              <Toggle checked={inv.allow_negative_stock} onChange={(v) => setInv({ ...inv, allow_negative_stock: v })} />
            </Row>
          </div>
          <SaveBar onSave={saveInventory} saving={saving["inventory"] ?? false} saved={saved["inventory"] ?? false} error={errors["inventory"] ?? ""} />
        </CardContent>
      </Card>
    )
  }

  function renderCategoriesAndSuppliers() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Categories & Suppliers" description="Manage the reference data used across your inventory." />
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">

            {/* ── Categories ── */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Categories</p>
              <Err msg={catError} />
              <div className="mt-2 space-y-2">
                {categories.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900">{item.name}</span>
                      <Badge className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {item.products_count} products
                      </Badge>
                    </div>
                    <button
                      onClick={() => removeCategory(item.id)}
                      disabled={item.products_count > 0}
                      title={item.products_count > 0 ? "Reassign products before deleting" : "Delete"}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: DANGER }} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400">No categories yet. Add one below.</p>
                )}
              </div>

              {/* Add category */}
              <div className="mt-3 flex gap-2">
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="New category name"
                  className={inputCls + " flex-1"}
                />
                <button
                  onClick={addCategory} disabled={addingCat}
                  className="flex h-10 items-center gap-1 rounded-lg border border-slate-200
                             px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  {addingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add
                </button>
              </div>
            </div>

            {/* ── Suppliers ── */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Suppliers</p>
              <Err msg={suppError} />
              <div className="mt-2 space-y-2">
                {suppliers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-900">{item.name}</p>
                      {item.email && <p className="text-xs text-slate-400">{item.email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {item.products_count} products
                      </Badge>
                      <button
                        onClick={() => removeSupplier(item.id)}
                        disabled={item.products_count > 0}
                        title={item.products_count > 0 ? "Reassign products before deleting" : "Delete"}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: DANGER }} />
                      </button>
                    </div>
                  </div>
                ))}
                {suppliers.length === 0 && (
                  <p className="text-xs text-slate-400">No suppliers yet. Add one below.</p>
                )}
              </div>

              {/* Add supplier — name + email required by backend */}
              <div className="mt-3 flex flex-col gap-2">
                <Input
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="Supplier name *"
                  className={inputCls}
                />
                <div className="flex gap-2">
                  <Input
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSupplier()}
                    placeholder="Email *"
                    type="email"
                    className={inputCls + " flex-1"}
                  />
                  <button
                    onClick={addSupplier} disabled={addingSupp}
                    className="flex h-10 items-center gap-1 rounded-lg border border-slate-200
                               px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  >
                    {addingSupp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Add
                  </button>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    )
  }

  function renderNotifications() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Notifications" description="Choose how and when you're alerted about inventory changes." />
          <div className="mt-1 divide-y divide-slate-100">
            <Row title="In-app low stock alerts" description="Bell icon badge when items fall below threshold.">
              <Toggle checked={notif.low_stock_in_app} onChange={(v) => setNotif({ ...notif, low_stock_in_app: v })} />
            </Row>
            <Row title="Email low stock alerts" description="Sent to your account email as items run low.">
              <Toggle checked={notif.low_stock_email} onChange={(v) => setNotif({ ...notif, low_stock_email: v })} />
            </Row>
            <Row title="Daily digest" description="A daily summary of stock movements.">
              <Toggle checked={notif.daily_digest} onChange={(v) => setNotif({ ...notif, daily_digest: v })} />
            </Row>
            <Row title="Weekly digest" description="A weekly summary of stock movements and trends.">
              <Toggle checked={notif.weekly_digest} onChange={(v) => setNotif({ ...notif, weekly_digest: v })} />
            </Row>
          </div>
          <div className="mt-4 max-w-xs">
            <label className={labelCls}>Alert threshold (% above reorder point)</label>
            <Input type="number" min="0" max="100" value={notif.alert_threshold}
              onChange={(e) => setNotif({ ...notif, alert_threshold: e.target.value })} className={inputCls} />
          </div>
          <SaveBar onSave={saveNotif} saving={saving["notifications"] ?? false} saved={saved["notifications"] ?? false} error={errors["notifications"] ?? ""} />
        </CardContent>
      </Card>
    )
  }

  function renderTeam() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Team & Permissions" description="Manage who has access to StockPilot and what they can do." />
          <div className="mt-4 space-y-2">
            {team.filter((m) => m.is_active).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.username}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${ROLE_BADGE_COLOR[member.role] ?? "#64748B"}14`, color: ROLE_BADGE_COLOR[member.role] ?? "#64748B" }}
                  >
                    {member.role}
                  </Badge>
                  {member.role !== "admin" && member.id !== authUser?.id && (
                    <button onClick={() => deactivateMember(member.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-50 transition-colors">
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Add a teammate</p>
            <Err msg={teamError} />
            <div className="mt-2 flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input value={invUsername} onChange={(e) => setInvUsername(e.target.value)} placeholder="Username" className={inputCls} />
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <Input value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="name@company.com" className={inputCls + " pl-9"} />
                </div>
                <Input type="password" value={invPassword} onChange={(e) => setInvPassword(e.target.value)} placeholder="Temporary password" className={inputCls} />
                <select className={selectCls} value={invRole} onChange={(e) => setInvRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={sendInvite} disabled={inviting}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-4
                           text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-60"
                style={{ backgroundColor: NAVY }}>
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add user
              </button>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 w-16 flex-shrink-0 font-medium capitalize text-slate-700">{role}</span>
                <span className="text-slate-400">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderData() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Data Management" description="Export your inventory or bring in products from a spreadsheet." />
          <div className="mt-1 divide-y divide-slate-100">
            <Row title="Export products" description="Download your full product list as a CSV file.">
              <button onClick={exportProducts}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2
                           text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <DownloadCloud className="h-3.5 w-3.5" /> Export CSV
              </button>
            </Row>
            <Row title="Import products" description="Upload a spreadsheet to bulk-add or update products.">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2
                                 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <UploadCloud className="h-3.5 w-3.5" /> Import spreadsheet
              </button>
            </Row>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderAccount() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SecHead title="Account & Security" description="Your personal login details." />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Username</label>
              <Input value={account.username} onChange={(e) => setAccount({ ...account, username: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <Input value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className={inputCls} />
            </div>
          </div>
          <SaveBar onSave={saveAccount} saving={saving["account"] ?? false} saved={saved["account"] ?? false} error={errors["account"] ?? ""} />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-900">Change password</p>
            <Err msg={pwError} />
            {pwSaved && (
              <p className="mb-2 flex items-center gap-1 text-xs font-medium" style={{ color: GREEN }}>
                <Check className="h-3.5 w-3.5" /> Password changed successfully.
              </p>
            )}
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input type="password" placeholder="Current password" value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className={inputCls} />
              <Input type="password" placeholder="New password" value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className={inputCls} />
              <Input type="password" placeholder="Confirm new password" value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className={inputCls} />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={changePassword} disabled={pwBusy}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                           text-white hover:opacity-90 transition-colors disabled:opacity-60"
                style={{ backgroundColor: NAVY }}>
                {pwBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update password
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderDanger() {
    const resetReady  = resetConfirm.trim()  === company.name
    const deleteReady = deleteConfirm.trim() === "DELETE"
    return (
      <Card className="rounded-xl shadow-none bg-white border" style={{ borderColor: "rgba(220,38,38,0.25)" }}>
        <CardContent className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: DANGER }} />
            <h2 className="text-sm font-semibold text-slate-900">Danger Zone</h2>
          </div>
          <p className="mb-4 text-xs text-slate-400">These actions are irreversible. Proceed with care.</p>
          <Err msg={dangerError} />
          <div className="mt-2 space-y-5 divide-y divide-slate-100">
            <div className="pt-1">
              <p className="text-sm font-medium text-slate-900">Reset all stock data</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Permanently clears every product and movement record. Type{" "}
                <span className="font-mono font-medium text-slate-600">{company.name}</span> to confirm.
              </p>
              <div className="mt-2 flex gap-2">
                <Input value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder={company.name} className={inputCls + " max-w-xs"} />
                <button onClick={handleReset} disabled={!resetReady || resetting}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium
                             text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: DANGER }}>
                  {resetting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Reset stock data
                </button>
              </div>
            </div>
            <div className="pt-4">
              <p className="text-sm font-medium text-slate-900">Deactivate account</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Deactivates your account and logs you out. Type{" "}
                <span className="font-mono font-medium text-slate-600">DELETE</span> to confirm.
              </p>
              <div className="mt-2 flex gap-2">
                <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE" className={inputCls + " max-w-xs font-mono"} />
                <button onClick={handleDeactivate} disabled={!deleteReady || deactivating}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium
                             text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: DANGER }}>
                  {deactivating && <Loader2 className="h-3 w-3 animate-spin" />}
                  Deactivate account
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderSection() {
    switch (activeSection) {
      case "company":       return renderCompany()
      case "inventory":     return renderInventory()
      case "categories":    return renderCategoriesAndSuppliers()
      case "notifications": return renderNotifications()
      case "team":          return renderTeam()
      case "data":          return renderData()
      case "account":       return renderAccount()
      case "danger":        return renderDanger()
      default:              return null
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-white p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your company profile, inventory preferences, and team access.
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex flex-shrink-0 flex-row gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={[
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  isActive ? "" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
                style={isActive ? { backgroundColor: GREEN_TINT, color: NAVY } : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: isActive ? GREEN : "#94A3B8" }} />
                {item.label}
              </button>
            )
          })}
          <div className="my-2 hidden border-t border-slate-100 lg:block" />
          <button onClick={() => setActiveSection(DANGER_SECTION.id)}
            className={[
              "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
              activeSection === DANGER_SECTION.id ? "bg-[#FEF2F2]" : "hover:bg-[#FEF2F2]/60",
            ].join(" ")}
            style={{ color: DANGER }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: DANGER }} />
            {DANGER_SECTION.label}
          </button>
        </nav>
        <div className="min-w-0 flex-1 max-w-2xl space-y-6">
          {renderSection()}
        </div>
      </div>
    </div>
  )
}