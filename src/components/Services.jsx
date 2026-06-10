import { motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

/* --- animated mini-visuals, one per service --- */

function SiteVisual() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-ink p-3">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-dart/60" />
        <span className="ml-2 h-3 flex-1 rounded-sm bg-ink-3" />
      </div>
      {[["60%", 0], ["90%", 0.15], ["75%", 0.3], ["40%", 0.45]].map(([w, d], i) => (
        <motion.div
          key={i}
          className="mb-2 h-2.5 rounded-sm bg-ink-3"
          style={{ width: w }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, delay: d, repeat: Infinity }}
        />
      ))}
      <motion.div
        className="mt-auto h-6 w-24 rounded-md bg-dart/80"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

function ToolVisual() {
  const bars = [44, 70, 32, 86, 58, 76];
  return (
    <div className="flex h-full items-end gap-2 rounded-lg border border-line bg-ink p-4">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-full rounded-t-sm bg-dart/70"
          initial={{ height: 8 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: false, margin: "-40px" }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            height: { duration: 0.8, delay: i * 0.08, ease: "easeOut" },
            opacity: { duration: 3, delay: i * 0.2, repeat: Infinity },
          }}
        />
      ))}
    </div>
  );
}

function AutomationVisual() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-line bg-ink p-3">
      <svg viewBox="0 0 200 90" className="w-full">
        <path id="flow" d="M16 45 H70 M90 45 H144 M164 45 H190" stroke="rgba(131, 0, 139, 0.45)" strokeWidth="1.5" fill="none" />
        {[16, 90, 164].map((x, i) => (
          <motion.rect
            key={x}
            x={x}
            y="33"
            width="24"
            height="24"
            rx="6"
            fill="none"
            stroke="#b0f7ff"
            strokeWidth="1.5"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.8, delay: i * 0.55, repeat: Infinity }}
          />
        ))}
        <motion.circle
          cx={28}
          cy={45}
          r="3"
          fill="#b0f7ff"
          animate={{ cx: [28, 102, 176] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

function HostVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 rounded-lg border border-line bg-ink p-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-dart"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, delay: row * 0.4, repeat: Infinity }}
          />
          <span className="h-1.5 w-12 rounded-full bg-ink-3" />
          <motion.span
            className="ml-auto font-mono text-[9px] text-dart/80"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: row * 0.3, repeat: Infinity }}
          >
            99.99%
          </motion.span>
        </div>
      ))}
    </div>
  );
}

const SERVICES = [
  {
    title: "Websites",
    desc: "Professional sites that look great on every device, show up on Google, and turn visitors into customers. Built for your brand — not from a template.",
    visual: <SiteVisual />,
  },
  {
    title: "Business tools",
    desc: "Custom dashboards, order trackers, and admin panels built around how your team actually works. Replace spreadsheets with something your staff will love using.",
    visual: <ToolVisual />,
  },
  {
    title: "Automation",
    desc: "Stop doing the same tasks by hand. We connect your tools so invoices, reports, and notifications run automatically — saving hours every week.",
    visual: <AutomationVisual />,
  },
  {
    title: "Hosting & care",
    desc: "We host your site, keep it secure, fix problems, and make updates whenever you need them. You never have to think about servers or downtime.",
    visual: <HostVisual />,
  },
];

export default function Services() {
  return (
    <section id="services" className="relative min-h-screen py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTag label="What we do" />
        <SectionTitle>
          Everything your business needs online, <span className="text-fog">in one place.</span>
        </SectionTitle>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="interactive-card group ticks relative h-full overflow-hidden rounded-xl border border-line bg-ink-2/85 p-6 transition-colors duration-300 hover:border-dart/40">
                <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-dart/0 blur-3xl transition-all duration-500 group-hover:bg-dart/8" />
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">{s.desc}</p>
                  </div>
                </div>
                <div className="mt-6 h-36">{s.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
