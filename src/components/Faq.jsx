import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

const FAQS = [
  {
    q: "Why pay monthly instead of a one-time project fee?",
    a: "Websites and tools need ongoing care — updates, security, new features, and fixes. A monthly plan means we're always here after launch, not gone once the invoice is paid. You can pause anytime when there's nothing in the queue.",
  },
  {
    q: "How quickly will my site be ready?",
    a: "Most business websites go live in 2–3 weeks. Smaller changes often ship within a few days. You'll see a live preview from week one, so you're never waiting without updates.",
  },
  {
    q: "What does 'unlimited requests' mean?",
    a: "Add as many tasks to your list as you like — new pages, design tweaks, automations, whatever you need. We work through them one at a time so every job gets our full attention.",
  },
  {
    q: "Do I own everything you build?",
    a: "Yes, completely. Your website, your code, your designs — all yours. If you ever leave, you take everything with you.",
  },
  {
    q: "What if I only need help for a short time?",
    a: "Subscribe for a month or two, get your site built and launched, then pause. Many clients work with us in cycles — that's exactly what the plan is designed for.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="min-h-screen py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionTag label="Common questions" />
        <SectionTitle>Answers before you reach out.</SectionTitle>

        <div className="mt-12 divide-y divide-line border-y border-line">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 0.05}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-dart"
                >
                  <span className="font-medium tracking-tight md:text-lg">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="shrink-0 text-xl text-dart"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.35, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-sm leading-relaxed text-fog">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
