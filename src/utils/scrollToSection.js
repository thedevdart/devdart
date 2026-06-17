const NAV_OFFSET = 88;

export function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function handleSectionClick(event, id) {
  event.preventDefault();
  scrollToSection(id);
}
