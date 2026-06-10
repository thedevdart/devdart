import { motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

const PROJECTS = [
  {
    name: "Freight operations dashboard",
    type: "Business tool",
    result: "Eliminated 4 hours of daily manual tracking",
  },
  {
    name: "Online store relaunch",
    type: "Website",
    result: "38% more sales after going live",
  },
  {
    name: "Invoice & report automation",
    type: "Automation",
    result: "900+ documents handled automatically each month",
  },
];

function PreviewArt({ index }) {
  return (
    <div className="bg-dots relative h-44 overflow-hidden rounded-lg border border-line bg-ink">
      <div className="absolute inset-0 bg-gradient-to-br from-dart/8 to-transparent" />
      <div className="absolute top-4 left-4 right-4 rounded-md border border-line bg-ink-2/80 p-2.5">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-dart/70" />
        </div>
        <div className="mt-2.5 flex gap-2">
          <div className="h-12 w-1/3 rounded-sm border border-line bg-ink-3/60" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-4/5 rounded-full bg-ink-3" />
            <div className="h-2 w-3/5 rounded-full bg-ink-3" />
            <div className="h-2 w-2/3 rounded-full bg-dart/30" />
          </div>
        </div>
      </div>
      <motion.div
        className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-dart/10 to-transparent"
        initial={{ x: "-150%" }}
        whileHover={{ x: "350%" }}
        animate={{ x: ["-150%", "350%"] }}
        transition={{ duration: 3.5, delay: index * 0.8, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function Work() {
  return (
    <section id="work" className="min-h-screen py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionTag label="Our work" />
            <SectionTitle>
              Real results for <span className="text-fog">real businesses.</span>
            </SectionTitle>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-xs text-sm leading-relaxed text-fog">
              Client names kept private — happy to share details on a call.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <div className="interactive-card group ticks h-full rounded-xl border border-line bg-ink-2/85 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-dart/40">
                <PreviewArt index={i} />
                <div className="px-1.5 pt-5 pb-2">
                  <p className="text-[11px] font-semibold tracking-wide text-dart uppercase">{p.type}</p>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{p.result}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
