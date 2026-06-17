import { motion } from "framer-motion";
import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

const CONTACTS = [
  {
    label: "Email",
    value: "team@devdart.in",
    href: "mailto:team@devdart.in?subject=Project%20inquiry",
    description: "Share your project details and we'll get back with a quote as soon as possible.",
  },
  {
    label: "Instagram",
    value: "@thedevdart",
    href: "https://instagram.com/thedevdart",
    description: "Follow our work, behind-the-scenes, and client launches.",
    external: true,
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-dart/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <SectionTag label="Contact" />
        <SectionTitle className="mx-auto">Tell us about your project.</SectionTitle>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-fog md:text-base">
            Email us the details of what you're building and we'll get back with a quote as soon as possible.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {CONTACTS.map((item, i) => (
            <Reveal key={item.label} delay={0.2 + i * 0.08}>
              <motion.a
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group flex h-full flex-col rounded-xl border border-line bg-ink/60 p-6 text-left transition-colors hover:border-dart/40 hover:bg-dart/5"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
              >
                <span className="text-xs font-semibold tracking-[0.15em] text-dart uppercase">{item.label}</span>
                <span className="mt-3 text-lg font-semibold tracking-tight text-paper transition-colors group-hover:text-dart">
                  {item.value}
                </span>
                <span className="mt-2 text-sm leading-relaxed text-fog">{item.description}</span>
              </motion.a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
