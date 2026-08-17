import { useEffect, useState } from "react";
import { Icon, LogoMark } from "./ui.jsx";
import { useBooking } from "../booking/BookingContext.jsx";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#faq", label: "FAQ" },
];

const navLinkStyle = {
  color: "color-mix(in srgb, var(--color-text) 76%, transparent)",
  transition: "color .25s ease",
};

export default function Navbar({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === "dark";
  const { openBooking } = useBooking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="ddNav"
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        zIndex: 90,
        background: "color-mix(in srgb, var(--color-bg) 84%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${
          scrolled ? "var(--color-divider)" : "transparent"
        }`,
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
        transition: "border-color .3s ease, box-shadow .3s ease",
      }}
    >
      <nav
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 clamp(20px,5vw,72px)",
          height: 66,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* brand */}
        <a
          href="#top"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: "var(--color-text)",
          }}
        >
          <span style={{ display: "inline-flex", color: "var(--color-accent)" }}>
            <LogoMark size={24} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 21,
              letterSpacing: ".01em",
              textTransform: "uppercase",
            }}
          >
            Dev<span style={{ color: "var(--accent-text)" }}>Dart</span>
          </span>
        </a>

        {/* links */}
        <div
          className="dd-navlinks"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 14,
          }}
        >
          {LINKS.map((l) => (
            <a key={l.href} className="dd-nav" href={l.href} style={navLinkStyle}>
              {l.label}
            </a>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn btn-secondary btn-icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title="Switch theme"
          >
            {isDark ? <Icon.Sun /> : <Icon.Moon />}
          </button>
          <button
            type="button"
            onClick={openBooking}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            Book a free call
          </button>
          <button
            className="dd-burger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "none",
              width: 40,
              height: 40,
              border: "1px solid var(--color-divider)",
              background: "none",
              cursor: "pointer",
              color: "var(--color-text)",
              padding: 0,
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            {menuOpen ? <Icon.Close /> : <Icon.Menu />}
          </button>
        </div>
      </nav>

      {/* mobile dropdown */}
      {menuOpen && (
        <div
          id="ddMobileMenu"
          style={{
            borderTop: "1px solid var(--color-divider)",
            background: "var(--color-bg)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "8px clamp(20px,5vw,72px) 18px",
            }}
          >
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                className="dd-mlink"
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "13px 0",
                  fontSize: 16,
                  color: "color-mix(in srgb, var(--color-text) 82%, transparent)",
                  borderBottom:
                    i < LINKS.length - 1 ? "1px solid var(--color-divider)" : "none",
                }}
              >
                {l.label}
              </a>
            ))}
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setMenuOpen(false);
                openBooking();
              }}
              style={{ marginTop: 14 }}
            >
              Book a free call
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
