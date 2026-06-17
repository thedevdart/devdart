import { motion } from "framer-motion";
import ProjectPreview from "./ProjectPreview.jsx";
import { handleSectionClick } from "../utils/scrollToSection.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.21, 0.6, 0.35, 1] } },
};

const STATS = [
  ["Within 24h", "We reply to every inquiry"],
  ["Custom quote", "Share your project details"],
  ["Fully managed", "We build, host & maintain"],
];

export default function Hero() {
  return (
    <section id="top" className="bg-blueprint relative min-h-screen overflow-hidden pt-28 pb-16 sm:pt-32 md:pt-44 md:pb-20">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-dart/6 blur-[120px]" />

      <motion.div
        className="pointer-events-none absolute top-24 right-[8%] hidden text-line lg:block"
        animate={{ y: [0, -14, 0], rotate: [0, 90] }}
        transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="0.5" />
          <line x1="12" y1="0" x2="12" y2="4" stroke="currentColor" strokeWidth="0.5" />
          <line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </motion.div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3 py-1.5 text-xs text-fog">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping-slow rounded-full bg-dart" />
              <span className="h-1.5 w-1.5 rounded-full bg-dart" />
            </span>
            Accepting 2 new clients this month
          </motion.div>

          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tighter sm:text-5xl sm:leading-[1.02] md:text-7xl">
            <motion.span variants={item} className="block">
              Your website,
            </motion.span>
            <motion.span variants={item} className="block">
              built and <span className="glow text-dart">managed.</span>
            </motion.span>
          </h1>

          <motion.p variants={item} className="mt-6 max-w-md text-base leading-relaxed text-fog md:text-lg">
            We design, build, host and maintain your website or business tools — so you
            never have to chase freelancers or worry about tech again.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <motion.a
              href="#contact"
              onClick={(e) => handleSectionClick(e, "contact")}
              className="rounded-lg bg-dart px-6 py-3.5 text-center text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(176,247,255,0.45)]"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get a quote
            </motion.a>
          </motion.div>

          <motion.div variants={item} className="mt-12 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:gap-10">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <p className="text-lg font-semibold text-dart md:text-xl">{value}</p>
                <p className="mt-1 text-xs leading-relaxed text-fog">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div style={{ perspective: 1200 }}>
          <ProjectPreview />
        </div>
      </div>
    </section>
  );
}
