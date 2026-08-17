import { motion, useReducedMotion } from "framer-motion";

/* ── shared easings ───────────────────────────────────────── */
export const EASE = [0.21, 0.6, 0.35, 1];
export const EASE_HERO = [0.16, 0.84, 0.3, 1];

/* ── registration marks — four crosshairs straddling a frame ── */
export function Marks({ color }) {
  const style = color ? { color } : undefined;
  return (
    <>
      <i className="corner tl" style={style} aria-hidden="true" />
      <i className="corner tr" style={style} aria-hidden="true" />
      <i className="corner bl" style={style} aria-hidden="true" />
      <i className="corner br" style={style} aria-hidden="true" />
    </>
  );
}

/* ── the DevDart logo mark — three concentric circles ─────── */
export function LogoMark({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10.1" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="5.65" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── scroll-reveal wrapper ────────────────────────────────────
   Content is visible by default; the animation is an enhancement.
   Honors reduced-motion by rendering the final state immediately. */
export function Reveal({
  as = "div",
  children,
  className,
  style,
  delay = 0,
  y = 30,
  ...rest
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* ── a kicker + hairline rule that draws left→right on reveal ── */
export function Kicker({ children }) {
  const reduce = useReducedMotion();
  return (
    <>
      <span
        style={{
          display: "block",
          fontSize: 13,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--accent-text)",
          margin: "0 0 12px",
          fontFeatureSettings: "'tnum' 1",
        }}
      >
        {children}
      </span>
      <motion.hr
        style={{
          height: 1,
          border: 0,
          background: "var(--color-divider)",
          margin: "0 0 26px",
          transformOrigin: "left",
        }}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.18 }}
      />
    </>
  );
}

/* ── icons (Lucide geometry, stroke-width 1.5) ────────────── */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const Icon = {
  Moon: (p) => (
    <svg width={17} height={17} viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
    </svg>
  ),
  Sun: (p) => (
    <svg width={17} height={17} viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="1.5" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22.5" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" />
      <line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.4" y2="17.6" />
      <line x1="17.6" y1="6.4" x2="19.4" y2="4.6" />
    </svg>
  ),
  Menu: (p) => (
    <svg width={20} height={20} viewBox="0 0 24 24" {...stroke} {...p}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  ),
  Close: (p) => (
    <svg width={20} height={20} viewBox="0 0 24 24" {...stroke} {...p}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  ),
  Monitor: (p) => (
    <svg width={30} height={30} viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="2" y="3" width="20" height="14" rx="1" />
      <line x1="2" y1="7" x2="22" y2="7" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Dashboard: (p) => (
    <svg width={30} height={30} viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Workflow: (p) => (
    <svg width={30} height={30} viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h5a3 3 0 0 1 3 3v6" />
      <path d="M14 12l3 3 3-3" />
    </svg>
  ),
  Server: (p) => (
    <svg width={30} height={30} viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3" y="4" width="18" height="7" rx="1" />
      <rect x="3" y="13" width="18" height="7" rx="1" />
      <line x1="7" y1="7.5" x2="7.01" y2="7.5" />
      <line x1="7" y1="16.5" x2="7.01" y2="16.5" />
    </svg>
  ),
};
