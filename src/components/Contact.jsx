import { Marks, Reveal } from "./ui.jsx";
import { useBooking } from "../booking/BookingContext.jsx";

const CARDS = [
  {
    label: "Email",
    value: "team@devdart.in",
    desc: "Share your project details and we'll get back with a quote.",
    href: "mailto:team@devdart.in?subject=Project%20inquiry",
    external: false,
  },
  {
    label: "Instagram",
    value: "@thedevdart",
    desc: "Follow our work, behind-the-scenes and client launches.",
    href: "https://instagram.com/thedevdart",
    external: true,
  },
];

const markColor = "color-mix(in srgb, var(--invert-text) 45%, transparent)";

export default function Contact() {
  const { openBooking } = useBooking();
  return (
    <section
      id="contact"
      style={{
        borderTop: "1px solid var(--color-divider)",
        background: "var(--invert-bg)",
        color: "var(--invert-text)",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "104px clamp(20px,5vw,72px)",
          textAlign: "center",
        }}
      >
        <Reveal>
          <span
            style={{
              display: "block",
              fontSize: 13,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--invert-accent)",
            }}
          >
            Ready to get started?
          </span>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".01em",
              lineHeight: 1.02,
              fontSize: "clamp(38px,6vw,84px)",
              margin: "24px auto 0",
              maxWidth: "15ch",
            }}
          >
            Let's build something{" "}
            <span style={{ color: "var(--invert-accent)" }}>your business deserves.</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              margin: "26px auto 0",
              maxWidth: "52ch",
              color: "color-mix(in srgb, var(--invert-text) 72%, transparent)",
            }}
          >
            Book a free 30-minute call — pick a time that suits you and we'll talk
            through what you're building. Prefer email? Reach us below.
          </p>
          <button
            type="button"
            onClick={openBooking}
            className="btn"
            style={{
              marginTop: 30,
              background: "var(--invert-accent)",
              color: "var(--invert-bg)",
              borderColor: "var(--invert-accent)",
            }}
          >
            Book a free call
          </button>
        </Reveal>

        <Reveal
          className="dd-contact-grid"
          delay={0.09}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 48,
            textAlign: "left",
          }}
        >
          {CARDS.map((card) => (
            <a
              key={card.label}
              className="dd-contact blueprint"
              href={card.href}
              {...(card.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              style={{
                display: "block",
                border: "1px solid color-mix(in srgb, var(--invert-text) 24%, transparent)",
                padding: 26,
                color: "var(--invert-text)",
                transition: "background .3s, border-color .3s",
              }}
            >
              <Marks color={markColor} />
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--invert-accent)",
                }}
              >
                {card.label}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: 24,
                  margin: "12px 0 0",
                }}
              >
                {card.value}
              </p>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: "8px 0 0",
                  color: "color-mix(in srgb, var(--invert-text) 66%, transparent)",
                }}
              >
                {card.desc}
              </p>
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
