import { useEffect, useRef } from "react";

const CURSOR_REPEL_RADIUS = 120;

export default function LiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // lighter field on phones: far fewer O(n^2) link checks
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const PARTICLE_COUNT = isMobile ? 26 : 68;
    const LINK_DISTANCE = isMobile ? 88 : 118;

    let width = 0;
    let height = 0;
    let rafId = 0;
    const mouse = { x: -9999, y: -9999 };

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00055,
      vy: (Math.random() - 0.5) * 0.00055,
      r: 0.9 + Math.random() * 1.35,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const positions = [];
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;

        let px = p.x * width;
        let py = p.y * height;

        const dxm = px - mouse.x;
        const dym = py - mouse.y;
        const md = Math.hypot(dxm, dym);
        if (md < CURSOR_REPEL_RADIUS) {
          const force = (CURSOR_REPEL_RADIUS - md) / CURSOR_REPEL_RADIUS;
          px += (dxm / (md || 1)) * force * 18;
          py += (dym / (md || 1)) * force * 18;
        }

        positions.push({ x: px, y: py, r: p.r });
      }

      // keep the central reading area calmer
      const centerSafe = {
        x1: width * 0.25,
        x2: width * 0.75,
      };

      for (let i = 0; i < positions.length; i += 1) {
        const a = positions[i];
        for (let j = i + 1; j < positions.length; j += 1) {
          const b = positions[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > LINK_DISTANCE) continue;

          const alpha = (1 - d / LINK_DISTANCE) * 0.26;
          const midX = (a.x + b.x) * 0.5;
          const damp = midX > centerSafe.x1 && midX < centerSafe.x2 ? 0.28 : 1;

          ctx.strokeStyle = `rgba(176, 247, 255, ${alpha * damp})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of positions) {
        const inCenter = p.x > centerSafe.x1 && p.x < centerSafe.x2;
        ctx.fillStyle = inCenter ? "rgba(176,247,255,0.22)" : "rgba(176,247,255,0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    tick();
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(176,247,255,0.12),transparent_44%)]" />
    </div>
  );
}
