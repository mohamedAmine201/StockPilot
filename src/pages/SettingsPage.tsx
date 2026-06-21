import { useState } from "react"
import {
  Building2,
  SlidersHorizontal,
  Tags,
  Bell,
  Users,
  Database,
  ShieldCheck,
  AlertTriangle,
  Plus,
  X,
  Pencil,
  Check,
  Trash2,
  UploadCloud,
  DownloadCloud,
  LogOut,
  Mail,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/* -------------------------------------------------------
 * Design tokens — derived from the StockPilot Sidebar
 * bg:           #FFFFFF  (white theme)
 * surface:      #FFFFFF
 * border:       #F1F5F9  (slate-100, matches sidebar border-r)
 * border-input: #E2E8F0  (slate-200, for form controls)
 * text-1:       #0F172A  (slate-900 — headings)
 * text-2:       #475569  (slate-600 — body / labels)
 * text-3:       #94A3B8  (slate-400 — muted / placeholders)
 * navy:         #1E3A5F  (primary — logo mark, primary actions)
 * green:        #22A06B  (accent — "Pilot" wordmark, active icon, success)
 * green-tint:   #E8F5EE  (active nav background)
 * danger:       #DC2626
 * amber:        #D97706
 * ----------------------------------------------------- */

const NAVY       = "#1E3A5F"
const GREEN      = "#22A06B"
const GREEN_TINT = "#E8F5EE"
const DANGER     = "#DC2626"
const AMBER      = "#D97706"

const UNITS = ["pcs", "box", "pack", "roll", "kg", "L"]
const CURRENCIES = ["DA — Algerian Dinar", "USD — US Dollar", "EUR — Euro"]
const ROLE_DESCRIPTIONS = {
  Admin:   "Full access — manage products, team, and settings.",
  Manager: "Can edit products and stock, cannot manage team or billing.",
  Staff:   "View-only access plus the ability to log stock movements.",
}

const SECTIONS = [
  { id: "company",       label: "Company Profile",        icon: Building2 },
  { id: "inventory",     label: "Inventory Preferences",  icon: SlidersHorizontal },
  { id: "categories",    label: "Categories & Suppliers",  icon: Tags },
  { id: "notifications", label: "Notifications",          icon: Bell },
  { id: "team",          label: "Team & Permissions",     icon: Users },
  { id: "data",          label: "Data Management",        icon: Database },
  { id: "account",       label: "Account & Security",     icon: ShieldCheck },
]
const DANGER_SECTION = { id: "danger", label: "Danger Zone", icon: AlertTriangle }

const INITIAL_CATEGORIES = [
  { name: "Electronics", count: 48 },
  { name: "Office Supplies", count: 32 },
  { name: "Packaging", count: 21 },
  { name: "Tools", count: 14 },
]

const INITIAL_SUPPLIERS = [
  { name: "TechDistrib SARL", count: 52 },
  { name: "Bureau Plus", count: 38 },
  { name: "PackCo Algérie", count: 27 },
  { name: "ToolMaster", count: 19 },
]

const INITIAL_TEAM = [
  { name: "Amine K.",  email: "amine@stockpilot.dz",  role: "Admin" },
  { name: "Lina B.",   email: "lina@stockpilot.dz",   role: "Manager" },
  { name: "Yacine T.", email: "yacine@stockpilot.dz", role: "Staff" },
]

const INITIAL_SESSIONS = [
  { device: "Chrome on macOS",  location: "Algiers, DZ", lastActive: "Active now",   current: true },
  { device: "Safari on iPhone", location: "Algiers, DZ", lastActive: "2 days ago",   current: false },
]

const ROLE_BADGE_COLOR = {
  Admin: NAVY,
  Manager: GREEN,
  Staff: "#64748B",
}

/* ---------- shared classes ---------- */
const inputClasses =
  "h-10 rounded-lg border-slate-200 !bg-white text-sm text-slate-900 " +
  "placeholder:text-slate-400 shadow-none " +
  "focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/20 focus-visible:border-[#1E3A5F]"

const selectClasses =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"

const fieldLabelClasses = "mb-1.5 block text-xs font-medium text-slate-500"

/* ---------- small shared components ---------- */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? GREEN : "#E2E8F0" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  )
}

