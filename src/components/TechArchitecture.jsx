"use client";

import ScrollReveal from "./ScrollReveal";

export default function TechArchitecture() {
    const pipeline = [
        { label: "Data Input", sub: "PDF, Slide, Text", icon: "📥" },
        { arrow: true },
        { label: "RAG Engine", sub: "LangChain", icon: "🧠", highlight: true },
        { arrow: true },
        { label: "Vector DB", sub: "Pinecone", icon: "📌" },
        { arrow: true },
        { label: "AI Response", sub: "GPT-4o + Citations", icon: "🤖" }
    ];

    const chips = [
        "Next.js 15", "React", "Python", "FastAPI", "LangChain", "Pinecone", "PostgreSQL", "GPT-4o", "Vercel"
    ];

    return (
        <section className="section section-tech" id="tech-architecture">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">Tech Stack</div>
                    <h2 className="section-title">Institutional grade<br />AI architecture.</h2>
                    <p className="section-sub">We don't just 'wrap' ChatGPT. We've built a multi-stage RAG (Retrieval Augmented Generation) pipeline for extreme precision.</p>
                </ScrollReveal>

                <div className="arch-pipeline">
                    {pipeline.map((item, i) => (
                        <div key={i} style={{ display: "contents" }}>
                            {item.arrow ? (
                                <div className="arch-arrow">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </div>
                            ) : (
                                <ScrollReveal type="reveal-block" delay={i * 100}>
                                    <div className={`arch-block ${item.highlight ? "highlight-block" : ""}`}>
                                        <div className="arch-icon">{item.icon}</div>
                                        <div className="arch-label">{item.label}</div>
                                        <div className="arch-sub">{item.sub}</div>
                                    </div>
                                </ScrollReveal>
                            )}
                        </div>
                    ))}
                </div>

                <div className="tech-stack-row">
                    {chips.map((chip, i) => (
                        <ScrollReveal key={i} type="reveal" delay={i * 50}>
                            <div className="tech-chip">{chip}</div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
