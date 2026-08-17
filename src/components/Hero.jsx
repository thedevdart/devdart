import { motion, useReducedMotion } from "framer-motion";
import Dashboard from "./Dashboard.jsx";
import { EASE, EASE_HERO } from "./ui.jsx";
import { useBooking } from "../booking/BookingContext.jsx";

const HEADLINE = [
  { text: "Your website,", accent: false },
  { text: "built and", accent: false },
  { text: "managed.", accent: true },
];

const SPEC = [
  { label: "Reply", value: "Within 24 h", accent: false, tnum: true },
  { label: "Build", value: "2–3 weeks", accent: false, tnum: true },
  { label: "Hosting & care", value: "Included", accent: false, tnum: false },
  { label: "Ownership", value: "100% yours", accent: true, tnum: true },
];

export default function Hero() {
  const reduce = useReducedMotion();
  const { openBooking } = useBooking();

  // hero "fade up" — content visible by default, animated in on mount
  const fade = (i) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay: 0.42 + i * 0.12 },
        };

  return (
    <section
      id="top"
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "152px clamp(20px,5vw,72px) 84px",
      }}
    >
      <div
        className="dd-hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.04fr 0.96fr",
          gap: "clamp(32px,5vw,64px)",
          alignItems: "center",
        }}
      >
        {/* ── left column ── */}
        <div>
          {/* availability badge */}
          <motion.span
            className="dd-badge"
            {...fade(0)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              border: "1px solid var(--color-divider)",
              padding: "6px 12px",
              fontSize: 12,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 72%, transparent)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  animation: reduce ? "none" : "dd-ping 2.2s cubic-bezier(0,0,.2,1) infinite",
                }}
              />
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                }}
              />
            </span>
            Accepting 2 new clients this month
          </motion.span>

          {/* headline — each line slides up from its own mask */}
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".01em",
              lineHeight: 1.02,
              margin: "26px 0 0",
              fontSize: "clamp(42px,5.6vw,84px)",
              marginLeft: "-0.045em",
            }}
          >
            {HEADLINE.map((line, i) => (
              <span key={line.text} style={{ display: "block", overflow: "hidden" }}>
                <motion.span
                  style={{ display: "block", color: line.accent ? "var(--accent-text)" : undefined }}
                  initial={reduce ? false : { y: "108%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: EASE_HERO, delay: 0.12 + i * 0.11 }}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* lead + buttons */}
          <div
            className="dd-hero-foot"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 26,
              marginTop: 28,
            }}
          >
            <motion.p
              {...fade(1)}
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                maxWidth: "46ch",
                margin: 0,
                color: "color-mix(in srgb, var(--color-text) 80%, transparent)",
              }}
            >
              We design, build, host and maintain your website or business tools — so you never have
              to chase freelancers or worry about tech again.
            </motion.p>
            <motion.div {...fade(2)} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button
                type="button"
                onClick={openBooking}
                className="btn btn-primary"
                style={{ whiteSpace: "nowrap" }}
              >
                Book a free call
              </button>
              <a href="#work" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                See our work
              </a>
            </motion.div>
          </div>
        </div>

        {/* ── right column: live dashboard ── */}
        <motion.div {...fade(3)}>
          <Dashboard />
        </motion.div>
      </div>

      {/* spec row */}
      <motion.div
        className="dd-hero-spec"
        {...fade(4)}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--color-divider)",
          marginTop: 56,
        }}
      >
        {SPEC.map((cell, i) => (
          <div
            key={cell.label}
            style={{
              padding:
                i === 0
                  ? "18px 24px 0 0"
                  : i === SPEC.length - 1
                  ? "18px 0 0 24px"
                  : "18px 24px 0",
              borderRight: i < SPEC.length - 1 ? "1px solid var(--color-divider)" : "none",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
              }}
            >
              {cell.label}
            </span>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: ".01em",
                margin: "8px 0 0",
                textTransform: "uppercase",
                color: cell.accent ? "var(--accent-text)" : undefined,
                fontFeatureSettings: cell.tnum ? "'tnum' 1" : undefined,
              }}
            >
              {cell.value}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
