"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

export default function StudyMode() {
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleOptionClick = (idx) => {
        setSelectedOption(idx);
        setShowExplanation(true);
    };

    return (
        <section className="section section-study" id="study-mode">
            <div className="container">
                <ScrollReveal>
                    <div className="section-tag">Active Recall</div>
                    <h2 className="section-title">Turn notes into tests.<br />Automatically.</h2>
                    <p className="section-sub">Don't just read. Test yourself. AI generates subject-scoped MCQs and short-answer questions from your own data.</p>
                </ScrollReveal>

                <div className="study-layout">
                    <ScrollReveal type="reveal-left">
                        <div className="mcq-panel">
                            <div className="panel-header">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                AI Practice MCQ
                            </div>
                            <div className="mcq-item">
                                <div className="mcq-question">Which law describes the relationship between current, voltage, and resistance in an electrical circuit?</div>
                                <div className="mcq-options">
                                    {["Newton's Second Law", "Ohm's Law", "Coulomb's Law", "Faraday's Law"].map((opt, i) => {
                                        let className = "mcq-option";
                                        if (selectedOption === i) {
                                            className += i === 1 ? " selected" : " wrong";
                                        }
                                        return (
                                            <div key={i} className={className} onClick={() => handleOptionClick(i)}>
                                                <div className="option-letter">{String.fromCharCode(65 + i)}</div>
                                                <span>{opt}</span>
                                                {selectedOption === i && (
                                                    <div className="check-icon">
                                                        {i === 1 ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {showExplanation && (
                                    <div className="explanation">
                                        <strong>Correct Answer: B</strong>
                                        <p>Ohm's Law (V = IR) states that the current through a conductor between two points is directly proportional to the voltage across the two points.</p>
                                        <div className="explanation-citation">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            Physics_Electricity.pdf · Page 8
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mcq-more">AI generated from "Physics_Electricity.pdf"</div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal type="reveal-right">
                        <div className="short-answer-panel">
                            <div className="panel-header">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 17l-4 1 1-4L16.5 3.5z" /></svg>
                                Short Answer Practice
                            </div>
                            <div className="sa-item">
                                <div className="sa-q">Explain the concept of 'Thermal Equilibrium'.</div>
                                <div className="sa-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                    Tap to see suggested points
                                </div>
                            </div>
                            <div className="sa-item">
                                <div className="sa-q">What is the Zeroeth Law of Thermodynamics?</div>
                                <div className="sa-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                    Tap to see suggested points
                                </div>
                            </div>
                            <div className="sa-item">
                                <div className="sa-q">Derive the formula for Ideal Gas Law.</div>
                                <div className="sa-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                    Requires derivation steps
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
