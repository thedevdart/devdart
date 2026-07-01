import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { scrollToSection } from "../utils/scrollToSection.js";

const ITEMS = [
  { id: "top", label: "Start" },
  { id: "services", label: "Services" },
  { id: "work", label: "Projects" },
  { id: "process", label: "Process" },
  { id: "contact", label: "Contact" },
];

export default function JourneyNav() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const sections = ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { threshold: [0.2, 0.45, 0.7], rootMargin: "-20% 0px -30% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed top-1/2 right-4 z-60 hidden -translate-y-1/2 lg:block">
      <div className="rounded-xl border border-line/70 bg-ink/45 px-2.5 py-2.5 backdrop-blur-md">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
            >
              <motion.span
                className={`h-2.5 w-2.5 rounded-full border border-dart ${isActive ? "bg-dart" : "bg-transparent"}`}
                animate={{ scale: isActive ? 1.18 : 1, opacity: isActive ? 1 : 0.72 }}
              />
              <span className={`text-[11px] ${isActive ? "text-paper" : "text-fog"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
