import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";

const RINGS = [
  { r: 88, color: "rgba(91, 88, 142, 0.45)" },
  { r: 64, color: "rgba(112, 128, 170, 0.55)" },
  { r: 40, color: "rgba(134, 167, 199, 0.65)" },
  { r: 14, color: "rgba(176, 247, 255, 0.38)" },
];

// Bullseye — tip lands here (nudged slightly below true center)
const BULLSEYE = { x: 0, y: 1 };

// Thrown from lower-left toward the bullseye
const THROW = {
  from: { x: -210, y: 166 },
  to: BULLSEYE,
  rotate: -39,
};

function DartShape() {
  return (
    <g>
      {/* Tip at (0,0); shaft and fins trail behind along -X */}
      <path d="M0 0 L-14 -5 L-14 5 Z" fill="#b0f7ff" />
      <path d="M-3 -1.5 L-12 -4.5 L-12 0 Z" fill="#d6f8ff" opacity="0.65" />
      <rect x="-76" y="-2.8" width="62" height="5.6" rx="2.8" fill="#eafcff" />
      <rect x="-82" y="-2.2" width="8" height="4.4" rx="1.2" fill="#7080aa" />
      <path d="M-80 0 L-96 -11 L-87 0 Z" fill="#9bcfe3" />
      <path d="M-80 0 L-96 11 L-87 0 Z" fill="#86a7c7" />
    </g>
  );
}

export default function Preloader({ onDone }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState("aim"); // aim | throw | hit

  useEffect(() => {
    const counter = animate(0, 100, {
      duration: 2.4,
      ease: [0.3, 0.6, 0.3, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    });
    const throwTimer = setTimeout(() => setPhase("throw"), 900);
    const hitTimer = setTimeout(() => setPhase("hit"), 1550);
    const doneTimer = setTimeout(onDone, 2800);
    return () => {
      counter.stop();
      clearTimeout(throwTimer);
      clearTimeout(hitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const status =
    phase === "aim"
      ? "Taking aim…"
      : phase === "throw"
        ? "Releasing…"
        : count >= 95
          ? "Welcome."
          : "Almost ready…";

  return (
    <motion.div
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden bg-surface"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="bg-dots absolute inset-0 opacity-60" />

      <motion.div
        className="relative"
        animate={phase === "hit" ? { x: [0, -4, 3, -1, 0], y: [0, 2, -1, 0, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        <svg width="280" height="280" viewBox="-140 -140 280 280" className="overflow-visible">
          {/* Target board */}
          {RINGS.map((ring, i) => (
            <motion.circle
              key={ring.r}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.r === 14 ? 2 : 1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
            />
          ))}

          <motion.g
            stroke="rgba(134, 167, 199, 0.56)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <line x1="-118" y1="0" x2="-102" y2="0" />
            <line x1="102" y1="0" x2="118" y2="0" />
            <line x1="0" y1="-118" x2="0" y2="-102" />
            <line x1="0" y1="102" x2="0" y2="118" />
          </motion.g>

          {/* Throw path — faint arc toward the bullseye */}
          <motion.line
            x1={THROW.from.x}
            y1={THROW.from.y}
            x2={BULLSEYE.x}
            y2={BULLSEYE.y}
            stroke="#b0f7ff"
            strokeWidth="1"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: phase === "aim" ? 0.25 : 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          />

          {/* Motion streak while flying */}
          {phase === "throw" && (
            <motion.line
              x1={THROW.from.x}
              y1={THROW.from.y}
              x2={BULLSEYE.x}
              y2={BULLSEYE.y}
              stroke="url(#streak)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.8 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            />
          )}

          {/* The dart — translate outer, rotate inner so tip stays on bullseye */}
          <motion.g
            initial={{
              x: THROW.from.x,
              y: THROW.from.y,
              opacity: 0,
              scale: 0.85,
            }}
            animate={
              phase === "aim"
                ? {
                    x: THROW.from.x,
                    y: THROW.from.y,
                    opacity: 1,
                    scale: 1,
                  }
                : {
                    x: THROW.to.x,
                    y: THROW.to.y,
                    opacity: 1,
                    scale: 1,
                  }
            }
            transition={
              phase === "throw"
                ? { duration: 0.55, ease: [0.15, 0.85, 0.25, 1] }
                : { duration: 0.35, ease: "easeOut" }
            }
          >
            <g transform={`rotate(${THROW.rotate})`}>
              <DartShape />
            </g>
          </motion.g>

          {/* Impact */}
          {phase === "hit" && (
            <>
              <motion.circle
                cx={BULLSEYE.x}
                cy={BULLSEYE.y}
                r="7"
                fill="#b0f7ff"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 0.35 }}
              />
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={BULLSEYE.x}
                  cy={BULLSEYE.y}
                  r="8"
                  fill="none"
                  stroke="#b0f7ff"
                  strokeWidth={2 - i * 0.4}
                  initial={{ scale: 0.4, opacity: 0.85 }}
                  animate={{ scale: 5 + i * 2.5, opacity: 0 }}
                  transition={{ duration: 0.85, delay: i * 0.12, ease: "easeOut" }}
                />
              ))}
            </>
          )}

          <defs>
            <linearGradient id="streak" x1={THROW.from.x} y1={THROW.from.y} x2={BULLSEYE.x} y2={BULLSEYE.y}>
              <stop offset="0%" stopColor="transparent" />
              <stop offset="60%" stopColor="#b0f7ff66" />
              <stop offset="100%" stopColor="#b0f7ff" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="relative mt-10 flex w-64 flex-col items-center gap-3">
        <div className="flex w-full justify-between text-xs tracking-wide text-fog">
          <span className="font-semibold text-paper">DevDart</span>
          <span className="text-dart tabular-nums">{count}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-dart" style={{ width: `${count}%` }} />
        </div>
        <span className="text-xs text-fog">{status}</span>
      </div>
    </motion.div>
  );
}
