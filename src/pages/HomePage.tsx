import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Boxes,
  LineChart,
  BellRing,
  Truck,
  User
} from "lucide-react"
import image from '../assets/Warehouse-Shelving-1.webp'


const features = [
  {
    icon: Boxes,
    title: "Real-time stock tracking",
    description:
      "Every product, every quantity, always up to date. Record stock in and out as it happens, no spreadsheets needed.",
  },
  {
    icon: LineChart,
    title: "Insights that matter",
    description:
      "See your inventory value, movement trends, and category breakdown at a glance with clear, visual dashboards.",
  },
  {
    icon: BellRing,
    title: "Low stock alerts",
    description:
      "Set thresholds per product and get notified before you run out, so you can reorder with confidence.",
  },
  {
    icon: Truck,
    title: "Supplier management",
    description:
      "Keep supplier details and purchase history in one place, linked directly to the products they provide.",
  },
]

export default function HomePage() {
    const navigate = useNavigate();
    const handleButtonClick = () => {
        navigate('/login')
    }
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E3A5F]">
              <Boxes className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Stock<span className="text-[#22A06B]">Pilot</span>
            </span>
          </div>

          <Button
            className="bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]/90 cursor-pointer"
            onClick={handleButtonClick}
          >
            <User />
            Log in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Signature barcode-tick texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.06] lg:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #1E3A5F 0px, #1E3A5F 2px, transparent 2px, transparent 10px, #1E3A5F 10px, #1E3A5F 12px, transparent 12px, transparent 26px)",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F4] px-3 py-1 font-mono text-xs tracking-widest text-[#1E3A5F]">
              INV · 001 — INVENTORY OS
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Know what's in stock,{" "}
              <span className="text-[var(--primary)]">before it runs out.</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
              StockPilot gives small businesses a clear view of every
              product, every movement, and every supplier — with dashboards
              that turn raw numbers into decisions you can act on today.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]/90"
                onClick={handleButtonClick}
              >
                Use it free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-200 text-slate-700"
                onClick={handleButtonClick}
              >
                Log in
              </Button>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative hidden md:block">
            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
              <img
                src={image}
                alt="Organized warehouse shelves with labeled storage boxes"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-[#F8FAFB]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to run inventory, in one place
            </h2>
            <p className="mt-3 text-slate-600">
              Built for teams who'd rather spend time on their business than
              on counting boxes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-100 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5EE]">
                    <Icon className="h-5 w-5 text-[#22A06B]" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#1E3A5F]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to take control of your stock?
          </h2>
          <p className="mt-3 max-w-md text-sm text-slate-200">
            Set up your first products in minutes and see your inventory
            come to life on your dashboard.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#22A06B] text-white hover:bg-[#22A06B]/90"
            onClick={handleButtonClick}
          >
            Get started
          </Button>
        </div>
      </section>
    </div>
  )
}