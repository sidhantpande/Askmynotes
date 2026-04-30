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
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([
                { sender: "ai", text: "Hi! I'm the AskMyNotes demo assistant. I've pre-loaded your Physics notes. What would you like to know?" }
            ]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = (text) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { sender: "user", text }];
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                sender: "ai",
                text: "In this demo mode, I've analyzed your notes and found that Chapter 3 discusses the relationship between forces and acceleration in detail.",
                citation: "Physics_Unit1.pdf · P. 12",
                confidence: "high"
            }]);
        }, 1500);
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
                        <div className="active-subject">Physics Mode</div>
                        <div className="modal-file">Active: Physics_Full.pdf</div>
                    </div>

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
                            <button key={i} className="quick-q" onClick={() => handleSendMessage(q)}>{q}</button>
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
