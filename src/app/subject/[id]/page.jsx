"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getSafeUser } from '@/utils/supabase/auth';
import './subject.css';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderRichText(text) {
    const input = String(text || '').trim();
    if (!input) return null;

    const lines = input.split(/\r?\n/);
    const blocks = [];
    let currentList = [];

    const flushList = () => {
        if (!currentList.length) return;
        blocks.push(`<ul class="subject-markdown-list">${currentList.map((item) => `<li>${item}</li>`).join('')}</ul>`);
        currentList = [];
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
            flushList();
            continue;
        }

        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
            flushList();
            const level = heading[1].length;
            const content = heading[2];
            blocks.push(`<h${level} class="subject-markdown-h${level}">${formatInlineMarkdown(content)}</h${level}>`);
            continue;
        }

        const bullet = line.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
            currentList.push(formatInlineMarkdown(bullet[1]));
            continue;
        }

        const numbered = line.match(/^\d+\.\s+(.*)$/);
        if (numbered) {
            currentList.push(formatInlineMarkdown(numbered[1]));
            continue;
        }

        flushList();
        blocks.push(`<p class="subject-markdown-p">${formatInlineMarkdown(line)}</p>`);
    }

    flushList();
    return { __html: blocks.join('') };
}

function formatInlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/\\\((.*?)\\\)/g, '$1')
        .replace(/\\\[(.*?)\\\]/g, '$1')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
}

