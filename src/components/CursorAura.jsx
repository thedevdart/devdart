import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function CursorAura() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.35 });

  useEffect(() => {
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-20 hidden h-42 w-42 rounded-full bg-[radial-gradient(circle,rgba(176,247,255,0.28),rgba(176,247,255,0.08)_45%,transparent_70%)] blur-md lg:block"
        style={{ left: sx, top: sy, x: "-50%", y: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-20 hidden h-8 w-8 rounded-full border border-dart/50 lg:block"
        style={{ left: sx, top: sy, x: "-50%", y: "-50%" }}
      />
    </>
  );
}
