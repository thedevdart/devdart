import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/*  A soft accent glow + a crisp ring that trail the pointer.
    Desktop / fine-pointer only, and disabled under reduced-motion.
    Colors come from the theme tokens so it adapts to light & dark.   */

function useFinePointer() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setOk(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return ok;
}

export default function CursorAura() {
  const reduce = useReducedMotion();
  const finePointer = useFinePointer();

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  // ring tracks tightly; glow lags a touch for a trailing feel
  const ringX = useSpring(x, { stiffness: 320, damping: 30, mass: 0.3 });
  const ringY = useSpring(y, { stiffness: 320, damping: 30, mass: 0.3 });
  const glowX = useSpring(x, { stiffness: 150, damping: 24, mass: 0.5 });
  const glowY = useSpring(y, { stiffness: 150, damping: 24, mass: 0.5 });

  useEffect(() => {
    if (!finePointer || reduce) return;
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, finePointer, reduce]);

  if (!finePointer || reduce) return null;

  // position via left/top (motion springs); center on the point via x/y = -50%
  const base = {
    position: "fixed",
    x: "-50%",
    y: "-50%",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 95,
  };

  return (
    <>
      {/* soft glow */}
      <motion.div
        aria-hidden="true"
        style={{
          ...base,
          left: glowX,
          top: glowY,
          width: 168,
          height: 168,
          filter: "blur(8px)",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 28%, transparent), color-mix(in srgb, var(--color-accent) 8%, transparent) 45%, transparent 70%)",
        }}
      />
      {/* ring */}
      <motion.div
        aria-hidden="true"
        style={{
          ...base,
          left: ringX,
          top: ringY,
          width: 30,
          height: 30,
          border: "1px solid color-mix(in srgb, var(--color-accent) 55%, transparent)",
        }}
      />
    </>
  );
}
