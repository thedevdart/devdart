import { motion } from "framer-motion";
import { Reveal, TargetIcon } from "./ui.jsx";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-slate/25 backdrop-blur-sm">
      <div className="bg-blueprint relative mx-auto max-w-6xl px-5 py-16 text-center md:py-24">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-dart uppercase">Ready to get started?</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tighter sm:text-4xl md:text-6xl">
            Let's build something <br />
            <span className="glow text-dart">your business deserves.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <motion.a
            href="mailto:team@devdart.in?subject=Project%20inquiry"
            className="mt-10 inline-block rounded-lg bg-dart px-8 py-4 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_48px_rgba(176,247,255,0.45)]"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.985 }}
          >
            team@devdart.in
          </motion.a>
        </Reveal>

        <motion.div
          className="pointer-events-none absolute bottom-10 left-[10%] hidden text-dart/30 md:block"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <TargetIcon size={72} />
        </motion.div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-center text-[11px] text-fog md:flex-row md:text-left">
          <span className="flex items-center gap-2">
            <TargetIcon size={13} className="text-dart" />
            DevDart © {new Date().getFullYear()} — Development with precision.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a href="#services" className="transition-colors hover:text-paper">Services</a>
            <a href="#work" className="transition-colors hover:text-paper">Our work</a>
            <a href="#pricing" className="transition-colors hover:text-paper">Pricing</a>
            <span className="flex items-center gap-1.5 text-dart">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dart" /> Accepting new clients
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
