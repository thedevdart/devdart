import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Marks, EASE } from "./ui.jsx";

/* task rows — status drives the number square + tag */
const TASKS = [
  {
    n: "✓",
    status: "done",
    title: "Discovery call",
    sub: "Goals, timeline and scope agreed",
  },
  {
    n: "✓",
    status: "done",
    title: "Design preview",
    sub: "Homepage mockup ready for review",
  },
  {
    n: "3",
    status: "active",
    title: "Building your site",
    sub: "Pages, forms and mobile layout in progress",
  },
  {
    n: "4",
    status: "pending",
    title: "Launch & hosting",
    sub: "Domain, security and go-live handled by us",
  },
  {
    n: "5",
    status: "pending",
    title: "Ongoing care",
    sub: "Updates, fixes and improvements every month",
  },
];

const baseOpacity = (s) => (s === "pending" ? 0.72 : 1);

function NumberSquare({ task }) {
  if (task.status === "done") {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        ✓
      </span>
    );
  }
  const active = task.status === "active";
  return (
    <span
      style={{
        width: 22,
        height: 22,
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        color: active
          ? "var(--accent-text)"
          : "color-mix(in srgb, var(--color-text) 55%, transparent)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "var(--font-heading)",
      }}
    >
      {task.n}
    </span>
  );
}

export default function Dashboard() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(() => TASKS.map(() => reduce));
  const [spinning, setSpinning] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (reduce) {
      setShown(TASKS.map(() => true));
      setSpinning(false);
      return undefined;
    }
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const cycle = () => {
      setShown(TASKS.map(() => false));
      setSpinning(true);
      TASKS.forEach((_, i) => {
        later(() => {
          setShown((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
          if (i === TASKS.length - 1) setSpinning(false);
        }, 420 + i * 640);
      });
      later(() => {
        clearAll();
        cycle();
      }, 420 + TASKS.length * 640 + 3400);
    };
    cycle();
    return clearAll;
  }, [reduce]);

  return (
    <div className="blueprint" style={{ position: "relative", background: "var(--color-bg)" }}>
      <Marks />

      {/* header */}
      <header
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: "1px solid var(--color-divider)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <span
          style={{
            flex: 1,
            padding: "12px 18px",
            fontSize: 12,
            lineHeight: "20px",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Your project dashboard
        </span>
        <span
          style={{
            borderLeft: "1px solid var(--color-divider)",
            padding: "12px 16px",
            fontSize: 11,
            lineHeight: "20px",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--accent-text)",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent)",
              animation: reduce ? "none" : "dd-ping 2.2s cubic-bezier(0,0,.2,1) infinite",
            }}
          />
          Live preview
        </span>
      </header>

      {/* scan sweep */}
      {!reduce && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage:
              "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent)",
            backgroundSize: "100% 38%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 -40%",
            animation: "dd-scan 3.6s linear infinite",
          }}
        />
      )}

      {/* body */}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          position: "relative",
          zIndex: 2,
        }}
      >
        {TASKS.map((task, i) => {
          const active = task.status === "active";
          return (
            <motion.div
              key={task.title}
              animate={{
                opacity: shown[i] ? baseOpacity(task.status) : 0,
                x: shown[i] ? 0 : -12,
              }}
              transition={{ duration: 0.44, ease: EASE }}
              style={{
                display: "grid",
                gridTemplateColumns: active ? "22px 1fr auto" : "22px 1fr",
                gap: "0 12px",
                alignItems: "start",
                border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
                background: active
                  ? "color-mix(in srgb, var(--color-accent) 9%, transparent)"
                  : "transparent",
                padding: "12px 13px",
              }}
            >
              <NumberSquare task={task} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{task.title}</p>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    margin: "3px 0 0",
                    color: `color-mix(in srgb, var(--color-text) ${
                      active ? 70 : 62
                    }%, transparent)`,
                  }}
                >
                  {task.sub}
                </p>
              </div>
              {active && (
                <span
                  style={{
                    border: "1px solid var(--color-accent)",
                    padding: "2px 8px",
                    fontSize: 10,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "var(--accent-text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  In progress
                </span>
              )}
            </motion.div>
          );
        })}

        {spinning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "4px 2px 0",
              fontSize: 12,
              color: "color-mix(in srgb, var(--color-text) 58%, transparent)",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                border: "2px solid var(--color-divider)",
                borderTopColor: "var(--color-accent)",
                borderRadius: "50%",
                display: "inline-block",
                animation: "dd-spin .8s linear infinite",
              }}
            />
            Updating your project timeline…
          </div>
        )}
      </div>
    </div>
  );
}
