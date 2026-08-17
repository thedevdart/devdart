import { motion, useReducedMotion } from "framer-motion";
import { Kicker, Reveal, EASE } from "./ui.jsx";

const STEPS = [
  {
    n: "01",
    phase: "Day 1",
    title: "Tell us what you need",
    desc:
      "A quick 30-minute call. We learn about your business, your goals, and what success looks like. No jargon.",
  },
  {
    n: "02",
    phase: "Weeks 1–3",
    title: "We design and build",
    desc:
      "You get a live preview link from week one. Share feedback, request changes, watch it come together — no waiting in the dark.",
  },
  {
    n: "03",
    phase: "Launch day",
    title: "We launch it for you",
    desc:
      "Domain, hosting, security and go-live — all handled by us. You don't touch a single technical setting.",
  },
  {
    n: "04",
    phase: "Every month",
    title: "We keep it running",
    desc:
      "Updates, fixes, new pages and improvements every month — fast, secure and current, without you lifting a finger.",
  },
];

export default function Process() {
  const reduce = useReducedMotion();
  return (
    <section id="process" style={{ borderTop: "1px solid var(--color-divider)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "88px clamp(20px,5vw,72px)" }}>
        <Reveal>
          <Kicker>03 · How it works</Kicker>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".01em",
              fontSize: "clamp(32px,4vw,56px)",
              lineHeight: 1.02,
              margin: 0,
              maxWidth: "26ch",
            }}
          >
            From first call to live site —{" "}
            <span style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
              we handle everything.
            </span>
          </h2>
        </Reveal>

        <div style={{ position: "relative", marginTop: 56 }}>
          {/* connector track + drawn accent line */}
          <div
            className="dd-proc-line"
            style={{
              position: "absolute",
              top: 7,
              left: 0,
              right: 0,
              height: 1,
              background: "var(--color-divider)",
            }}
          />
          <motion.div
            className="dd-proc-line"
            style={{
              position: "absolute",
              top: 7,
              left: 0,
              right: 0,
              height: 1,
              background: "var(--color-accent)",
              transformOrigin: "left",
            }}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.5, ease: EASE }}
          />

          <div
            className="dd-proc-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "clamp(20px,3vw,40px)",
            }}
          >
            {STEPS.map((step, i) => (
              <Reveal
                key={step.n}
                className="dd-step"
                delay={i * 0.09}
                style={{ paddingTop: 30, position: "relative" }}
              >
                <span
                  className="dd-step-node"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 15,
                    height: 15,
                    border: "1px solid var(--color-accent)",
                    background: "var(--color-bg)",
                    transition: "background .3s",
                  }}
                />
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 600,
                      fontSize: 32,
                      letterSpacing: ".01em",
                      color: "var(--accent-text)",
                      fontFeatureSettings: "'tnum' 1",
                    }}
                  >
                    {step.n}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                    }}
                  >
                    {step.phase}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: ".01em",
                    fontSize: 22,
                    margin: "12px 0 0",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: "10px 0 0",
                    color: "color-mix(in srgb, var(--color-text) 76%, transparent)",
                  }}
                >
                  {step.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
