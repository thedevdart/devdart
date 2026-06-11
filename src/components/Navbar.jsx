import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TargetIcon } from "./ui.jsx";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "How it works" },
  { href: "#work", label: "Our work" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.6, 0.35, 1] }}
      className="fixed inset-x-0 top-0 z-70 px-3 sm:px-0"
    >
      <nav className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-xl border border-line/80 bg-ink-2/70 px-4 py-2.5 backdrop-blur-md md:px-6">
        <a href="#top" onClick={() => setOpen(false)} className="group flex items-center gap-2.5">
          <TargetIcon size={20} className="text-dart transition-transform duration-500 group-hover:rotate-90" />
          <span className="text-sm font-bold tracking-tight">
            Dev<span className="text-dart">Dart</span>
          </span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-8 text-sm text-fog md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-paper">
              {l.label}
            </a>
          ))}
        </div>

        {/* desktop CTA */}
        <motion.a
          href="#pricing"
          className="group relative hidden items-center gap-2 overflow-hidden rounded-lg bg-dart px-4 py-2 text-sm font-semibold text-ink transition-shadow hover:shadow-[0_0_24px_rgba(176,247,255,0.45)] md:flex"
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping-slow rounded-full bg-paper/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-paper" />
          </span>
          Get started
        </motion.a>

        {/* mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="relative h-9 w-9 rounded-lg border border-line/80 md:hidden"
        >
          <span className="absolute left-1/2 top-1/2 block h-3.5 w-5 -translate-x-1/2 -translate-y-1/2">
            <motion.span
              className="absolute left-0 top-0 h-0.5 w-full rounded-full bg-paper"
              animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-paper"
              animate={{ opacity: open ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-paper"
              animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
              transition={{ duration: 0.25 }}
            />
          </span>
        </button>
      </nav>

      {/* mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.6, 0.35, 1] }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl border border-line/80 bg-ink-2/95 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col p-2">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base text-paper/90 active:bg-dart/10"
                >
                  {l.label}
                  <span className="text-dart">→</span>
                </motion.a>
              ))}
              <a
                href="#pricing"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-dart px-4 py-3.5 text-base font-semibold text-ink"
              >
                Get started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
