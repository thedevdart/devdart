import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

const STEPS = [
  {
    step: "Step 1",
    title: "Tell us what you need",
    desc: "A quick 30-minute call. We learn about your business, your goals, and what success looks like. No long proposals or confusing jargon.",
    meta: "Day 1",
  },
  {
    step: "Step 2",
    title: "We design and build",
    desc: "You get a live preview link from week one. Share feedback, request changes, and watch your site come together — no waiting in the dark.",
    meta: "Weeks 1–3",
  },
  {
    step: "Step 3",
    title: "We launch it for you",
    desc: "Domain, hosting, security, and go-live — all handled by us. You don't touch a single technical setting.",
    meta: "Launch day",
  },
  {
    step: "Step 4",
    title: "We keep it running",
    desc: "Updates, fixes, new pages, and improvements every month. Your site stays fast, secure, and up to date — without you lifting a finger.",
    meta: "Every month",
  },
];

export default function Process() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 75%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="process" className="relative min-h-screen border-t border-line bg-plum/35 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTag label="How it works" />
        <SectionTitle>
          From first call to live site — <span className="text-fog">we handle everything.</span>
        </SectionTitle>

        <div ref={ref} className="relative mt-16 ml-3 md:ml-1">
          <div className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
          <motion.div
            className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-dart shadow-[0_0_12px_rgba(176,247,255,0.55)]"
            style={{ scaleY: lineScale }}
          />

          <div className="space-y-12">
            {STEPS.map((step) => (
              <Reveal key={step.title} delay={0.05}>
                <div className="relative pl-12">
                  <span className="absolute top-1.5 left-0 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-dart bg-plum">
                    <span className="h-[5px] w-[5px] rounded-full bg-dart" />
                  </span>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-xs font-semibold tracking-wide text-dart uppercase">{step.step}</span>
                    <span className="ml-auto rounded-full border border-line px-2.5 py-0.5 text-[11px] text-fog">
                      {step.meta}
                    </span>
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-fog">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
