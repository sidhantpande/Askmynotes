"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/auth/actions";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [user, setUser] = useState(null);

    const supabase = createClient();

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
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Check dark mode
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "light") {
                setIsDarkMode(false);
                document.body.classList.add("light-mode");
            }
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
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
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" rx="8" fill="url(#grad-logo)" />
                            <path d="M9 11C9 10.4477 9.44772 10 10 10H22C22.5523 10 23 10.4477 23 11V21C23 21.5523 22.5523 22 22 22H10C9.44772 22 9 21.5523 9 21V11Z" fill="white" fillOpacity="0.2" />
                            <path d="M13 14H19" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <path d="M13 18H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="grad-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#7C3AED" />
                                    <stop offset="1" stopColor="#F472B6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">AskMyNotes</span>
                </Link>

                <div className="nav-links">
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
                            className={`nav-link ${activeSection === link.id ? "active" : ""}`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="nav-actions">
                    <button
                        id="dark-mode-toggle"
                        className="dark-toggle"
                        aria-label="Toggle dark mode"
                        onClick={toggleDarkMode}
                    >
                        <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                        <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </button>

                    {user ? (
                        <>
                            <Link href="/dashboard" className="btn-ghost nav-auth-btn">
                                Dashboard
                            </Link>
                            <button
                                onClick={async () => {
                                    await signOut();
                                }}
                                className="btn-primary nav-cta"
                                style={{ border: "none", cursor: "pointer" }}
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth" className="btn-ghost nav-auth-btn">
                                Sign In
                            </Link>
                            <Link href="/auth#signup" className="btn-primary nav-cta">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <button
                    className="mobile-menu-btn"
                    id="mobileMenuBtn"
                    aria-label="Open menu"
                    onClick={toggleMobileMenu}
                >
                    <span></span><span></span><span></span>
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
