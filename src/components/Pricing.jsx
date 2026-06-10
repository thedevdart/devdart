import { motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle, TargetIcon } from "./ui.jsx";

const INCLUDED = [
  "Unlimited change requests — we work on one at a time",
  "Websites, business tools, and automations",
  "Hosting, domain, security, and backups",
  "Monitoring and regular maintenance",
  "New features and updates every month",
  "Talk directly to the people building your site",
  "Pause or cancel whenever you want",
];

const COMPARE = [
  { label: "Hiring in-house", price: "$6,000+/mo", note: "Plus benefits, management, and turnover risk" },
  { label: "Typical agency", price: "$10k–50k", note: "Per project, then you're on your own" },
  { label: "DevDart", price: "$800/mo", note: "Everything included — build, host, and maintain", highlight: true },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative min-h-screen border-t border-line bg-slate/30 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dart/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 md:gap-14 lg:grid-cols-2">
        <div>
          <SectionTag label="Pricing" />
          <SectionTitle>
            One simple price. <span className="text-fog">Everything included.</span>
          </SectionTitle>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-fog md:text-base">
              No hourly rates, no surprise invoices, no arguing over scope.
              You get a dedicated team for less than hiring a single junior employee.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 space-y-3">
              {COMPARE.map((row) => (
                <div
                  key={row.label}
                  className={`rounded-xl border p-4 ${
                    row.highlight ? "border-dart/40 bg-dart/5" : "border-line bg-ink"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`text-sm font-medium ${row.highlight ? "text-paper" : "text-fog"}`}>
                      {row.label}
                    </span>
                    <span className={`text-lg font-semibold ${row.highlight ? "text-dart" : "text-paper"}`}>
                      {row.price}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-fog">{row.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="relative">
            <motion.div
              className="absolute -inset-px rounded-2xl opacity-60"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, #b0f7ff66 12%, transparent 28%, transparent 60%, #86a7c755 72%, transparent 90%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative rounded-2xl border border-line bg-ink-2/90 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-fog uppercase">
                  <TargetIcon size={14} className="text-dart" /> Monthly plan
                </span>
                <span className="rounded-full border border-dart/40 bg-dart/10 px-3 py-1 text-[11px] font-medium text-dart">
                  2 spots left
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tighter sm:text-6xl md:text-7xl">$800</span>
                <span className="mb-2 text-sm text-fog">/ month</span>
              </div>
              <p className="mt-1 text-sm text-fog">Flat rate. Pause or cancel anytime.</p>

              <ul className="mt-8 space-y-3 border-t border-line pt-6">
                {INCLUDED.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-start gap-3 text-sm text-paper/90"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                  >
                    <span className="mt-0.5 text-dart">✓</span> {item}
                  </motion.li>
                ))}
              </ul>

              <motion.a
                href="mailto:team@devdart.in?subject=Start%20a%20project"
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-dart px-6 py-4 text-sm font-semibold text-ink transition-all hover:shadow-[0_0_40px_rgba(176,247,255,0.45)]"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
              >
                Book a free call
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </motion.a>
              <p className="mt-3 text-center text-xs text-fog/70">
                30-minute intro call — no commitment required
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
