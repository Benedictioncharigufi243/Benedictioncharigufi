import { Suspense, lazy, useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Grain } from "@/components/Grain";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";

// Seule la page d'accueil est dans le bundle initial ; le reste se charge a la demande.
const loadActing = () => import("@/pages/Acting");
const loadScenarios = () => import("@/pages/Scenarios");
const Acting = lazy(loadActing);
const Scenarios = lazy(loadScenarios);
const Admin = lazy(() => import("@/pages/Admin"));
const ChatWidget = lazy(() => import("@/components/ChatWidget").then((m) => ({ default: m.ChatWidget })));

const idle = (fn) =>
  "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1500);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    // Apres le premier affichage : prechargement des pages et du chat, navigation instantanee ensuite.
    idle(() => {
      loadActing();
      loadScenarios();
      setChatReady(true);
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis;
    let raf;
    let dead = false;
    import("lenis").then(({ default: Lenis }) => {
      if (dead) return;
      lenis = new Lenis({ lerp: 0.09 });
      window.__lenis = lenis;
      const loop = (t) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Grain />
          <Nav />
          <Suspense fallback={<div className="min-h-screen bg-ink" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/acting" element={<Acting />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
          <Footer />
          {chatReady && (
            <Suspense fallback={null}>
              <ChatWidget />
            </Suspense>
          )}
          <Toaster theme="dark" position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
