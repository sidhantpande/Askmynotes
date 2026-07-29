"use client";

import ScrollReveal from "./ScrollReveal";

export default function WhyDifferent() {
    const cards = [
        {
            icon: "🛡️",
            title: "Hallucination Free",
            desc: "Answers are 100% grounded in your uploaded data. If it is not in your notes, the AI will tell you."
        },
        {
            icon: "🔍",
            title: "Evidence First",
            desc: "Every answer comes with highlighted snippets and page numbers from your original PDFs."
        },
        {
            icon: "🎯",
            title: "Subject Precision",
            desc: "Cluster your materials by subject to prevent knowledge bleeding and irrelevant results."
        },
        {
            icon: "⚡",
            title: "Instant Retrieval",
            desc: "No more ctrl+f. Find anything across thousands of pages of notes in milliseconds."
        },
        {
            icon: "🧠",
            title: "Deep Understanding",
            desc: "Ask follow-up questions to understand complex concepts, not just memorize facts."
        },
        {
            icon: "🎓",
            title: "Tutor Mindset",
            desc: "Designed for pedagogy—helping you learn, not just doing the work for you."
        }
    ];

    return (
        <section className="section section-why" id="why-different">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">Why Different</div>
                    <h2 className="section-title">Built for precision,<br />not just chat.</h2>
                    <p className="section-sub">Standard AI is a generalist. AskMyNotes is your personal specialist who knows exactly what you have been taught.</p>
                </ScrollReveal>

                <div className="why-grid">
                    {cards.map((card, i) => (
                        <ScrollReveal key={i} type="reveal-card" delay={i * 80}>
                            <div className="glass-card why-card">
                                <div className="why-icon">{card.icon}</div>
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
