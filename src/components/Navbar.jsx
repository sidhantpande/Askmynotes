"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { getSafeUser } from "@/utils/supabase/auth";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === "undefined") return true;
        return localStorage.getItem("theme") !== "light";
    });
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);

            // Section tracking
            const sections = ["hero", "problem", "solution", "chat-preview", "why-different", "roadmap"];
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        // Check session
        const checkUser = async () => {
            const { user } = await getSafeUser();
            setUser(user);
        };
        checkUser();

        // Listen for auth changes
        let subscription = null;
        (async () => {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (!session?.user) {
                    const { user } = await getSafeUser();
                    setUser(user);
                    return;
                }
                setUser(session.user);
            });
            subscription = data.subscription;
        })();

        if (typeof window !== "undefined" && localStorage.getItem("theme") === "light") {
            document.body.classList.add("light-mode");
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription?.unsubscribe();
        };
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.body.classList.remove("light-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.add("light-mode");
            localStorage.setItem("theme", "light");
        }
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <nav id="navbar" className={scrolled ? "scrolled" : ""}>
            <div className="nav-inner">
                <Link href="/" className="nav-logo">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="10" fill="url(#nav-grad-logo)" />
                            <path d="M10 12h12M10 16h8M10 20h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="nav-grad-logo" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#7C3AED" />
                                    <stop offset="1" stopColor="#A78BFA" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">AskMyNotes</span>
                </Link>

                <div className="nav-links">
                    {[
                        { id: "hero", label: "Home" },
                        { id: "solution", label: "Solution" },
                        { id: "why-different", label: "Intelligence" },
                        { id: "roadmap", label: "Vision" },
                    ].map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            className={`nav-link ${activeSection === link.id ? "active" : ""}`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="nav-actions">
                    <button
                        className="dark-toggle"
                        aria-label="Toggle theme"
                        onClick={toggleDarkMode}
                    >
                        {isDarkMode ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        )}
                    </button>

                    <div className="nav-divider" />

                    {user ? (
                        <>
                            <Link href="/dashboard" className="nav-link" style={{ fontWeight: 600 }}>
                                Dashboard
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => signOut()}
                                className="btn-primary"
                                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                            >
                                Sign Out
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth" className="nav-link" style={{ fontWeight: 600 }}>
                                Sign In
                            </Link>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link href="/auth#signup" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                    Join Now
                                </Link>
                            </motion.div>
                        </>
                    )}
                </div>

                <button
                    className="mobile-menu-btn"
                    onClick={toggleMobileMenu}
                >
                    <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
                        <span />
                        <span />
                    </div>
                </button>
            </div>

            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu">
                {[
                    { id: "hero", label: "Home" },
                    { id: "problem", label: "Problem" },
                    { id: "solution", label: "Solution" },
                    { id: "chat-preview", label: "Preview" },
                    { id: "why-different", label: "Why Us" },
                    { id: "roadmap", label: "Roadmap" },
                ].map((link) => (
                    <a
                        key={link.id}
                        href={`#${link.id}`}
                        className="mobile-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        {link.label}
                    </a>
                ))}
                {user ? (
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="mobile-link" style={{ textAlign: "left", background: "none", border: "none", padding: "12px 0", color: "inherit", cursor: "pointer" }}>Sign Out</button>
                ) : (
                    <>
                        <Link href="/auth" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                        <Link
                            href="/auth#signup"
                            className="btn-primary"
                            style={{ textAlign: "center" }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
