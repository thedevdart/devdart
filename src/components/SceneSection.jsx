import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import useIsMobile from "../hooks/useIsMobile.js";

/*
 * Scroll-linked 3D stage (desktop) / light reveal (mobile).
 *
 * Desktop: transforms run continuously across the section's pass through the
 * viewport, resting neutral when framed and reversing on scroll-up.
 * Mobile: heavy 3D + x-translate is dropped (it causes jank and horizontal
 * overflow on phones) in favour of a simple, snappy fade-and-rise on enter.
 *
 * Only transform + opacity animate so it stays GPU-cheap everywhere.
 */

export default function SceneSection({ children, variant = "rise", className = "" }) {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.32, 0.68, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [120, 0, -120]);
  const yFloat = useTransform(scrollYProgress, [0, 0.5, 1], [90, 0, -90]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.97]);
  const zoom = useTransform(scrollYProgress, [0, 0.5, 1], [0.78, 1, 1.12]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -20]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.5, 1], [-5, 0, 5]);
  const rotateYLeft = useTransform(scrollYProgress, [0, 0.5, 1], [-26, 0, 20]);
  const rotateYRight = useTransform(scrollYProgress, [0, 0.5, 1], [26, 0, -20]);
  const xLeft = useTransform(scrollYProgress, [0, 0.5, 1], [-160, 0, 110]);
  const xRight = useTransform(scrollYProgress, [0, 0.5, 1], [160, 0, -110]);

  // Mobile: no scroll-bound 3D, just a clean reveal as it enters.
  if (isMobile) {
    return (
      <motion.div
        className={`scene ${className}`}
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
      >
        {children}
      </motion.div>
    );
  }

  const variants = {
    rise: { opacity, y, rotateX, transformPerspective: 1300 },
    swingLeft: { opacity, x: xLeft, rotateY: rotateYLeft, transformPerspective: 1300 },
    swingRight: { opacity, x: xRight, rotateY: rotateYRight, transformPerspective: 1300 },
    zoom: { opacity, scale: zoom, transformPerspective: 1300 },
    float: { opacity, y: yFloat, rotateZ, scale, transformPerspective: 1300 },
  };

  return (
    <div ref={ref} className={`scene ${className}`}>
      <motion.div className="scene-inner" style={variants[variant] ?? variants.rise}>
        {children}
      </motion.div>
    </div>
  );
}
