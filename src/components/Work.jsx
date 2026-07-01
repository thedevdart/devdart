import { useState } from "react";
import { motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";




const PROJECTS = [
  {
    name: "Spilo",
    type: "Website",
    result: "Fast, modern presence for Spilo — designed for conversions.",
    href: "https://www.spilo.in/",
  },
  {
    name: "Jalaram Computers",
    type: "Website",
    result: "A polished online experience for Jalaram Computers.",
    href: "https://www.jalaramcomputers.com/",
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
  const [selected, setSelected] = useState(PROJECTS[0].name);
  const active = PROJECTS.find((p) => p.name === selected) ?? PROJECTS[0];


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
              Explore two live projects — switch the preview to see details.
            </p>
          </Reveal>
        </div>

        {/* project selector */}
        <div className="mt-10 rounded-xl border border-line/70 bg-ink-2/50 p-1">
          <div className="grid grid-cols-2 gap-1">
            {PROJECTS.map((p, i) => {
              const isActive = p.name === active.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setSelected(p.name)}
                  className={
                    "relative z-10 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all " +
                    (isActive
                      ? "bg-dart/15 text-dart shadow-[0_0_24px_rgba(176,247,255,0.15)]"
                      : "bg-transparent text-paper/80 hover:text-paper")
                  }
                  aria-pressed={isActive}
                >
                  <span
                    className={
                      "h-2 w-2 rounded-full " +
                      (isActive ? "bg-dart" : "bg-line/70")
                    }
                  />
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <div className="interactive-card group ticks h-full rounded-xl border border-line bg-ink-2/85 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-dart/40">
                <PreviewArt index={PROJECTS.findIndex((p) => p.name === active.name)} />
                <div className="px-1.5 pt-5 pb-2">
                  <p className="text-[11px] font-semibold tracking-wide text-dart uppercase">{active.type}</p>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{active.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{active.result}</p>
                  <a
                    href={active.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-dart px-4 py-2 text-sm font-semibold text-ink transition-shadow hover:shadow-[0_0_24px_rgba(176,247,255,0.45)]"
                  >
                    Visit site <span className="text-ink">→</span>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-1">
            <Reveal delay={0.1}>
              <div className="interactive-card h-full rounded-xl border border-line/70 bg-ink-2/70 p-5">
                <p className="text-xs font-semibold tracking-[0.2em] text-dart uppercase">Quick notes</p>
                <h4 className="mt-3 text-xl font-semibold tracking-tight">What we delivered</h4>
                <ul className="mt-4 space-y-3 text-sm text-fog">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-dart" />
                    <span>Responsive UI with clean layout and fast loading.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-dart" />
                    <span>Conversion-focused sections & clear calls to action.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-dart" />
                    <span>Reusable components so your site is easy to update.</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

