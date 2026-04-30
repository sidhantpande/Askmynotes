"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Hero() {
    const canvasRef = useRef(null);
    const coverRightRef = useRef(null);
    const penRef = useRef(null);
    const shadowRef = useRef(null);
    const [typewriterText, setTypewriterText] = useState("");
    const [showCaret, setShowCaret] = useState(true);

    // Typewriter effect
    useEffect(() => {
        const fullText = "subject-scoped AI.";
        let i = 0;
        const interval = setInterval(() => {
            setTypewriterText(fullText.substring(0, i));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Canvas particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`;
                ctx.fill();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Notebook scroll animation
    useEffect(() => {
        const handleScroll = () => {
            const hero = document.getElementById("hero");
            if (!hero || !coverRightRef.current) return;
            const rect = hero.getBoundingClientRect();
            const heroH = rect.height;
            const progress = Math.max(0, Math.min(1, -rect.top / (heroH * 0.6)));

            const angle = progress * -65;
            coverRightRef.current.style.transform = `perspective(600px) rotateY(${angle}deg)`;

            if (penRef.current) {
                const liftY = progress * -30;
                const liftX = progress * 20;
                const penRot = progress * -15;
                penRef.current.style.transform = `translate(${liftX}px, ${liftY}px) rotate(${penRot}deg)`;
                penRef.current.style.animation = progress > 0.05 ? "none" : "";
            }

            if (shadowRef.current) {
                shadowRef.current.setAttribute("rx", (160 + progress * 20).toString());
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section className="hero-section" id="hero">
            <canvas ref={canvasRef} className="hero-particles" />
            <div className="hero-gradient-orb orb-1" />
            <div className="hero-gradient-orb orb-2" />
            <div className="hero-gradient-orb orb-3" />

            <div className="container hero-inner">
                <div className="hero-text">
                    <div className="hero-badge fade-up in">
                        <span className="badge-dot" />
                        Subject-Scoped AI is here
                    </div>
                    <h1 className="hero-headline fade-up in" style={{ transitionDelay: "100ms" }}>
                        Stop asking general AI.<br />
                        Ask your <span className="gradient-text">{typewriterText}</span>
                        <span className="typewriter-caret" />
                    </h1>
                    <p className="hero-sub fade-up in" style={{ transitionDelay: "200ms" }}>
                        The AI tutor that actually knows your curriculum.
                        <br />No hallucinations. No guessing. Only <strong>your knowledge</strong>.
                    </p>
                    <div className="hero-ctas fade-up in" style={{ transitionDelay: "300ms" }}>
                        <Link href="/auth" className="btn-primary btn-large">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Start Studying Smart
                        </Link>
                        <a href="#solution" className="btn-ghost btn-large">
                            See How It Works
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                        </a>
                    </div>
                    <p className="hero-tagline fade-up in" style={{ transitionDelay: "400ms" }}>
                        Trusted by 5,000+ students from top universities.
                    </p>

                    <div className="hero-stats fade-up in" style={{ transitionDelay: "500ms" }}>
                        <div className="stat">
                            <span className="stat-num">98%</span>
                            <span className="stat-label">Accuracy</span>
                        </div>
                        <div className="stat-div" />
                        <div className="stat">
                            <span className="stat-num">50k+</span>
                            <span className="stat-label">Notes Uploaded</span>
                        </div>
                        <div className="stat-div" />
                        <div className="stat">
                            <span className="stat-num">24/7</span>
                            <span className="stat-label">Tutor Support</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual fade-up in" style={{ transitionDelay: "400ms" }}>
                    <div className="notebook-container" id="notebookContainer">
                        <svg
                            className="notebook-svg"
                            id="notebookSvg"
                            viewBox="0 0 400 320"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <ellipse ref={shadowRef} cx="200" cy="305" rx="160" ry="10" fill="rgba(0,0,0,0.15)" className="nb-shadow" />
                            <rect x="190" y="30" width="20" height="250" rx="2" fill="#5B21B6" className="nb-spine" />
                            <g className="nb-cover-left" id="nbCoverLeft">
                                <rect x="30" y="30" width="170" height="250" rx="8" fill="#7C3AED" />
                                <rect x="38" y="38" width="154" height="234" rx="4" fill="#6D28D9" opacity="0.6" />
                                <line x1="55" y1="80" x2="165" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="55" y1="100" x2="145" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="55" y1="120" x2="158" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="55" y1="140" x2="135" y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="55" y1="160" x2="155" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="55" y1="180" x2="140" y2="180" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <text x="55" y="65" fill="rgba(255,255,255,0.5)" fontFamily="Outfit" fontSize="14" fontWeight="600">Physics Notes</text>
                            </g>
                            <g ref={coverRightRef} className="nb-cover-right" id="nbCoverRight">
                                <rect x="200" y="30" width="170" height="250" rx="8" fill="#8B5CF6" />
                                <rect x="208" y="38" width="154" height="234" rx="4" fill="#7C3AED" opacity="0.6" />
                                <line x1="225" y1="80" x2="345" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="225" y1="100" x2="330" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="225" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="225" y1="140" x2="310" y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="225" y1="160" x2="338" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <line x1="225" y1="180" x2="325" y2="180" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <text x="225" y="65" fill="rgba(255,255,255,0.5)" fontFamily="Outfit" fontSize="14" fontWeight="600">Chapter 3 · Forces</text>
                                <polygon points="340,30 360,30 360,70 350,60 340,70" fill="#FBBF24" />
                            </g>
                            <g ref={penRef} className="nb-pen" id="nbPen">
                                <line x1="310" y1="200" x2="370" y2="80" stroke="#F472B6" strokeWidth="5" strokeLinecap="round" />
                                <line x1="370" y1="80" x2="375" y2="70" stroke="#1A0A3C" strokeWidth="4" strokeLinecap="round" />
                                <circle cx="310" cy="200" r="2" fill="#F472B6" />
                            </g>
                        </svg>
                        <div className="floating-card card-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                            <span>Cited answer found!</span>
                        </div>
                        <div className="floating-card card-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            <span>High Confidence</span>
                        </div>
                        <div className="floating-card card-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F472B6" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            <span>Physics_notes.pdf · P.12</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="scroll-indicator">
                <span>Scroll Discovery</span>
                <div className="scroll-dot" />
            </div>
        </section>
    );
}
