"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const SUBJECTS = [
    {
        id: "physics",
        label: "Physics",
        color: "physics-color",
        files: ["Mechanics_1.pdf", "Thermal_Dynamics.pdf"],
        messages: [
            { sender: "user", text: "What is the relationship between work and energy in a conservative system?" },
            {
                sender: "ai",
                text: "In a conservative system, the total mechanical energy (sum of kinetic and potential energy) remains constant. Work done by conservative forces equals the negative change in potential energy: W = -ΔU.",
                citation: "Mechanics_1.pdf · P. 42",
                confidence: "high"
            }
        ]
    },
    {
        id: "chemistry",
        label: "Chemistry",
        color: "chemistry-color",
        files: ["Organic_Ch1.pdf", "Lab_Results_V2.pdf"],
        messages: [
            { sender: "user", text: "What is the hybridisation of carbon in ethene?" },
            {
                sender: "ai",
                text: "In ethene (C₂H₄), each carbon atom is sp² hybridised. It forms three sigma bonds (two with hydrogen, one with the other carbon) and one pi bond forming the double bond.",
                citation: "Organic_Ch1.pdf · P. 12",
                confidence: "high"
            }
        ]
    },
    {
        id: "math",
        label: "Math",
        color: "math-color",
        files: ["Calculus_Limits.pdf"],
        messages: [
            { sender: "user", text: "Explain the L'Hôpital's rule." },
            {
                sender: "ai",
                text: "L'Hôpital's rule states that for indeterminate forms like 0/0 or ∞/∞, the limit of a quotient of functions is equal to the limit of the quotient of their derivatives.",
                citation: "Calculus_Limits.pdf · P. 5",
                confidence: "medium"
            }
        ]
    }
];

export default function ChatPreview() {
    const [activeSub, setActiveSub] = useState(SUBJECTS[0]);

    return (
        <section className="section section-chat" id="chat-preview">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">Feature Preview</div>
                    <h2 className="section-title">Context is everything.<br />No more mixed knowledge.</h2>
                    <p className="section-sub">Switch between subjects instantly. AskMyNotes only uses the files you've uploaded for that specific subject cluster.</p>
                </ScrollReveal>

                <div className="chat-demo">
                    <div className="chat-subjects">
                        <div className="subject-label">Your Subjects</div>
                        {SUBJECTS.map((sub) => (
                            <button
                                key={sub.id}
                                className={`subject-btn ${activeSub.id === sub.id ? "active" : ""}`}
                                onClick={() => setActiveSub(sub)}
                            >
                                <div className={`subject-color ${sub.color}`} />
                                {sub.label}
                            </button>
                        ))}

                        <div className="subject-divider" />
                        <div className="subject-files-label">Active Files</div>
                        {activeSub.files.map((file, i) => (
                            <div key={i} className="subject-file">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                                {file}
                            </div>
                        ))}
                    </div>

                    <div className="chat-window">
                        <div className="chat-header">
                            <span className="chat-header-dot" />
                            AskMyNotes AI
                            <span className="chat-header-badge">Subject Mode: {activeSub.label}</span>
                        </div>

                        <div className="chat-messages">
                            <div className="chat-message-group">
                                {activeSub.messages.map((msg, i) => (
                                    <div key={i} className={`msg ${msg.sender === "user" ? "user-msg" : "ai-msg"}`}>
                                        <div className="msg-avatar">{msg.sender === "user" ? "ME" : "AI"}</div>
                                        <div className={`msg-bubble ${msg.sender === "ai" ? "ai-bubble" : ""}`}>
                                            <div className="msg-content">{msg.text}</div>
                                            {msg.citation && (
                                                <div className="msg-citation">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                                    {msg.citation}
                                                </div>
                                            )}
                                            {msg.confidence && (
                                                <div className={`msg-confidence ${msg.confidence}`}>
                                                    <div className="confidence-dot" />
                                                    {msg.confidence.charAt(0).toUpperCase() + msg.confidence.slice(1)} Confidence
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="chat-input-bar">
                            <input type="text" placeholder={`Ask about ${activeSub.label} notes...`} disabled />
                            <button className="chat-send-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
