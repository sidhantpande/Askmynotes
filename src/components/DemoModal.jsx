"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_QUESTIONS = [
    "Explain the first law in 2 sentences.",
    "Which files mention 'Thermal'?",
    "What is the confidence in Chapter 3?"
];

export default function DemoModal({ isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [preview, setPreview] = useState({
        subjectTitle: "Physics",
        files: [],
        stats: null,
    });
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            let alive = true;
            fetch("/api/demo")
                .then((res) => res.json())
                .then((data) => {
                    if (!alive) return;
                    setTimeout(() => {
                        if (!alive) return;
                        setPreview({
                            subjectTitle: data.subject?.title || "Physics",
                            files: data.subject?.files || [],
                            stats: data.stats || null,
                        });
                        setMessages(data.messages?.map((msg) => ({
                            sender: msg.role,
                            text: msg.text,
                            citation: msg.citation,
                            confidence: msg.confidence?.toLowerCase(),
                        })) || []);
                    }, 0);
                });

            return () => {
                alive = false;
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { sender: "user", text }];
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/demo");
            const data = await res.json();
            const fallback = data.messages?.[1];
            setMessages(prev => [...prev, {
                sender: "ai",
                text: fallback?.text || "I found relevant information in your notes and can help you explore it further.",
                citation: fallback?.citation,
                confidence: fallback?.confidence?.toLowerCase() || "medium"
            }]);
        } catch {
            setMessages(prev => [...prev, {
                sender: "ai",
                text: "I found relevant information in your notes and can help you explore it further.",
                citation: `${preview.subjectTitle}_Notes.pdf · P. 1`,
                confidence: "medium"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="modal-header">
                    <div className="modal-tag">Live Preview</div>
                    <h3>Try Subject Mode</h3>
                    <p>Experience how subject-scoped AI feels.</p>
                </div>

                <div className="modal-chat">
                    <div className="modal-subject-bar">
                        <div className="active-subject">{preview.subjectTitle} Mode</div>
                        <div className="modal-file">Active: {preview.files[0] || `${preview.subjectTitle}_Notes.pdf`}</div>
                    </div>

                    {preview.stats && (
                        <div className="modal-stats" style={{ display: "flex", gap: "12px", padding: "0 20px 12px", flexWrap: "wrap" }}>
                            <span className="modal-stat">Subjects: {preview.stats.subjects}</span>
                            <span className="modal-stat">Notes: {preview.stats.notes}</span>
                            <span className="modal-stat">Answers: {preview.stats.answers}</span>
                        </div>
                    )}

                    <div className="modal-messages" ref={scrollRef}>
                        <div className="chat-message-group">
                            {messages.map((msg, i) => (
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
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="msg ai-msg">
                                    <div className="msg-avatar">AI</div>
                                    <div className="typing-indicator">
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-quick-qs">
                        <span className="quick-q-label">Quick ask:</span>
                        {QUICK_QUESTIONS.map((q, i) => (
                            <button key={i} type="button" className="quick-q" onClick={() => handleSendMessage(q)}>{q}</button>
                        ))}
                    </div>

                    <form
                        className="modal-input-bar"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Ask anything about your notes..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button className="chat-send-btn" type="submit">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