function SettingsRow({ title, description, children }) {
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

function SectionHeader({ title, description }) {
  return (
    <div className="mb-1">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
  )
}

function SaveBar({ sectionId, savedSection, onSave }) {
  const justSaved = savedSection === sectionId
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
      {justSaved && (
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: GREEN }}>
          <Check className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      <button
        onClick={() => onSave(sectionId)}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: NAVY }}
      >
        Save changes
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("company")
  const [savedSection, setSavedSection] = useState(null)

  function handleSave(sectionId) {
    setSavedSection(sectionId)
    setTimeout(() => setSavedSection((cur) => (cur === sectionId ? null : cur)), 2000)
  }

  /* ---------- Company Profile ---------- */
  const [company, setCompany] = useState({
    name: "StockPilot Algérie",
    address: "Cité 100 Logements, Bab Ezzouar, Alger",
    phone: "+213 21 00 00 00",
    taxId: "099816001234567",
    currency: CURRENCIES[0],
  })

  /* ---------- Inventory Preferences ---------- */
  const [inventoryPrefs, setInventoryPrefs] = useState({
    defaultThreshold: "10",
    defaultUnit: UNITS[0],
    valuationMethod: "Weighted Average",
    allowNegativeStock: false,
  })

  /* ---------- Categories & Suppliers ---------- */
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS)
  const [newCategory, setNewCategory] = useState("")
  const [newSupplier, setNewSupplier] = useState("")

  function addCategory() {
    const name = newCategory.trim()
    if (!name || categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return
    setCategories((prev) => [...prev, { name, count: 0 }])
    setNewCategory("")
  }
  function addSupplier() {
    const name = newSupplier.trim()
    if (!name || suppliers.some((s) => s.name.toLowerCase() === name.toLowerCase())) return
    setSuppliers((prev) => [...prev, { name, count: 0 }])
    setNewSupplier("")
  }
  function removeCategory(name) {
    setCategories((prev) => prev.filter((c) => c.name !== name))
  }
  function removeSupplier(name) {
    setSuppliers((prev) => prev.filter((s) => s.name !== name))
  }

  /* ---------- Notifications ---------- */
  const [notifications, setNotifications] = useState({
    lowStockInApp: true,
    lowStockEmail: true,
    dailyDigest: false,
    weeklyDigest: true,
    alertThreshold: "20",
  })

  /* ---------- Team & Permissions ---------- */
  const [team, setTeam] = useState(INITIAL_TEAM)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Staff")

  function sendInvite() {
    const email = inviteEmail.trim()
    if (!email) return
    setTeam((prev) => [...prev, { name: email.split("@")[0], email, role: inviteRole }])
    setInviteEmail("")
    setInviteRole("Staff")
  }
  function removeMember(email) {
    setTeam((prev) => prev.filter((m) => m.email !== email))
  }

  /* ---------- Account & Security ---------- */
  const [account, setAccount] = useState({ name: "Amine K.", email: "amine@stockpilot.dz" })
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" })
  const [twoFA, setTwoFA] = useState(false)
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)

  function logOutSession(idx) {
    setSessions((prev) => prev.filter((_, i) => i !== idx))
  }

  /* ---------- Danger zone ---------- */
  const [resetConfirm, setResetConfirm] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const resetReady = resetConfirm.trim() === company.name
  const deleteReady = deleteConfirm.trim() === "DELETE"

  /* ---------- section renderers ---------- */
  function renderCompany() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader
            title="Company Profile"
            description="Basic information about your business, shown on reports and invoices."
          />
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Building2 className="h-6 w-6 text-slate-300" />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <UploadCloud className="h-3.5 w-3.5" />
              Upload logo
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabelClasses}>Company name</label>
              <Input
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={fieldLabelClasses}>Phone</label>
              <Input
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabelClasses}>Address</label>
              <Input
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={fieldLabelClasses}>Tax / registration number</label>
              <Input
                value={company.taxId}
                onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                className={inputClasses + " font-mono"}
              />
            </div>
            <div>
              <label className={fieldLabelClasses}>Currency</label>
              <select
                className={selectClasses}
                value={company.currency}
                onChange={(e) => setCompany({ ...company, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2">
            <SaveBar sectionId="company" savedSection={savedSection} onSave={handleSave} />
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderInventory() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader
            title="Inventory Preferences"
            description="Defaults applied when new products are added."
          />
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabelClasses}>Default low-stock threshold</label>
              <Input
                type="number"
                min="0"
                value={inventoryPrefs.defaultThreshold}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, defaultThreshold: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={fieldLabelClasses}>Default unit</label>
              <select
                className={selectClasses}
                value={inventoryPrefs.defaultUnit}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, defaultUnit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabelClasses}>Stock valuation method</label>
              <select
                className={selectClasses}
                value={inventoryPrefs.valuationMethod}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, valuationMethod: e.target.value })}
              >
                <option>Weighted Average</option>
                <option>FIFO</option>
                <option>Last Purchase Price</option>
              </select>
            </div>
          </div>

          <div className="mt-1 divide-y divide-slate-100">
            <SettingsRow
              title="Allow negative stock"
              description="Lets stock-out movements push a product below zero, useful for backorders."
            >
              <Toggle
                checked={inventoryPrefs.allowNegativeStock}
                onChange={(v) => setInventoryPrefs({ ...inventoryPrefs, allowNegativeStock: v })}
              />
            </SettingsRow>
          </div>

          <SaveBar sectionId="inventory" savedSection={savedSection} onSave={handleSave} />
        </CardContent>
      </Card>
    )
  }

  function renderCategoriesAndSuppliers() {
    const ListEditor = ({ title, items, newValue, setNewValue, onAdd, onRemove, placeholder }) => (
      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">{title}</p>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-900">{item.name}</span>
                <Badge className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {item.count} products
                </Badge>
              </div>
              <button
                onClick={() => onRemove(item.name)}
                disabled={item.count > 0}
                title={item.count > 0 ? "Reassign products before deleting" : "Delete"}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-3.5 w-3.5" style={{ color: DANGER }} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            placeholder={placeholder}
            className={inputClasses + " flex-1"}
          />
          <button
            onClick={onAdd}
            className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    )

    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader
            title="Categories & Suppliers"
            description="Manage the lists used across Products. Items in use can't be deleted directly."
          />
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ListEditor
              title="Categories"
              items={categories}
              newValue={newCategory}
              setNewValue={setNewCategory}
              onAdd={addCategory}
              onRemove={removeCategory}
              placeholder="New category name"
            />
            <ListEditor
              title="Suppliers"
              items={suppliers}
              newValue={newSupplier}
              setNewValue={setNewSupplier}
              onAdd={addSupplier}
              onRemove={removeSupplier}
              placeholder="New supplier name"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderNotifications() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader
            title="Notifications"
            description="Choose how and when you're alerted about inventory changes."
          />
          <div className="mt-1 divide-y divide-slate-100">
            <SettingsRow title="In-app low stock alerts" description="Bell icon badge when items fall below threshold.">
              <Toggle
                checked={notifications.lowStockInApp}
                onChange={(v) => setNotifications({ ...notifications, lowStockInApp: v })}
              />
            </SettingsRow>
            <SettingsRow title="Email low stock alerts" description="Sent to your account email as items run low.">
              <Toggle
                checked={notifications.lowStockEmail}
                onChange={(v) => setNotifications({ ...notifications, lowStockEmail: v })}
              />
            </SettingsRow>
            <SettingsRow title="Daily digest" description="A daily summary of stock movements.">
              <Toggle
                checked={notifications.dailyDigest}
                onChange={(v) => setNotifications({ ...notifications, dailyDigest: v })}
              />
            </SettingsRow>
            <SettingsRow title="Weekly digest" description="A weekly summary of stock movements and trends.">
              <Toggle
                checked={notifications.weeklyDigest}
                onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
              />
            </SettingsRow>
          </div>

          <div className="mt-4 max-w-xs">
            <label className={fieldLabelClasses}>Alert threshold (% above reorder point)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={notifications.alertThreshold}
              onChange={(e) => setNotifications({ ...notifications, alertThreshold: e.target.value })}
              className={inputClasses}
            />
          </div>

          <SaveBar sectionId="notifications" savedSection={savedSection} onSave={handleSave} />
        </CardContent>
      </Card>
    )
  }

  function renderTeam() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader
            title="Team & Permissions"
            description="Manage who has access to StockPilot and what they can do."
          />

          <div className="mt-4 space-y-2">
            {team.map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${ROLE_BADGE_COLOR[member.role]}14`, color: ROLE_BADGE_COLOR[member.role] }}
                  >
                    {member.role}
                  </Badge>
                  {member.role !== "Admin" && (
                    <button
                      onClick={() => removeMember(member.email)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Invite a teammate</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={inputClasses + " pl-9"}
                />
              </div>
              <select
                className={selectClasses + " sm:w-32"}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option>Staff</option>
                <option>Manager</option>
                <option>Admin</option>
              </select>
              <button
                onClick={sendInvite}
                className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: NAVY }}
              >
                <Plus className="h-3.5 w-3.5" />
                Send invite
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 font-medium text-slate-700 w-16 flex-shrink-0">{role}</span>
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
          <SectionHeader
            title="Data Management"
            description="Export your inventory or bring in products from a spreadsheet."
          />

          <div className="mt-1 divide-y divide-slate-100">
            <SettingsRow title="Export products" description="Download your full product list as a CSV file.">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <DownloadCloud className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </SettingsRow>
            <SettingsRow title="Import products" description="Upload a spreadsheet to bulk-add or update products.">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <UploadCloud className="h-3.5 w-3.5" />
                Import spreadsheet
              </button>
            </SettingsRow>
            <SettingsRow title="Backup" description="Last backup: today at 04:00 AM.">
              <button
                className="rounded-lg px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: NAVY }}
              >
                Back up now
              </button>
            </SettingsRow>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderAccount() {
    return (
      <Card className="border-slate-100 bg-white shadow-none rounded-xl">
        <CardContent className="p-5">
          <SectionHeader title="Account & Security" description="Your personal login details and active sessions." />

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabelClasses}>Full name</label>
              <Input
                value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={fieldLabelClasses}>Email</label>
              <Input
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-900">Change password</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                type="password"
                placeholder="Current password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className={inputClasses}
              />
              <Input
                type="password"
                placeholder="New password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                className={inputClasses}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-1 border-t border-slate-100">
            <SettingsRow title="Two-factor authentication" description="Require a verification code at sign-in.">
              <Toggle checked={twoFA} onChange={setTwoFA} />
            </SettingsRow>
          </div>

          <div className="mt-1 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-900">Active sessions</p>
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm text-slate-900">
                      {s.device}
                      {s.current && (
                        <span className="ml-2 text-[11px] font-medium" style={{ color: GREEN }}>
                          This device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{s.location} · {s.lastActive}</p>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => logOutSession(i)}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log out
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <SaveBar sectionId="account" savedSection={savedSection} onSave={handleSave} />
        </CardContent>
      </Card>
    )
  }

  function renderDanger() {
    return (
      <Card className="border rounded-xl shadow-none bg-white" style={{ borderColor: "rgba(220,38,38,0.25)" }}>
        <CardContent className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: DANGER }} />
            <h2 className="text-sm font-semibold text-slate-900">Danger Zone</h2>
          </div>
          <p className="mb-4 text-xs text-slate-400">These actions are irreversible. Proceed with care.</p>

          <div className="space-y-5 divide-y divide-slate-100">
            <div className="pt-1">
              <p className="text-sm font-medium text-slate-900">Reset all stock data</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Permanently clears every product and movement record. Type{" "}
                <span className="font-mono font-medium text-slate-600">{company.name}</span> to confirm.
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder={company.name}
                  className={inputClasses + " max-w-xs"}
                />
                <button
                  disabled={!resetReady}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: DANGER }}
                >
                  Reset stock data
                </button>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm font-medium text-slate-900">Delete account</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Deletes your account and removes your access to StockPilot. Type{" "}
                <span className="font-mono font-medium text-slate-600">DELETE</span> to confirm.
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className={inputClasses + " max-w-xs font-mono"}
                />
                <button
                  disabled={!deleteReady}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: DANGER }}
                >
                  Delete account
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
      case "company": return renderCompany()
      case "inventory": return renderInventory()
      case "categories": return renderCategoriesAndSuppliers()
      case "notifications": return renderNotifications()
      case "team": return renderTeam()
      case "data": return renderData()
      case "account": return renderAccount()
      case "danger": return renderDanger()
      default: return null
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
        {/* ── Secondary settings nav — mirrors the sidebar's active-state pattern ── */}
        <nav className="flex flex-shrink-0 flex-row gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={[
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  isActive ? "" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
                style={isActive ? { backgroundColor: GREEN_TINT, color: NAVY } : undefined}
              >
                <Icon className="h-4 w-4" style={{ color: isActive ? GREEN : "#94A3B8" }} />
                {item.label}
              </button>
            )
          })}

          <div className="my-2 hidden border-t border-slate-100 lg:block" />

          <button
            onClick={() => setActiveSection(DANGER_SECTION.id)}
            className={[
              "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
              activeSection === DANGER_SECTION.id ? "bg-[#FEF2F2]" : "hover:bg-[#FEF2F2]/60",
            ].join(" ")}
            style={{ color: DANGER }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: DANGER }} />
            {DANGER_SECTION.label}
          </button>
        </nav>

        {/* ── Active section content ── */}
        <div className="min-w-0 flex-1 max-w-2xl space-y-6">
          {renderSection()}
        </div>
      </div>
    </div>
  )
}