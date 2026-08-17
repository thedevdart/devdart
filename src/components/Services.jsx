import { Marks, Kicker, Reveal, Icon } from "./ui.jsx";

const ROWS = [
  {
    n: "01",
    Icon: Icon.Monitor,
    title: "Websites",
    desc:
      "Professional sites that look great on every device, show up on Google, and turn visitors into customers. Built for your brand — not from a template.",
  },
  {
    n: "02",
    Icon: Icon.Dashboard,
    title: "Business tools",
    desc:
      "Custom dashboards, order trackers, and admin panels built around how your team actually works. Replace spreadsheets with something your staff will love using.",
  },
  {
    n: "03",
    Icon: Icon.Workflow,
    title: "Automation",
    desc:
      "Stop doing the same tasks by hand. We connect your tools so invoices, reports and notifications run automatically — saving hours every week.",
  },
  {
    n: "04",
    Icon: Icon.Server,
    title: "Hosting & care",
    desc:
      "We host your site, keep it secure, fix problems, and make updates whenever you need them. You never have to think about servers or downtime.",
  },
];

const metaCell = {
  borderLeft: "1px solid var(--color-divider)",
  padding: "12px 24px",
  fontSize: 13,
  lineHeight: "24px",
  letterSpacing: ".08em",
  textTransform: "uppercase",
  fontWeight: 600,
  whiteSpace: "nowrap",
  color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
  fontFeatureSettings: "'tnum' 1",
};

export default function Services() {
  return (
    <section
      id="services"
      style={{ borderTop: "1px solid var(--color-divider)", background: "var(--color-surface)" }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "88px clamp(20px,5vw,72px)" }}>
        <Reveal>
          <Kicker>02 · What we do</Kicker>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".01em",
              fontSize: "clamp(32px,4vw,56px)",
              lineHeight: 1.02,
              margin: 0,
              maxWidth: "24ch",
            }}
          >
            Everything your business needs online,{" "}
            <span style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
              in one place.
            </span>
          </h2>
        </Reveal>

        {/* the drawn plate */}
        <Reveal className="blueprint" style={{ marginTop: 52 }}>
          <Marks />
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "stretch",
              borderBottom: "1px solid var(--color-divider)",
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: "16ch",
                padding: "12px 24px",
                fontSize: 13,
                lineHeight: "24px",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              DevDart — service schedule
            </span>
            <span style={metaCell}>Rev A</span>
            <span style={metaCell}>04 items</span>
          </header>

          {ROWS.map((row, i) => (
            <div
              key={row.n}
              className="dd-svc-row"
              style={{
                display: "grid",
                gridTemplateColumns: "84px 56px 1fr",
                gap: "0 20px",
                alignItems: "start",
                padding: "26px 24px",
                borderBottom: i < ROWS.length - 1 ? "1px solid var(--color-divider)" : "none",
                transition: "background .3s",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: ".1em",
                  fontWeight: 600,
                  color: "var(--accent-text)",
                  fontFeatureSettings: "'tnum' 1",
                }}
              >
                {row.n}
              </span>
              <span className="dd-svc-icon" style={{ display: "inline-flex", color: "var(--color-accent)" }}>
                <row.Icon />
              </span>
              <div>
                <h3
                  className="dd-svc-title"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: ".01em",
                    fontSize: 27,
                    margin: 0,
                    transition: "color .3s",
                  }}
                >
                  {row.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    margin: "8px 0 0",
                    maxWidth: "64ch",
                    color: "color-mix(in srgb, var(--color-text) 76%, transparent)",
                  }}
                >
                  {row.desc}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