function cleanSnippet(text) {
    return String(text || '')
        .replace(/\\\((.*?)\\\)/g, '$1')
        .replace(/\\\[(.*?)\\\]/g, '$1')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function SubjectPage() {
    const params = useParams();
    const router = useRouter();
    const subjectName = decodeURIComponent(params.id || 'Subject');
    const [user, setUser] = useState(null);
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
    const [askError, setAskError] = useState('');

    // Study mode state
    const [studyData, setStudyData] = useState(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [showStudyMode, setShowStudyMode] = useState(false);
    const [showStudyOptions, setShowStudyOptions] = useState(false);
    const [studyType, setStudyType] = useState(null); // 'mcq' or 'short'
    const [studyError, setStudyError] = useState('');

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auth check and Restore persisted chat on mount
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { user } = await getSafeUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);

            // Fetch chat from Supabase
            const { data, error } = await supabase
                .from('chats')
                .select('messages')
                .eq('user_id', user.id)
                .eq('subject_title', subjectName)
                .maybeSingle();
            
            if (!error && data) {
                setMessages(data.messages || []);
                if (data.messages?.length > 0) {
                    setMaterialUploaded(true);
                }
            }
        };
        init();
    }, [router, subjectName]);

    // Persist messages whenever they change
    useEffect(() => {
        const saveChat = async () => {
            if (messages.length > 0 && user) {
                const supabase = createClient();
                await supabase
                    .from('chats')
                    .upsert({
                        user_id: user.id,
                        subject_title: subjectName,
                        messages: messages,
                        updated_at: new Date()
                    }, { onConflict: 'user_id, subject_title' });
            }
        };
        saveChat();
    }, [messages, user, subjectName]);

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
            setAskError('');
            setMessages([{
                id: 1,
                role: 'ai',
                text: `I've processed your text notes for **${subjectName}** (${data.chunksCount} chunks). I'm ready to answer questions and study prompts from this material.`
            }]);
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
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
            setAskError('');
            setMessages([{
                id: 1,
                role: 'ai',
                text: `I've processed **"${file.name}"** for **${subjectName}** (${data.chunksCount} chunks). You can now ask questions or switch to study mode.`
            }]);
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
            setShowUploadOptions(true);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Ask: question ──
    const handleSend = async () => {
        if (!prompt.trim() || isLoading) return;
        const currentPrompt = prompt;
        setAskError('');
        const userMsg = { id: Date.now(), role: 'user', text: currentPrompt };
        setMessages((prev) => [...prev, userMsg]);
        setPrompt('');
        setIsLoading(true);
        setShowStudyMode(false);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const aiMsgId = Date.now() + 1;
        const aiMsg = {
            id: aiMsgId,
            role: 'ai',
            text: '',
            isLoading: true
        };
        setMessages((prev) => [...prev, aiMsg]);

        try {
            const res = await fetch('/api/ask?stream=1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: currentPrompt, subject: subjectName }),
            });

            if (!res.ok) throw new Error('Failed to get answer');

            const data = await readAskStream(res);
            setMessages((prev) => prev.map(m => 
                m.id === aiMsgId ? { 
                    ...m, 
                    text: data.answer || 'No response returned.',
                    sources: data.sources || [],
                    supportingSnippets: data.supportingSnippets || [],
                    confidence: data.confidence,
                    confidenceScore: data.confidenceScore,
                    isLoading: false 
                } : m
            ));
        } catch (err) {
            setAskError(err.message || 'Failed to get answer');
            setMessages((prev) => prev.map(m => 
                m.id === aiMsgId ? { ...m, text: `Sorry, something went wrong: ${err.message}`, isLoading: false } : m
            ));
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
        setStudyError('');

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
                setStudyError(err.message || 'Failed to generate study material');
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

    const readAskStream = async (response) => {
        const meta = { answer: '', sources: [], supportingSnippets: [], confidence: 'Low', confidenceScore: 0 };
        const reader = response.body?.getReader();

        if (!reader) {
            return response.json();
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const parseBlock = (block) => {
            const lines = block.split('\n');
            const event = lines.find((line) => line.startsWith('event: '))?.slice(7)?.trim() || 'message';
            const dataLine = lines.find((line) => line.startsWith('data: '))?.slice(6) || '{}';
            const data = JSON.parse(dataLine);

            if (event === 'meta') {
                meta.sources = data.sources || [];
                meta.confidence = data.confidence || meta.confidence;
                meta.confidenceScore = data.confidenceScore ?? meta.confidenceScore;
            }

            if (event === 'delta') {
                meta.answer += data.text || '';
            }

            if (event === 'done') {
                meta.answer = data.answer || meta.answer;
                meta.sources = data.sources || meta.sources;
                meta.supportingSnippets = data.supportingSnippets || meta.supportingSnippets;
                meta.confidence = data.confidence || meta.confidence;
                meta.confidenceScore = data.confidenceScore ?? meta.confidenceScore;
            }
        };

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() || '';
            chunks.filter(Boolean).forEach(parseBlock);
        }

        if (buffer.trim()) {
            parseBlock(buffer);
        }

        return meta;
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
            <header className="subject-topbar">
                <div className="subject-topbar-left">
                    <Link href="/dashboard" className="subject-back-btn" title="Back to Dashboard">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                    </Link>
                    <div className="subject-name-wrap">
                        <div className="subject-name">{subjectName}</div>
                    </div>
                </div>

                <div className="subject-topbar-right">
                    {materialUploaded && (
                        <div className="subject-actions-group">
                            <button 
                                className={`subject-mode-btn ${!showStudyMode ? 'active' : ''}`}
                                onClick={() => setShowStudyMode(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Chat
                            </button>
                            <button 
                                className={`subject-mode-btn ${showStudyMode ? 'active' : ''}`}
                                onClick={() => setShowStudyMode(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                Study Mode
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="subject-body">
                <AnimatePresence mode="wait">
                    {!materialUploaded ? (
                        /* ── Upload State ── */
                        <motion.div 
                            key="upload-state"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="subject-upload-area"
                        >
                            {!showUploadOptions ? (
                                <>
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        className="subject-upload-icon"
                                    >
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                    </motion.div>
                                    <div className="subject-upload-text">
                                        <h1 className="subject-upload-title">Feed your brain</h1>
                                        <p className="subject-upload-subtitle">Upload your notes or paste text to start studying with AI.</p>
                                    </div>
                                    <button className="dash-btn-submit" onClick={() => setShowUploadOptions(true)} style={{ padding: '14px 32px', fontSize: '1rem' }}>
                                        Get Started
                                    </button>
                                </>
                            ) : isUploading ? (
                                <div className="subject-upload-loading">
                                    <div className="subject-upload-spinner"></div>
                                    <p>Processing your material...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="subject-upload-options">
                                        <motion.button 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="subject-upload-option" 
                                            onClick={() => setShowTextModal(true)}
                                        >
                                            <div className="subject-upload-option-icon text">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <span>Paste Notes</span>
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="subject-upload-option" 
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="subject-upload-option-icon pdf">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <span>Upload PDF</span>
                                        </motion.button>
                                        <input ref={fileInputRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    </div>
                                    {uploadError && <div className="subject-upload-error">{uploadError}</div>}
                                    <button className="subject-snippets-toggle" onClick={() => setShowUploadOptions(false)} style={{ marginTop: '12px' }}>
                                        ← Back
                                    </button>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        /* ── Chat State ── */
                        <motion.div 
                            key="chat-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="subject-chat-container"
                        >
                            {showStudyMode ? (
                                <StudyCenter subject={subjectName} />
                            ) : (
                                <>
                                    {/* Existing Chat Content */}
                            <AnimatePresence>
                                {messages.length <= 1 && !showStudyMode && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="subject-chat-greeting"
                                    >
                                        <div className="subject-chat-sparkle">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            Your study tutor
                                        </div>
                                        <h1 className="subject-chat-heading">Let’s work through {subjectName}</h1>
                                        <p className="subject-chat-subtext">Ask a question, ask for a summary, or let me turn your notes into something easier to revise.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Study Mode Panel */}
                            {showStudyMode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="subject-study-panel"
                                >
                                    <div className="subject-study-header">
                                        <h2>📚 {studyType === 'mcq' ? 'Practice MCQs' : 'Short Q&A'}</h2>
                                        <button type="button" className="subject-study-close" onClick={() => setShowStudyMode(false)}>✕</button>
                                    </div>
                                    {isStudyLoading ? (
                                        <div className="subject-study-loading">
                                            <div className="subject-upload-spinner"></div>
                                            <p>I’m reading through your notes and shaping {studyType === 'mcq' ? 'practice questions' : 'quick revision prompts'} now...</p>
                                        </div>
                                    ) : studyError || studyData?.error ? (
                                        <div className="subject-empty-state">
                                            <div className="subject-empty-icon">⚠️</div>
                                            <h3>That one didn’t land cleanly</h3>
                                            <p>{studyError || studyData?.error}</p>
                                            <button type="button" className="dash-btn-submit" onClick={() => handleStudyMode(studyType || 'flashcards')}>Let me try again</button>
                                        </div>
                                    ) : (
                                        <div className="subject-study-content">
                                            {Array.isArray(studyData?.mcqs) && studyData.mcqs.map((mcq, i) => <MCQCard key={i} mcq={mcq} index={i} />)}
                                            {Array.isArray(studyData?.shortQuestions) && studyData.shortQuestions.map((sq, i) => <ShortAnswerCard key={i} sq={sq} index={i} />)}
                                            {Array.isArray(studyData) && studyType === 'flashcards' && studyData.map((card, i) => <FlashcardCard key={i} card={card} index={i} />)}
                                            {!Array.isArray(studyData) && Array.isArray(studyData?.flashcards) && studyData.flashcards.map((card, i) => <FlashcardCard key={i} card={card} index={i} />)}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <div className="subject-messages">
                                {messages.map((msg, i) => (
                                    <motion.div 
                                        key={msg.id || i} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`subject-msg ${msg.role}`}
                                    >
                                        <div className={`subject-msg-avatar ${msg.role === 'ai' ? 'ai' : 'human'}`}>
                                            {msg.role === 'ai' ? '✦' : 'U'}
                                        </div>
                                        <div className="subject-msg-content">
                                            {msg.role === 'ai' && (
                                                <div className="subject-ai-intro">
                                                    <span className="subject-ai-tag">Tutor</span>
                                                    <span>{msg.confidence ? `${msg.confidence} confidence` : 'Grounded in your notes'}</span>
                                                </div>
                                            )}
                                            <div
                                                className={`subject-msg-bubble ${msg.role === 'ai' ? 'rich' : ''}`}
                                                dangerouslySetInnerHTML={msg.role === 'ai' ? renderRichText(msg.text) : undefined}
                                            >
                                                {msg.role !== 'ai' ? msg.text : null}
                                            </div>
                                            {msg.role === 'ai' && isLoading && msg.isLoading && (
                                                <div className="subject-loading-inline">I’m pulling the relevant bits from your notes...</div>
                                            )}
                                            {msg.confidence && (
                                                <span className="subject-confidence-badge" style={getConfidenceStyle(msg.confidence)}>
                                                    {msg.confidence} Confidence
                                                </span>
                                            )}
                                            {msg.sources?.length > 0 && (
                                                <div className="subject-source-grid">
                                                    {msg.sources.map((s, i) => (
                                                        <div key={i} className="subject-source-card">
                                                            <div className="subject-source-card-head">
                                                                <div>
                                                                    <div className="subject-source-file">{s.file}</div>
                                                                    <div className="subject-source-meta">
                                                                        <span>Page {s.page ?? '—'}</span>
                                                                        {typeof s.score === 'number' && <span>{(s.score * 100).toFixed(0)}% match</span>}
                                                                    </div>
                                                                </div>
                                                                <span className="subject-source-chip">Evidence</span>
                                                            </div>
                                                            {s.snippet && <p className="subject-source-snippet">{cleanSnippet(s.snippet)}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {msg.supportingSnippets?.length > 0 && <SnippetsCollapsible snippets={msg.supportingSnippets} />}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="subject-msg ai"
                                    >
                                        <div className="subject-msg-avatar ai">✦</div>
                                        <div className="subject-loading-dots">
                                            <span className="subject-loading-dot"></span>
                                            <span className="subject-loading-dot"></span>
                                            <span className="subject-loading-dot"></span>
                                            <span className="subject-loading-copy">Thinking this through...</span>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <AnimatePresence>
                            {messages.length <= 1 && !showStudyMode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="subject-suggestions"
                                >
                                    <button type="button" className="subject-suggestion-chip" onClick={() => handleSuggestion('Give me the big ideas in these notes')}>Start with the big ideas</button>
                                    <button type="button" className="subject-suggestion-chip" onClick={() => handleSuggestion('Quiz me with a few practice MCQs')}>Test me with a few questions</button>
                                    <button type="button" className="subject-suggestion-chip" onClick={() => handleSuggestion('What should I revise first?')}>What should I revise first?</button>
                                </motion.div>
                            )}
                            </AnimatePresence>

                            {(askError || uploadError) && (
                                <div className="subject-empty-state" style={{ margin: '0 0 16px' }}>
                                    <div className="subject-empty-icon">!</div>
                                    <h3>Something needs attention</h3>
                                    <p>{askError || uploadError}</p>
                                </div>
                            )}

                            {/* Prompt bar */}
                            <div className="subject-prompt-wrap">
                                <div className="subject-prompt-inner">
                                    <div className="subject-prompt-bar">
                                        <textarea
                                            ref={textareaRef}
                                            className="subject-prompt-input"
                                            placeholder={`Message about ${subjectName}...`}
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onInput={handleTextareaInput}
                                            rows={1}
                                        />
                                        <div className="subject-prompt-actions">
                                            <div className="subject-prompt-left">
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="subject-prompt-icon-btn" 
                                                    onClick={() => setShowStudyOptions(!showStudyOptions)}
                                                    title="Study Mode"
                                                >
                                                    📚
                                                </motion.button>
                                            </div>
                                            <div className="subject-prompt-right">
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className={`subject-prompt-mic ${isRecording ? 'recording' : ''}`} 
                                                    onClick={toggleRecording}
                                                    type="button"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                                </motion.button>
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="subject-prompt-send" 
                                                    onClick={handleSend} 
                                                    disabled={!prompt.trim() || isLoading}
                                                    type="button"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Study Mode Quick Options */}
                                    <AnimatePresence>
                                        {showStudyOptions && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="subject-study-quick-options"
                                                style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}
                                            >
                                                <button type="button" className="subject-suggestion-chip" onClick={() => handleStudyMode('flashcards')}>Make flashcards</button>
                                                <button type="button" className="subject-suggestion-chip" onClick={() => handleStudyMode('mcq')}>Give me a quiz</button>
                                                <button type="button" className="subject-suggestion-chip" onClick={() => handleStudyMode('short')}>Short revision</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}
                        </motion.div>
                    )}
                </AnimatePresence>
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
            <button type="button" className="subject-snippets-toggle" onClick={() => setOpen(!open)}>
                {open ? '▾' : '▸'} Supporting Snippets ({snippets.length})
            </button>
            {open && (
                <div className="subject-snippets-list">
                    {snippets.map((s, i) => (
                        <div key={i} className="subject-snippet-item">
                            <span className="subject-snippet-label">
                                Snippet {i + 1}{s.file ? ` • ${s.file}` : ''}{s.page ? ` • Page ${s.page}` : ''}
                            </span>
                            <p>{typeof s === 'string' ? s : s.snippet}</p>
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
                    <strong>Explanation:</strong>
                    <div className="subject-markdown-body" dangerouslySetInnerHTML={renderRichText(mcq.explanation)} />
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
                    <div className="subject-markdown-body" dangerouslySetInnerHTML={renderRichText(sq.answer)} />
                    <div className="subject-mcq-citation">📄 {sq.citation}</div>
                </div>
            )}
        </div>
    );
}

function FlashcardCard({ card, index }) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="study-item-card">
            <div className="subject-snippet-label">Flashcard {index + 1}</div>
            <p style={{ fontWeight: 600, marginBottom: '16px' }}>{card.question}</p>
            <button type="button" className="subject-sa-reveal" onClick={() => setRevealed(!revealed)}>
                {revealed ? 'Hide Answer' : 'Reveal Answer'}
            </button>
            {revealed && (
                <div className="subject-sa-answer">
                    <div className="subject-markdown-body" dangerouslySetInnerHTML={renderRichText(card.answer)} />
                    {card.citation && <div className="subject-mcq-citation">📄 {card.citation}</div>}
                </div>
            )}
        </div>
    );
}

// ── Study Center Sub-component ──
function StudyCenter({ subject }) {
    const [type, setType] = useState(null); // 'flashcards' | 'quiz'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generate = async (mode) => {
        setLoading(true);
        setType(mode);
        setError('');
        try {
            const res = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, type: mode })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to generate study material');
            if (json.success) setData(json.data);
        } catch (e) {
            setError(e.message || 'Failed to generate study material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="study-center-layout">
            {!data && !loading && (
                <div className="subject-chat-greeting">
                    <div className="subject-chat-sparkle">✨ Study Hub</div>
                    <h1 className="subject-chat-heading">What are we learning?</h1>
                    <p className="subject-chat-subtext">Generate AI-powered material based on your specific notes.</p>
                    
                    <div className="subject-upload-options" style={{ justifyContent: 'center', marginTop: '32px' }}>
                        <motion.button 
                            whileHover={{ y: -5 }}
                            className="subject-upload-option"
                            onClick={() => generate('flashcards')}
                        >
                            <div className="subject-upload-option-icon text" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                            </div>
                            <span>Flashcards</span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -5 }}
                            className="subject-upload-option"
                            onClick={() => generate('quiz')}
                        >
                            <div className="subject-upload-option-icon pdf" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </div>
                            <span>AI Quiz</span>
                        </motion.button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="subject-upload-loading" style={{ marginTop: '80px' }}>
                    <div className="subject-upload-spinner"></div>
                    <p>Analyzing your notes to create {type}...</p>
                </div>
            )}

            {error && !loading && (
                <div className="subject-empty-state" style={{ marginTop: '48px' }}>
                    <div className="subject-empty-icon">⚠️</div>
                    <h3>Study mode is having a rough moment</h3>
                    <p>{error}</p>
                    <button type="button" className="dash-btn-submit" onClick={() => generate(type || 'flashcards')}>Retry</button>
                </div>
            )}

            {data && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="study-card-grid"
                >
                    {type === 'flashcards' ? (
                        Array.isArray(data) && data.map((item, i) => <FlashcardCard key={i} card={item} index={i} />)
                    ) : type === 'short' ? (
                        (data.shortQuestions || []).map((item, i) => (
                            <div key={i} className="study-item-card">
                                <div className="subject-snippet-label">Short Answer</div>
                                <p style={{ fontWeight: 600, marginBottom: '16px' }}>{item.question}</p>
                                <div className="subject-snippet-label" style={{ color: '#10B981' }}>Answer</div>
                                <div className="subject-markdown-body" style={{ fontSize: '0.9rem', color: 'var(--txt-secondary)' }} dangerouslySetInnerHTML={renderRichText(item.answer)} />
                                {item.citation && <div className="subject-mcq-citation">📄 {item.citation}</div>}
                            </div>
                        ))
                    ) : (
                        (data.mcqs || []).map((item, i) => (
                            <div key={i} className="study-item-card">
                                <p style={{ fontWeight: 600, marginBottom: '16px' }}>{item.question}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Object.entries(item.options).map(([key, opt], oi) => (
                                        <div key={oi} style={{ 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            background: key === item.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${key === item.correct ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                                            fontSize: '0.85rem'
                                        }}>
                                            <strong>{key}.</strong> {opt} {key === item.correct && '✓'}
                                        </div>
                                ))}
                                </div>
                                {item.explanation && (
                                    <div className="subject-mcq-explanation">
                                        <strong>Explanation:</strong>
                                        <div className="subject-markdown-body" dangerouslySetInnerHTML={renderRichText(item.explanation)} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <button className="dash-btn-cancel" onClick={() => setData(null)}>← Generate Different</button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
