"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import './subject.css';

export default function SubjectPage() {
    const params = useParams();
    const router = useRouter();
    const subjectName = decodeURIComponent(params.id || 'Subject');

    const [materialUploaded, setMaterialUploaded] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [materialType, setMaterialType] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Study mode state
    const [studyData, setStudyData] = useState(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [showStudyMode, setShowStudyMode] = useState(false);
    const [showStudyOptions, setShowStudyOptions] = useState(false);
    const [studyType, setStudyType] = useState(null); // 'mcq' or 'short'

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Restore persisted messages on mount
    useEffect(() => {
        const savedMsgs = localStorage.getItem(`askmynotes_chat_${subjectName}`);
        const savedUploaded = localStorage.getItem(`askmynotes_uploaded_${subjectName}`);
        if (savedMsgs) {
            try {
                const parsed = JSON.parse(savedMsgs);
                if (parsed.length > 0) {
                    setMessages(parsed);
                    setMaterialUploaded(true);
                }
            } catch { }
        }
        if (savedUploaded === 'true') {
            setMaterialUploaded(true);
        }
    }, [subjectName]);

    // Persist messages whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`askmynotes_chat_${subjectName}`, JSON.stringify(messages));
        }
    }, [messages, subjectName]);

    // Persist upload status
    useEffect(() => {
        if (materialUploaded) {
            localStorage.setItem(`askmynotes_uploaded_${subjectName}`, 'true');
        }
    }, [materialUploaded, subjectName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Upload: text notes ──
    const handleTextUpload = async () => {
        if (!textInput.trim()) return;
        setIsUploading(true);
        setUploadError('');

        try {
            const blob = new Blob([textInput], { type: 'text/plain' });
            const file = new File([blob], `${subjectName}_notes.txt`, { type: 'text/plain' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('subject', subjectName);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setMaterialType('text');
            setMaterialUploaded(true);
            setShowTextModal(false);
            setMessages([{
                id: 1,
                role: 'ai',
                text: `I've processed your text notes for **${subjectName}** (${data.chunksCount} chunks). I'm now trained on your material and ready to answer questions. Ask me anything!`
            }]);
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // ── Upload: file (PDF/txt) ──
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        setShowUploadOptions(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('subject', subjectName);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setMaterialType('pdf');
            setMaterialUploaded(true);
            setMessages([{
                id: 1,
                role: 'ai',
                text: `I've processed your file **"${file.name}"** for **${subjectName}** (${data.chunksCount} chunks). I'm now trained on your material and ready to answer questions. Ask me anything!`
            }]);
        } catch (err) {
            setUploadError(err.message);
            setShowUploadOptions(true);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Ask: question ──
    const handleSend = async () => {
        if (!prompt.trim() || isLoading) return;
        const userMsg = { id: Date.now(), role: 'user', text: prompt };
        setMessages((prev) => [...prev, userMsg]);
        setPrompt('');
        setIsLoading(true);
        setShowStudyMode(false);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: prompt, subject: subjectName }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to get answer');

            const aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                text: data.answer,
                confidence: data.confidence,
                supportingSnippets: data.supportingSnippets,
                citations: data.citations,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            const errMsg = {
                id: Date.now() + 1,
                role: 'ai',
                text: `Sorry, something went wrong: ${err.message}`,
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Study mode ──
    const handleStudyMode = (type) => {
        setStudyType(type);
        setShowStudyOptions(false);
        setShowStudyMode(true);
        setIsStudyLoading(true);
        setStudyData(null);

        fetch('/api/study', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: subjectName, type }),
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Failed to generate study material');
                setStudyData(data);
            })
            .catch(err => {
                setStudyData({ error: err.message });
            })
            .finally(() => {
                setIsStudyLoading(false);
            });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaInput = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
                setPrompt('What are the key concepts in this subject?');
            }, 3000);
        }
    };

    const handleSuggestion = (text) => {
        if (text === 'Create practice MCQs') {
            setShowStudyOptions(true);
            return;
        }
        setPrompt(text);
        textareaRef.current?.focus();
    };

    // ── Confidence badge color ──
    const getConfidenceStyle = (confidence) => {
        switch (confidence) {
            case 'High': return { background: '#10b981', color: '#fff' };
            case 'Medium': return { background: '#f59e0b', color: '#fff' };
            case 'Low': return { background: '#ef4444', color: '#fff' };
            default: return {};
        }
    };

    return (
        <div className="subject-layout">
            {/* Top bar */}
            <div className="subject-topbar">
                <div className="subject-topbar-left">
                    <Link href="/dashboard" className="subject-back-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </Link>
                    <span className="subject-name">{subjectName}</span>
                </div>
                <div className="subject-topbar-right">
                    {materialUploaded && (
                        <div className="subject-status-chip">
                            <span className="subject-status-dot"></span>
                            Material loaded
                        </div>
                    )}
                </div>
            </div>

            {/* Main body */}
            <div className="subject-body">
                {!materialUploaded ? (
                    /* ── Upload State ── */
                    <div className="subject-upload-area">
                        {isUploading ? (
                            <div className="subject-upload-loading">
                                <div className="subject-upload-spinner"></div>
                                <div className="subject-upload-title">Processing your material...</div>
                                <div className="subject-upload-subtitle">Chunking and embedding your notes into the vector store</div>
                            </div>
                        ) : !showUploadOptions ? (
                            <>
                                <button className="subject-upload-box" onClick={() => setShowUploadOptions(true)}>
                                    <div className="subject-upload-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                    </div>
                                    Upload Material
                                </button>
                                <div>
                                    <div className="subject-upload-title">Upload your study material</div>
                                    <div className="subject-upload-subtitle">Upload text notes or PDF files to train AskMyNotes on your {subjectName} content</div>
                                </div>
                                {uploadError && <div className="subject-upload-error">{uploadError}</div>}
                            </>
                        ) : (
                            <>
                                <div className="subject-upload-title">Choose upload type</div>
                                <div className="subject-upload-subtitle">Select how you want to provide your study material</div>
                                <div className="subject-upload-options">
                                    <button className="subject-upload-option" onClick={() => { setShowTextModal(true); setShowUploadOptions(false); }}>
                                        <div className="subject-upload-option-icon text">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                        </div>
                                        Paste Text
                                    </button>
                                    <button className="subject-upload-option" onClick={() => fileInputRef.current?.click()}>
                                        <div className="subject-upload-option-icon pdf">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15h6" /><path d="M12 12v6" /></svg>
                                        </div>
                                        Upload PDF
                                    </button>
                                    <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={handleFileUpload} />
                                </div>
                                {uploadError && <div className="subject-upload-error">{uploadError}</div>}
                                <button
                                    style={{ background: 'none', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '8px', fontFamily: 'var(--font-sans)' }}
                                    onClick={() => setShowUploadOptions(false)}
                                >
                                    ← Back
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    /* ── Chat State ── */
                    <div className="subject-chat-container">
                        {messages.length <= 1 && !showStudyMode && (
                            <div className="subject-chat-greeting">
                                <div className="subject-material-badge">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    Material uploaded · {materialType === 'pdf' ? 'PDF file' : 'Text notes'}
                                </div>
                                <div className="subject-chat-sparkle">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                    Trained on your {subjectName} notes
                                </div>
                                <h1 className="subject-chat-heading">I&apos;m ready to help you study</h1>
                                <p className="subject-chat-subtext">Ask me questions about your uploaded material</p>
                            </div>
                        )}

                        {/* Study Mode Options */}
                        {showStudyOptions && !showStudyMode && (
                            <div className="subject-study-options">
                                <h3>📚 Choose Study Mode</h3>
                                <p className="subject-study-options-sub">Select the type of practice questions to generate</p>
                                <div className="subject-study-options-grid">
                                    <button className="subject-study-option-card" onClick={() => handleStudyMode('mcq')}>
                                        <div className="subject-study-option-icon mcq">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                        </div>
                                        <div className="subject-study-option-title">MCQ Practice</div>
                                        <div className="subject-study-option-desc">5 multiple-choice questions with explanations</div>
                                    </button>
                                    <button className="subject-study-option-card" onClick={() => handleStudyMode('short')}>
                                        <div className="subject-study-option-icon short">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                        </div>
                                        <div className="subject-study-option-title">Short Q&A</div>
                                        <div className="subject-study-option-desc">3 short-answer questions with detailed answers</div>
                                    </button>
                                </div>
                                <button className="subject-study-options-back" onClick={() => setShowStudyOptions(false)}>← Back to chat</button>
                            </div>
                        )}

                        {/* Study Mode Panel */}
                        {showStudyMode && (
                            <div className="subject-study-panel">
                                <div className="subject-study-header">
                                    <h2>📚 {studyType === 'mcq' ? 'MCQ Practice' : 'Short Q&A'} — {subjectName}</h2>
                                    <button className="subject-study-close" onClick={() => { setShowStudyMode(false); setShowStudyOptions(false); }}>✕</button>
                                </div>
                                {isStudyLoading ? (
                                    <div className="subject-study-loading">
                                        <div className="subject-upload-spinner"></div>
                                        <p>Generating {studyType === 'mcq' ? '5 MCQs' : '3 short questions'} from your notes...</p>
                                    </div>
                                ) : studyData?.error ? (
                                    <div className="subject-upload-error">{studyData.error}</div>
                                ) : studyData ? (
                                    <div className="subject-study-content">
                                        {studyData.mcqs?.length > 0 && (
                                            <div className="subject-study-section">
                                                <h3>Multiple Choice Questions</h3>
                                                {studyData.mcqs.map((mcq, i) => (
                                                    <MCQCard key={i} mcq={mcq} index={i} />
                                                ))}
                                            </div>
                                        )}
                                        {studyData.shortQuestions?.length > 0 && (
                                            <div className="subject-study-section">
                                                <h3>Short Answer Questions</h3>
                                                {studyData.shortQuestions.map((sq, i) => (
                                                    <ShortAnswerCard key={i} sq={sq} index={i} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className="subject-messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`subject-msg ${msg.role}`}>
                                    <div className={`subject-msg-avatar ${msg.role === 'ai' ? 'ai' : 'human'}`}>
                                        {msg.role === 'ai' ? '✦' : 'U'}
                                    </div>
                                    <div className="subject-msg-content">
                                        <div className="subject-msg-bubble">{msg.text}</div>
                                        {/* Confidence badge */}
                                        {msg.confidence && (
                                            <span className="subject-confidence-badge" style={getConfidenceStyle(msg.confidence)}>
                                                {msg.confidence} Confidence
                                            </span>
                                        )}
                                        {/* Citation pills */}
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className="subject-citations">
                                                {msg.citations.map((c, i) => (
                                                    <span key={i} className="subject-citation-pill">📄 {c}</span>
                                                ))}
                                            </div>
                                        )}
                                        {/* Collapsible supporting snippets */}
                                        {msg.supportingSnippets && msg.supportingSnippets.length > 0 && (
                                            <SnippetsCollapsible snippets={msg.supportingSnippets} />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="subject-msg ai">
                                    <div className="subject-msg-avatar ai">✦</div>
                                    <div className="subject-loading-dots">
                                        <span className="subject-loading-dot"></span>
                                        <span className="subject-loading-dot"></span>
                                        <span className="subject-loading-dot"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length <= 1 && !showStudyMode && (
                            <div className="subject-suggestions">
                                <button className="subject-suggestion-chip" onClick={() => handleSuggestion('Summarize the key concepts')}>📝 Summarize key concepts</button>
                                <button className="subject-suggestion-chip" onClick={() => handleSuggestion('Generate flashcards from my notes')}>🃏 Generate flashcards</button>
                                <button className="subject-suggestion-chip" onClick={() => handleSuggestion('Create practice MCQs')}>❓ Practice MCQs</button>
                                <button className="subject-suggestion-chip" onClick={() => handleSuggestion('Explain the most important topics')}>💡 Explain key topics</button>
                            </div>
                        )}

                        {/* Prompt bar */}
                        <div className="subject-prompt-wrap">
                            <div className="subject-prompt-bar">
                                <textarea
                                    ref={textareaRef}
                                    className="subject-prompt-input"
                                    placeholder={`Ask about ${subjectName}...`}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onInput={handleTextareaInput}
                                    rows={1}
                                />
                                <div className="subject-prompt-actions">
                                    <div className="subject-prompt-left">
                                        <button className="subject-prompt-icon-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </button>
                                        <button className="subject-prompt-icon-btn" title="Study Mode" onClick={() => setShowStudyOptions(true)} style={{ fontSize: '16px' }}>
                                            📚
                                        </button>
                                    </div>
                                    <div className="subject-prompt-right">
                                        <button className={`subject-prompt-mic ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} title={isRecording ? 'Stop recording' : 'Voice input'}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                        </button>
                                        <button className="subject-prompt-send" onClick={handleSend} disabled={!prompt.trim() || isLoading}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Text input modal */}
            {showTextModal && (
                <div className="subject-text-modal-overlay" onClick={() => setShowTextModal(false)}>
                    <div className="subject-text-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Paste your study notes</h3>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={`Paste your ${subjectName} notes here...`}
                            autoFocus
                        />
                        <div className="subject-text-modal-actions">
                            <button className="dash-btn-cancel" onClick={() => setShowTextModal(false)}>Cancel</button>
                            <button className="dash-btn-submit" onClick={handleTextUpload} disabled={isUploading}>
                                {isUploading ? 'Processing...' : 'Upload Notes'}
                            </button>
                        </div>
                        {uploadError && <div className="subject-upload-error" style={{ marginTop: '8px' }}>{uploadError}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Collapsible Snippets Component ──
function SnippetsCollapsible({ snippets }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="subject-snippets-wrap">
            <button className="subject-snippets-toggle" onClick={() => setOpen(!open)}>
                {open ? '▾' : '▸'} Supporting Snippets ({snippets.length})
            </button>
            {open && (
                <div className="subject-snippets-list">
                    {snippets.map((s, i) => (
                        <div key={i} className="subject-snippet-item">
                            <span className="subject-snippet-label">Snippet {i + 1}</span>
                            <p>{s}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── MCQ Card Component ──
function MCQCard({ mcq, index }) {
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = (key) => {
        if (revealed) return;
        setSelected(key);
        setRevealed(true);
    };

    return (
        <div className="subject-mcq-card">
            <div className="subject-mcq-question">Q{index + 1}. {mcq.question}</div>
            <div className="subject-mcq-options">
                {Object.entries(mcq.options).map(([key, val]) => {
                    let cls = 'subject-mcq-option';
                    if (revealed) {
                        if (key === mcq.correct) cls += ' correct';
                        else if (key === selected) cls += ' wrong';
                    }
                    return (
                        <button key={key} className={cls} onClick={() => handleSelect(key)}>
                            <span className="subject-mcq-key">{key}</span> {val}
                        </button>
                    );
                })}
            </div>
            {revealed && (
                <div className="subject-mcq-explanation">
                    <strong>Explanation:</strong> {mcq.explanation}
                    <div className="subject-mcq-citation">📄 {mcq.citation}</div>
                </div>
            )}
        </div>
    );
}

// ── Short Answer Card Component ──
function ShortAnswerCard({ sq, index }) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="subject-sa-card">
            <div className="subject-sa-question">Q{index + 1}. {sq.question}</div>
            <button className="subject-sa-reveal" onClick={() => setRevealed(!revealed)}>
                {revealed ? 'Hide Answer' : 'Show Answer'}
            </button>
            {revealed && (
                <div className="subject-sa-answer">
                    <p>{sq.answer}</p>
                    <div className="subject-mcq-citation">📄 {sq.citation}</div>
                </div>
            )}
        </div>
    );
}
