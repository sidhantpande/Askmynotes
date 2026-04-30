"use client";

import ScrollReveal from "./ScrollReveal";

export default function ProblemSection() {
    const problems = [
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
            iconClass: "icon-red",
            title: "AI Hallucinations",
            desc: "Standard LLMs guess when they don't know, leading to dangerous errors in your study materials.",
            stat: "64% Guess Rate"
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            ),
            iconClass: "icon-orange",
            title: "No Subject Isolation",
            desc: "General AI mixes knowledge from thousands of sources, losing the specific context of your syllabus.",
            stat: "Zero Context"
        },
        {
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            ),
            iconClass: "icon-yellow",
            title: "Zero Transparency",
            desc: "Most AI tools don't tell you where they got the answer, making it impossible to verify facts.",
            stat: "No Citations"
        }
    ];

    return (
        <section className="section section-problem" id="problem">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">The Problem</div>
                    <h2 className="section-title">Why general AI fails<br />for serious studying.</h2>
                    <p className="section-sub">Standard AI tools are built for general conversation, not for passing your midterm exams with precision.</p>
                </ScrollReveal>

                <div className="problem-cards">
                    {problems.map((p, i) => (
                        <ScrollReveal key={i} type="reveal-card" delay={i * 100}>
                            <div className="glass-card problem-card">
                                <div className={`card-icon ${p.iconClass}`}>
                                    {p.icon}
                                </div>
                                <h3>{p.title}</h3>
                                <p>{p.desc}</p>
                                <div className="card-stat">{p.stat}</div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
