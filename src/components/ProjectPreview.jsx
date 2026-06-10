import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const UPDATES = [
  { status: "done", label: "Discovery call", detail: "Goals, timeline and scope agreed" },
  { status: "done", label: "Design preview", detail: "Homepage mockup ready for review" },
  { status: "active", label: "Building your site", detail: "Pages, forms and mobile layout in progress" },
  { status: "next", label: "Launch & hosting", detail: "Domain, security and go-live handled by us" },
  { status: "next", label: "Ongoing care", detail: "Updates, fixes and improvements every month" },
];

export default function ProjectPreview() {
  const [visible, setVisible] = useState(0);
  const timeouts = useRef([]);

  useEffect(() => {
    let cancelled = false;
    const later = (fn, ms) => {
      const id = setTimeout(() => !cancelled && fn(), ms);
      timeouts.current.push(id);
    };

    let t = 500;
    UPDATES.forEach((_, i) => {
      later(() => setVisible(i + 1), t);
      t += 650;
    });

    return () => {
      cancelled = true;
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
      className="ticks relative w-full overflow-hidden rounded-xl border border-line bg-ink-2/90 shadow-[0_24px_80px_-24px_rgba(70,23,131,0.55)]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-violet/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-violet/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-dart/70" />
        </div>
        <span className="text-xs font-medium text-fog">Your project dashboard</span>
        <span className="rounded-full border border-dart/30 bg-dart/10 px-2 py-0.5 text-[10px] font-medium text-dart">
          Live preview
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-dart/4 to-transparent" />

      <div className="min-h-75 space-y-3 p-4">
        {UPDATES.slice(0, visible).map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-lg border px-3.5 py-3 ${
              item.status === "active"
                ? "border-dart/40 bg-dart/5"
                : item.status === "done"
                  ? "border-line bg-ink"
                  : "border-line/60 bg-ink/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  item.status === "done"
                    ? "bg-dart text-paper"
                    : item.status === "active"
                      ? "border border-dart text-dart"
                      : "border border-line text-fog"
                }`}
              >
                {item.status === "done" ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-paper">{item.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-fog">{item.detail}</p>
              </div>
              {item.status === "active" && (
                <span className="shrink-0 rounded-full bg-dart/15 px-2 py-0.5 text-[10px] font-medium text-dart">
                  In progress
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {visible < UPDATES.length && (
          <div className="flex items-center gap-2 px-1 pt-1 text-xs text-fog">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-line border-t-dart" />
            Updating your project timeline…
          </div>
        )}
      </div>
    </motion.div>
  );
}
