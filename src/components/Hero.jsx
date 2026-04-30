import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";

export default function Hero() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [typewriterText, setTypewriterText] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

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

    // Mouse tracking for gradient orbs
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
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
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: Math.random() * 0.4 - 0.2,
                speedY: Math.random() * 0.4 - 0.2,
                opacity: Math.random() * 0.4 + 0.1,
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

    return (
        <section className="hero-section" id="hero" ref={containerRef}>
            <canvas ref={canvasRef} className="hero-particles" />
            
            <div 
                className="hero-gradient-orb orb-1" 
                style={{ 
                    left: `${mousePos.x * 0.5}%`, 
                    top: `${mousePos.y * 0.5}%`,
                    transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
                }} 
            />
            <div 
                className="hero-gradient-orb orb-2" 
                style={{ 
                    right: `${100 - mousePos.x * 0.3}%`, 
                    bottom: `${100 - mousePos.y * 0.3}%`,
                    transition: 'all 1s cubic-bezier(0.23, 1, 0.32, 1)'
                }} 
            />

            <motion.div 
                style={{ y, opacity, scale }}
                className="container hero-inner"
            >
                <div className="hero-text">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="hero-badge"
                    >
                        <span className="badge-dot" />
                        Institutional Grade AI Tutor
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="hero-headline"
                    >
                        Stop asking general AI.<br />
                        Ask your <span className="gradient-text">{typewriterText}</span>
                        <span className="typewriter-caret" />
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="hero-sub"
                    >
                        The study assistant that actually knows your specific curriculum.
                        <br />No hallucinations. No guessing. Only <strong>grounded knowledge</strong>.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="hero-ctas"
                    >
                        <Link href="/auth" className="btn-primary btn-large">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Start Studying Free
                        </Link>
                        <a href="#solution" className="btn-ghost btn-large">
                            Watch Tech Demo
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                        </a>
                    </motion.div>
                    <p className="hero-tagline fade-up in" style={{ transitionDelay: "400ms" }}>
                        Trusted by 5,000+ students from top universities.
                    </p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className="hero-visual"
                >
                    <div className="notebook-container">
                        <div className="notebook-main">
                            <div className="notebook-spine" />
                            <div className="notebook-cover-left">
                                <div className="nb-content">
                                    <div className="nb-title">Physics Notes</div>
                                    <div className="nb-lines">
                                        {[...Array(6)].map((_, i) => <div key={i} className="nb-line" />)}
                                    </div>
                                </div>
                            </div>
                            <motion.div 
                                whileHover={{ rotateY: -30 }}
                                className="notebook-cover-right"
                            >
                                <div className="nb-content">
                                    <div className="nb-title">Chapter 3 · Forces</div>
                                    <div className="nb-lines">
                                        {[...Array(6)].map((_, i) => <div key={i} className="nb-line" />)}
                                    </div>
                                    <div className="nb-bookmark" />
                                </div>
                            </motion.div>
                        </div>

                        <motion.div 
                            animate={{ 
                                y: [0, -10, 0],
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity,
                                ease: "easeInOut" 
                            }}
                            className="floating-card card-1"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                            <span>Cited answer found!</span>
                        </motion.div>
                        <motion.div 
                            animate={{ 
                                y: [0, 10, 0],
                            }}
                            transition={{ 
                                duration: 5, 
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                            className="floating-card card-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            <span>98% Confidence</span>
                        </motion.div>
                        <motion.div 
                            animate={{ 
                                y: [0, -8, 0],
                            }}
                            transition={{ 
                                duration: 4.5, 
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                            className="floating-card card-3"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F472B6" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            <span>Sources: P.12-15</span>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="scroll-indicator"
            >
                <span>Discover More</span>
                <motion.div 
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="scroll-dot" 
                />
            </motion.div>
        </section>
    );
}
