import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Work from "./components/Work.jsx";
import Services from "./components/Services.jsx";
import Process from "./components/Process.jsx";
import Faq from "./components/Faq.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import useTheme from "./hooks/useTheme.js";
import { BookingProvider } from "./booking/BookingContext.jsx";
import BookingModal from "./booking/BookingModal.jsx";
import AdminPanel from "./admin/AdminPanel.jsx";

// tiny hash router — "#/admin" shows the admin panel, everything else the site
function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(
    () => window.location.hash.replace(/^#/, "").startsWith("/admin")
  );
  useEffect(() => {
    const onHash = () =>
      setIsAdmin(window.location.hash.replace(/^#/, "").startsWith("/admin"));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return isAdmin;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const isAdmin = useIsAdminRoute();

  if (isAdmin) return <AdminPanel />;

  return (
    <BookingProvider>
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main>
        <Hero />
        <Work />
        <Services />
        <Process />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <BookingModal />
    </BookingProvider>
  );
}
