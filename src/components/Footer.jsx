import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TargetIcon } from "./ui.jsx";
import useIsMobile from "../hooks/useIsMobile.js";
import { handleSectionClick } from "../utils/scrollToSection.js";

function FooterBar() {
  return (
    <div className="relative z-20 shrink-0 border-t border-line bg-slate/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-center text-[11px] text-fog md:flex-row md:text-left">
        <span className="flex items-center gap-2">
          <TargetIcon size={13} className="text-dart" />
          DevDart © {new Date().getFullYear()} — Development with precision.
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href="#services" className="transition-colors hover:text-paper">Services</a>
          <a href="#work" className="transition-colors hover:text-paper">Projects</a>
          <a href="#process" className="transition-colors hover:text-paper">How it works</a>
          <a href="#contact" onClick={(e) => handleSectionClick(e, "contact")} className="transition-colors hover:text-paper">
            Contact
          </a>
          <a
            href="https://instagram.com/thedevdart"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-paper"
          >
            Instagram
          </a>
          <span className="flex items-center gap-1.5 text-dart">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dart" /> Accepting new clients
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.94, 1.16] : [0.9, 1.3]);
  const containerY = useTransform(scrollYProgress, [0, 1], isMobile ? [32, -72] : [48, -128]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.1, 0.32]);

  return (
    <footer ref={ref} className="relative h-svh border-t border-line bg-slate/25 backdrop-blur-sm">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden bg-blueprint">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <motion.div
            className="pointer-events-none absolute inset-0 bg-dart/10"
            style={{ opacity: glowOpacity }}
          />
          <motion.div
            className="pointer-events-none absolute top-1/2 left-1/2 h-[min(85vw,640px)] w-[min(85vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dart/8 blur-[120px]"
            style={{ scale, opacity: glowOpacity }}
          />

          <motion.div
            className="absolute inset-0 flex items-center justify-center px-5"
            style={{ y: containerY }}
          >
            <motion.div className="relative z-10 mx-auto w-full max-w-6xl text-center" style={{ scale }}>
              <p className="text-xs font-semibold tracking-[0.2em] text-dart uppercase md:text-sm">
                Ready to get started?
              </p>
              <h2 className="mx-auto mt-5 max-w-4xl text-3xl leading-[1.05] font-semibold tracking-tighter sm:text-4xl md:text-6xl lg:text-7xl">
                Let&apos;s build something <br />
                <span className="glow text-dart">your business deserves.</span>
              </h2>
              <motion.a
                href="mailto:team@devdart.in?subject=Project%20inquiry"
                className="mt-10 inline-block rounded-lg bg-dart px-8 py-4 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_48px_rgba(176,247,255,0.45)]"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.985 }}
              >
                team@devdart.in
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            className="pointer-events-none absolute bottom-8 left-[10%] hidden text-dart/30 md:block"
            style={{ opacity: glowOpacity }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <TargetIcon size={72} />
          </motion.div>
        </div>

        <FooterBar />
      </div>
    </footer>
  );
}
