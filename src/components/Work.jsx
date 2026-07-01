import { Reveal, SectionTag, SectionTitle } from "./ui.jsx";

const PROJECTS = [
  {
    name: "Spilo",
    href: "https://www.spilo.in/",
    image: "/projects/spilo-home.png",
    alt: "Spilo homepage screenshot",
    badge: "Homepage",
    description: "A premium, small-batch food brand based in Mumbai that specializes in handcrafted chilli oils. Their collection features natural, preservative-free products—including Chilli Crisp, Garlic Crisp, and Onion Smash—designed to add heat, texture, and flavor to a variety of dishes.",
  },
  {
    name: "Jalaram Computers",
    href: "https://www.jalaramcomputers.com/",
    image: "/projects/jalaram-splash.png",
    alt: "Jalaram Computers splash screen",
    badge: "Splash screen",
    description: "A comprehensive IT solutions provider and retailer based in Mumbai. They offer a wide range of hardware (laptops, desktops, printers, accessories) and professional services, including enterprise networking, CCTV installation, and expert repair for both hardware and software issues.",
  },
];

function ProjectCard({ project, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        className="interactive-card group block h-full overflow-hidden rounded-2xl border border-line bg-ink-2/85 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-dart/40"
      >
        <div className="relative overflow-hidden rounded-xl border border-line bg-ink">
          <img
            src={project.image}
            alt={project.alt}
            className="aspect-[4/3] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          <div className="absolute left-3 bottom-3 rounded-full border border-line/80 bg-ink/75 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-dart uppercase backdrop-blur-sm">
            {project.badge}
          </div>
        </div>

        <div className="px-1.5 pt-4 pb-2">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-dart uppercase">
            Live project
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-paper">
            {project.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            {project.description}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-dart transition-transform group-hover:translate-x-0.5">
            Visit site
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </a>
    </Reveal>
  );
}

export default function Work() {
  return (
    <section id="work" className="min-h-screen py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionTag label="Our work" />
            <SectionTitle>
              Real results for <span className="text-fog">real businesses.</span>
            </SectionTitle>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-xs text-sm leading-relaxed text-fog">
              Live homepage screenshots from two projects we can point to right now.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PROJECTS.map((project, index) => (
            <ProjectCard key={project.name} project={project} delay={index * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
