"use client";

import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-glow" />
            <div className="container">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <Link href="/" className="nav-logo footer-logo">
                            <div className="logo-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="32" height="32" rx="8" fill="url(#grad-footer)" />
                                    <defs>
                                        <linearGradient id="grad-footer" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#7C3AED" />
                                            <stop offset="1" stopColor="#F472B6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <span className="logo-text">AskMyNotes</span>
                        </Link>
                        <p>The AI study copilot that stays within the scope of your actual curriculum. Built for students who demand precision.</p>
                        <div className="footer-hackathon">
                            <span style={{ fontSize: "1.1rem" }}>🏆</span>
                            Built for the Future of Learning
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#hero">Overview</a>
                            <a href="#features">Features</a>
                            <a href="#roadmap">Roadmap</a>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <Link href="/auth">Sign In</Link>
                            <Link href="/auth#signup">Sign Up</Link>
                            <a href="#">Support</a>
                        </div>
                        <div className="footer-col">
                            <h4>Legal</h4>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Security</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 AskMyNotes. All rights reserved. Your data is private and never used to train LLMs.</p>
                </div>
            </div>
        </footer>
    );
}
