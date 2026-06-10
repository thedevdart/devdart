const ITEMS = [
  "Business websites",
  "Online stores",
  "Booking systems",
  "Client portals",
  "Internal dashboards",
  "Invoice automation",
  "Lead capture pages",
  "Member areas",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section className="border-y border-line bg-violet/15 py-4 backdrop-blur-sm" aria-label="What we build">
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-10">
          {row.map((item, i) => (
            <span key={i} className="flex items-center gap-10 text-sm text-fog/80">
              <span className="transition-colors hover:text-dart">{item}</span>
              <span className="text-dart/50">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
