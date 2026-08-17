import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Kicker, Reveal, EASE } from "./ui.jsx";

const ITEMS = [
  {
    q: "Why pay monthly instead of a one-time project fee?",
    a: "Websites and tools need ongoing care — updates, security, new features and fixes. A monthly plan means we're always here after launch, not gone once the invoice is paid. You can pause anytime when there's nothing in the queue.",
  },
  {
    q: "How quickly will my site be ready?",
    a: "Most business websites go live in 2–3 weeks. Smaller changes often ship within a few days. You'll see a live preview from week one, so you're never waiting without updates.",
  },
  {
    q: 'What does "unlimited requests" mean?',
    a: "Add as many tasks to your list as you like — new pages, design tweaks, automations, whatever you need. We work through them one at a time so every job gets our full attention.",
  },
  {
    q: "Do I own everything you build?",
    a: "Yes, completely. Your website, your code, your designs — all yours. If you ever leave, you take everything with you.",
  },
  {
    q: "What if I only need help for a short time?",
    a: "Work with us for a month or two, get your site built and launched, then pause. Many clients work in cycles — that's exactly what we're set up for.",
  },
];

export default function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(null);

  return (
    <section
      id="faq"
      style={{ borderTop: "1px solid var(--color-divider)", background: "var(--color-surface)" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "88px clamp(20px,5vw,72px)" }}>
        <Reveal>
          <Kicker>04 · Common questions</Kicker>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".01em",
              fontSize: "clamp(32px,4vw,56px)",
              lineHeight: 1.02,
              margin: 0,
            }}
          >
            Answers before you reach out.
          </h2>
        </Reveal>

        <Reveal style={{ marginTop: 44, borderTop: "1px solid var(--color-divider)" }}>
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: "22px 0",
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <span style={{ fontSize: 17, fontWeight: 500 }}>{item.q}</span>
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE }}
                    style={{
                      flexShrink: 0,
                      fontFamily: "var(--font-heading)",
                      fontSize: 26,
                      color: "var(--color-accent)",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { height: 0 }}
                      animate={{ height: "auto" }}
                      exit={reduce ? { height: 0 } : { height: 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.38, ease: EASE }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        style={{
                          fontSize: 15,
                          lineHeight: 1.65,
                          margin: 0,
                          padding: "0 0 24px",
                          maxWidth: "62ch",
                          color: "color-mix(in srgb, var(--color-text) 76%, transparent)",
                        }}
                      >
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
