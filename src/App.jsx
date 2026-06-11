import { useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import Preloader from "./components/Preloader.jsx";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import Services from "./components/Services.jsx";
import Process from "./components/Process.jsx";
import Work from "./components/Work.jsx";
import Pricing from "./components/Pricing.jsx";
import Faq from "./components/Faq.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import LiveBackground from "./components/LiveBackground.jsx";
import CursorAura from "./components/CursorAura.jsx";
import JourneyNav from "./components/JourneyNav.jsx";
import SceneSection from "./components/SceneSection.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <div className="noise bg-surface relative min-h-screen text-paper">
      <LiveBackground />
      <CursorAura />
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {/* scroll progress hairline */}
      <motion.div
        className="fixed inset-x-0 top-0 z-80 h-px origin-left bg-dart"
        style={{ scaleX: progress }}
      />

      {!loading && (
        <div className="relative z-10">
          <JourneyNav />
          <Navbar />
          <main>
            <SceneSection variant="rise">
              <Hero />
            </SceneSection>
            <Marquee />
            <SceneSection variant="swingRight">
              <Services />
            </SceneSection>
            <SceneSection variant="float">
              <Process />
            </SceneSection>
            <SceneSection variant="swingLeft">
              <Work />
            </SceneSection>
            <SceneSection variant="zoom">
              <Pricing />
            </SceneSection>
            <SceneSection variant="rise">
              <Faq />
            </SceneSection>
            <SceneSection variant="float">
              <Contact />
            </SceneSection>
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}
