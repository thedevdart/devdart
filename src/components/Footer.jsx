import { LogoMark } from "./ui.jsx";

const COLUMNS = [
  {
    heading: "Services",
    links: [
      { label: "Websites", href: "#services" },
      { label: "Business tools", href: "#services" },
      { label: "Automation", href: "#services" },
      { label: "Hosting & care", href: "#services" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Selected work", href: "#work" },
      { label: "How it works", href: "#process" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "team@devdart.in", href: "mailto:team@devdart.in?subject=Project%20inquiry" },
      {
        label: "@thedevdart",
        href: "https://instagram.com/thedevdart",
        external: true,
      },
    ],
  },
];

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--color-text)",
  margin: "0 0 16px",
};

const listStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 11,
  fontSize: 14,
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-bg)",
        color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
      }}
    >
      <div
        className="dd-footer-grid"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "60px clamp(20px,5vw,72px) 0",
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr 1fr 1fr",
          gap: 32,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: "var(--color-text)",
            }}
          >
            <span style={{ display: "inline-flex", color: "var(--color-accent)" }}>
              <LogoMark size={22} />
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: ".01em",
              }}
            >
              DevDart
            </span>
          </span>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "16px 0 0", maxWidth: "34ch" }}>
            Development with precision. We build, host and maintain websites and business tools —
            end to end.
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              marginTop: 20,
              fontSize: 12,
              letterSpacing: ".04em",
              color: "var(--accent-text)",
            }}
          >
            <span
              style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent)" }}
            />
            Accepting new clients
          </span>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 style={headingStyle}>{col.heading}</h4>
            <ul style={listStyle}>
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{ color: "inherit" }}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px clamp(20px,5vw,72px) 44px" }}>
        <div
          style={{
            borderTop: "1px solid var(--color-divider)",
            paddingTop: 24,
            fontSize: 12,
            letterSpacing: ".02em",
          }}
        >
          DevDart © 2026 — Development with precision.
        </div>
      </div>
    </footer>
  );
}
