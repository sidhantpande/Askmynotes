"use client";

import ScrollReveal from "./ScrollReveal";

export default function Roadmap() {
    const items = [
        {
            phase: "Phase 1: Foundation",
            status: "current",
            dotClass: "active-dot",
            title: "Subject-Scoped RAG",
            desc: "Core engine release with multi-PDF indexing, subject isolation, and basic citation logic.",
            features: ["PDF Indexing", "Subject Clusters", "Source Citations"]
        },
        {
            phase: "Phase 2: Active Recall",
            status: "upcoming",
            dotClass: "upcoming-dot",
            title: "Self-Assessment Engine",
            desc: "Automatic generation of MCQs, flashcards, and short-answer questions from uploaded materials.",
            features: ["AI Questions", "Progress Tracking", "Spaced Repetition"]
        },
        {
            phase: "Phase 3: Deep Context",
            status: "future",
            dotClass: "future-dot",
            title: "Cross-Subject Synthesis",
            desc: "Identifying relationships between different subjects and generating comprehensive study guides.",
            features: ["Subject Linking", "Master Guides", "Mind Maps"]
        },
        {
            phase: "Phase 4: Collaborative",
            status: "future2",
            dotClass: "future-dot",
            title: "Study Groups & Peer Review",
            desc: "Share subjects with classmates, collaborate on notes, and verify AI findings together.",
            features: ["Shared Clusters", "Peer Citations", "Live QA"]
        }
    ];

    return (
        <section className="section section-roadmap" id="roadmap">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">Roadmap</div>
                    <h2 className="section-title">The future of<br />autonomous learning.</h2>
                    <p className="section-sub">We're building the infrastructure for a world where AI doesn't think for you, but learns with you.</p>
                </ScrollReveal>

                <div className="timeline">
                    {items.map((item, i) => (
                        <div key={i} className="timeline-item">
                            <div className={`timeline-dot ${item.dotClass}`} />
                            <ScrollReveal type="reveal-right" delay={i * 100}>
                                <div className="timeline-content glass-card">
                                    <div className={`phase-tag ${item.status}`}>{item.phase}</div>
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                    <div className="phase-features">
                                        {item.features.map((f, j) => <span key={j}>{f}</span>)}
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
