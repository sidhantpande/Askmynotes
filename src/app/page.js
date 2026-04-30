"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import ChatPreview from "@/components/ChatPreview";
import StudyMode from "@/components/StudyMode";
import WhyDifferent from "@/components/WhyDifferent";
import TechArchitecture from "@/components/TechArchitecture";
import Roadmap from "@/components/Roadmap";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import DemoModal from "@/components/DemoModal";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Theme initialization
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
    }
  }, []);

  if (!mounted) {
    return (
      <div style={{ background: "#08050F", minHeight: "100vh" }} />
    );
  }

  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <ChatPreview />
        <StudyMode />
        <WhyDifferent />
        <TechArchitecture />
        <Roadmap />
      </main>
      <Footer />

      {/* Demo FAB */}
      <button
        className="demo-fab"
        onClick={() => setIsModalOpen(true)}
        aria-label="Try Demo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        Try Demo
      </button>

      <DemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
