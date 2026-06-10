import { motion } from "framer-motion";

export function Reveal({ children, delay = 0, y = 28, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTag({ label }) {
  return (
    <Reveal>
      <p className="text-xs font-semibold tracking-[0.2em] text-dart uppercase">{label}</p>
    </Reveal>
  );
}

export function SectionTitle({ children, className = "" }) {
  return (
    <Reveal delay={0.08}>
      <h2 className={`mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl ${className}`}>
        {children}
      </h2>
    </Reveal>
  );
}

export function TargetIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}
