"use client";

import ScrollReveal from "./ScrollReveal";

export default function SolutionSection() {
    const steps = [
        {
            num: "01",
            icon: "📚",
            title: "Create Subjects",
            desc: "Organize your learning by creating specific subjects for each course in your curriculum.",
            chip: "Subject Isolation"
        },
        {
            num: "02",
            icon: "📤",
            title: "Upload Knowledge",
            desc: "Upload PDFs, slides, or handwritten notes. Our AI processes them into a searchable vector index.",
            chip: "Private Context"
        },
        {
            num: "03",
            icon: "💬",
            title: "Ask & Verify",
            desc: "Ask any question. Get precise answers with direct citations and confidence indicators.",
            chip: "Fact-Checked AI"
        }
    ];

    return (
        <section className="section section-solution" id="solution">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">The Solution</div>
                    <h2 className="section-title">The Subject-Scoped AI<br />Study Methodology.</h2>
                    <p className="section-sub">We isolate AI knowledge to your specific notes, ensuring 100% relevance to what you're actually studying.</p>
                </ScrollReveal>

                <div className="steps-container">
                    {steps.map((step, i) => (
                        <div key={i} style={{ display: "contents" }}>
                            <ScrollReveal type="reveal-block" delay={i * 150} style={{ flex: 1 }}>
                                <div className="step">
                                    <div className="step-number">{step.num}</div>
                                    <div className="step-icon" style={{ fontSize: "2rem" }}>{step.icon}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                    <div className="step-chip">{step.chip}</div>
                                </div>
                            </ScrollReveal>
                            {i < steps.length - 1 && (
                                <div className="step-arrow">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
