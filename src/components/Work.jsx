import { Marks, Kicker, Reveal } from "./ui.jsx";

const CASES = [
  {
    fig: "Fig. 01",
    name: "Spilo",
    url: "https://www.spilo.in/",
    img: "/projects/spilo-home.png",
    alt: "Spilo homepage",
    desc:
      "A premium, small-batch food brand specializing in handcrafted chilli oils — natural, preservative-free products designed to add heat, texture and flavour to any dish.",
    tags: ["Brand site", "E-commerce", "Hosting"],
    imageLeft: true,
  },
  {
    fig: "Fig. 02",
    name: "Jalaram Computers",
    url: "https://www.jalaramcomputers.com/",
    img: "/projects/jalaram-splash.png",
    alt: "Jalaram Computers splash screen",
    desc:
      "A comprehensive IT solutions provider and retailer — hardware, enterprise networking, CCTV installation, and expert repair for both hardware and software.",
    tags: ["Business site", "Service catalog", "Maintenance"],
    imageLeft: false,
  },
];

function Figure({ c }) {
  return (
    <figure className="dd-case-fig blueprint" style={{ margin: 0, overflow: "hidden" }}>
      <Marks />
      <img
        className="dd-case-img"
        src={c.img}
        alt={c.alt}
        loading="lazy"
        style={{
          width: "100%",
          aspectRatio: "16 / 11",
          objectFit: "cover",
          objectPosition: "top",
          transition: "transform .7s cubic-bezier(.21,.6,.35,1)",
        }}
      />
    </figure>
  );
}

function Copy({ c }) {
  return (
    <div className="dd-case-copy">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--accent-text)",
            fontFeatureSettings: "'tnum' 1",
          }}
        >
          {c.fig}
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 52%, transparent)",
          }}
        >
          Live project
        </span>
      </div>
      <h3
        className="dd-case-name"
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".01em",
          fontSize: "clamp(28px,3vw,40px)",
          margin: "18px 0 0",
          transition: "color .3s",
        }}
      >
        {c.name}
      </h3>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          margin: "14px 0 0",
          maxWidth: "44ch",
          color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
        }}
      >
        {c.desc}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        {c.tags.map((t) => (
          <span
            key={t}
            style={{
              border: "1px solid var(--color-divider)",
              padding: "4px 11px",
              fontSize: 11,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <span
        className="dd-case-go"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          marginTop: 26,
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--accent-text)",
          transition: "gap .3s",
        }}
      >
        Visit site <span aria-hidden="true">→</span>
      </span>
    </div>
  );
}

export default function Work() {
  return (
    <section id="work" style={{ borderTop: "1px solid var(--color-divider)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "88px clamp(20px,5vw,72px)" }}>
        <Reveal
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div>
            <Kicker>01 · Selected work</Kicker>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".01em",
                fontSize: "clamp(32px,4vw,56px)",
                lineHeight: 1.02,
                margin: 0,
                maxWidth: "22ch",
              }}
            >
              Real results for{" "}
              <span style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
                real businesses.
              </span>
            </h2>
          </div>
          <p
            style={{
              maxWidth: "28ch",
              fontSize: 14,
              lineHeight: 1.6,
              color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
            }}
          >
            Two live projects we can point to right now — built, hosted and maintained by us.
          </p>
        </Reveal>

        {CASES.map((c, i) => (
          <Reveal
            key={c.name}
            as="a"
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="dd-case dd-case-row"
            style={{
              display: "grid",
              gridTemplateColumns: c.imageLeft
                ? "minmax(0, 7fr) minmax(0, 5fr)"
                : "minmax(0, 5fr) minmax(0, 7fr)",
              gap: "clamp(28px,5vw,72px)",
              alignItems: "center",
              marginTop: i === 0 ? 64 : "clamp(56px,7vw,96px)",
              color: "var(--color-text)",
            }}
          >
            {c.imageLeft ? (
              <>
                <Figure c={c} />
                <Copy c={c} />
              </>
            ) : (
              <>
                <Copy c={c} />
                <Figure c={c} />
              </>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
