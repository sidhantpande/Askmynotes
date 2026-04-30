"use client";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./auth.css";
import { signIn, signUp } from "./actions";

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState("signin");
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [strength, setStrength] = useState({ label: "Weak", width: "10%", color: "#EF4444" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Handle hash routing for login/signup
        if (window.location.hash === "#signup") {
            setActiveTab("signup");
        }
    }, []);

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        if (val.length === 0) {
            setStrength({ label: "Weak", width: "10%", color: "#EF4444" });
        } else if (val.length < 6) {
            setStrength({ label: "Weak", width: "30%", color: "#EF4444" });
        } else if (val.length < 10) {
            setStrength({ label: "Good", width: "60%", color: "#FBBF24" });
        } else {
            setStrength({ label: "Strong", width: "100%", color: "#10B981" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const formData = new FormData(e.target);
        const res = activeTab === "signin" ? await signIn(formData) : await signUp(formData);

        if (res?.error) {
            setError(res.error);
        } else if (res?.success) {
            setMessage(res.success);
        }
        setLoading(false);
    };
    const supabase = createClient();

const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Google login error:", error.message);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="hero-gradient-orb orb-1" />
                <div className="hero-gradient-orb orb-2" />
            </div>

            <div className="auth-layout">
                <div className="auth-form-panel">
                    <Link href="/" className="auth-logo">
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
                        <span className="logo-text">AskMyNotes</span>
                    </Link>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
                            onClick={() => setActiveTab("signin")}
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
                            onClick={() => setActiveTab("signup")}
                        >
                            Sign Up
                        </button>
                        <div className="tab-indicator" style={{ left: activeTab === "signin" ? "4px" : "calc(50% - 4px)" }} />
                    </div>

                    <div className="auth-form">
                        <h2 style={{ marginBottom: "8px" }}>{activeTab === "signin" ? "Welcome Back" : "Create Account"}</h2>
                        <p style={{ color: "var(--txt-secondary)", marginBottom: "32px", fontSize: "0.9rem" }}>
                            {activeTab === "signin" ? "Enter your credentials to access your notes." : "Start your journey with subject-scoped study tutor."}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {error && <div style={{ color: "#EF4444", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
                            {message && <div style={{ color: "#10B981", marginBottom: "1rem", fontSize: "0.875rem" }}>{message}</div>}
                            {activeTab === "signup" && (
                                <div className="form-row-2col">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <div className="input-wrapper">
                                            <input type="text" name="firstName" placeholder="John" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <div className="input-wrapper">
                                            <input type="text" name="lastName" placeholder="Doe" required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    <input type="email" name="email" placeholder="name@university.edu" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                                {activeTab === "signup" && password && (
                                    <div className="pw-strength">
                                        <div className="pw-bar"><div className="pw-fill" style={{ width: strength.width, background: strength.color }} /></div>
                                        <span style={{ color: strength.color }}>{strength.label}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <label className="checkbox-label">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className="forgot-link">Forgot password?</a>
                            </div>

                            <button className="btn-primary btn-full" type="submit" disabled={loading}>
                                {loading ? "Processing..." : (activeTab === "signin" ? "Sign In" : "Create Account")}
                            </button>
                        </form>

                        <div className="auth-divider"><span>Or continue with</span></div>

                        <div className="social-btns">
                          <button
  type="button"
  className="social-btn"
  onClick={handleGoogleLogin}
>
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
  Google
</button>
                            <button type="button" className="social-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>
                                GitHub
                            </button>
                        </div>
                    </div>
                </div>

                <div className="auth-showcase">
                    <div className="showcase-content">
                        <div className="showcase-badge">Join the Elite Students</div>
                        <h2>The smarter way to<br />conquer your finals.</h2>
                        <p>Institutional grade AI precision, citation-first answers, and automatic active recall practice.</p>

                        <div className="showcase-features">
                            <div className="showcase-feature">
                                <div className="sf-icon">🛡️</div>
                                <div>
                                    <strong>No Hallucinations</strong><br />
                                    <span>Only grounded knowledge.</span>
                                </div>
                            </div>
                            <div className="showcase-feature">
                                <div className="sf-icon">🎯</div>
                                <div>
                                    <strong>Subject Scoped</strong><br />
                                    <span>Isolated context matters.</span>
                                </div>
                            </div>
                        </div>

                        <div className="showcase-quote">
                            <p>"AskMyNotes saved me during finals. It actually found the formulas from my specific class slides."</p>
                            <div className="quote-author">
                                <div className="quote-avatar">AS</div>
                                <div>
                                    <strong>Alex Smith</strong><br />
                                    <span>Stanford Junior</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
