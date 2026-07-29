"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/utils/supabase/client';
import { getSafeUser } from '@/utils/supabase/auth';
import './dashboard.css';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

function renderRichText(text) {
    const input = String(text || '').trim();
    if (!input) return null;

    const lines = input.split(/\r?\n/);
    const blocks = [];
    let currentList = [];

    const flushList = () => {
        if (!currentList.length) return;
        blocks.push(`<ul class="voice-markdown-list">${currentList.map((item) => `<li>${item}</li>`).join('')}</ul>`);
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
            blocks.push(`<h${level} class="voice-markdown-h${level}">${formatInlineMarkdown(heading[2])}</h${level}>`);
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
        blocks.push(`<p class="voice-markdown-p">${formatInlineMarkdown(line)}</p>`);
    }

    flushList();
    return { __html: blocks.join('') };
}

const SUBJECT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function DashboardPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [user, setUser] = useState(null);

    // Voice assistant state
    const [showVoicePanel, setShowVoicePanel] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceMessages, setVoiceMessages] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceSubject, setVoiceSubject] = useState('');
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { user } = await getSafeUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);

            // Fetch subjects from Supabase
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setSubjects(data);
            }
        };
        getUser();
    }, [router]);

    const navigateToSubject = (title) => {
        router.push(`/subject/${encodeURIComponent(title)}`);
    };

    const canCreate = subjects.length < 6;
    const filteredSubjects = subjects.filter((sub) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [sub.title, sub.color, new Date(sub.created_at).toLocaleDateString()]
            .some((value) => String(value).toLowerCase().includes(query));
    });

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        if (!newName.trim() || !canCreate || !user) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .insert([{
                user_id: user.id,
                title: newName.trim(),
                color: SUBJECT_COLORS[subjects.length]
            }])
            .select();

        if (error) {
            alert("Error creating subject: " + error.message);
            return;
        }

        if (data) {
            setSubjects([...subjects, data[0]]);
        }
        setNewName('');
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting subject: " + error.message);
            return;
        }

        setSubjects(subjects.filter((s) => s.id !== id));
    };

    const openCreateForm = () => {
        if (canCreate) setIsCreating(true);
    };

    // ── Voice Assistant ──
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            setVoiceTranscript(transcript);

            if (event.results[0].isFinal) {
                handleVoiceQuestion(transcript);
            }
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const handleVoiceQuestion = async (question) => {
        if (!question.trim()) return;
        setVoiceMessages(prev => [...prev, { role: 'user', text: question }]);
        setVoiceTranscript('');

        const sub = voiceSubject || subjects[0]?.title;
        if (!sub) {
            const msg = 'Please create a subject and upload material first.';
            setVoiceMessages(prev => [...prev, { role: 'ai', text: msg }]);
            speakText(msg);
            return;
        }

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, subject: sub }),
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            const answerText = data.answer || 'I could not generate an answer.';
            setVoiceMessages(prev => [...prev, { role: 'ai', text: answerText }]);
            speakText(answerText);
        } catch (error) {
            const errMsg = 'Sorry, I had trouble processing that. Please try again.';
            setVoiceMessages(prev => [...prev, { role: 'ai', text: errMsg }]);
            speakText(errMsg);
        }
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                subjects={subjects}
                user={user}
                onProfileClick={() => setShowProfile(true)}
            />

            <div className="dash-main">
                <Header
                    user={user}
                    canCreate={canCreate}
                    onCreateClick={openCreateForm}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="dash-content"
                >
                    {/* Page Header */}
                    <header className="dash-page-header">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="dash-page-title">Learning Hub</h1>
                            <p className="dash-page-subtitle">Your personal AI-powered knowledge base.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="dash-page-meta"
                        >
                            <div className="dash-meta-block">
                                <label>Total Subjects</label>
                                <div className="dash-meta-value">{subjects.length} / 6</div>
                            </div>
                        </motion.div>
                    </header>

                    {/* AI Tools */}
                    <section className="dash-section">
                        <h2 className="dash-section-title">Smart Tools</h2>
                        <div className="dash-tools-grid">
                            {[
                                { name: "Notes Summarizer", desc: "AI-powered highlights", icon: "summary", color: "purple" },
                                { name: "Flashcard Gen", desc: "Spaced repetition", icon: "cards", color: "pink" },
                                { name: "MCQ Practice", desc: "Test your knowledge", icon: "quiz", color: "yellow" },
                                { name: "AI Voice", desc: "Speak to your notes", icon: "voice", color: "blue", action: () => setShowVoicePanel(true) }
                            ].map((tool, i) => (
                                <motion.div
                                    key={tool.name}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="dash-tool-card"
                                    onClick={tool.action}
                                >
                                    <div className={`dash-tool-icon ${tool.color}`}>
                                        {tool.icon === 'summary' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
                                        {tool.icon === 'cards' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>}
                                        {tool.icon === 'quiz' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /></svg>}
                                        {tool.icon === 'voice' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>}
                                    </div>
                                    <div>
                                        <div className="dash-tool-name">{tool.name}</div>
                                        <div className="dash-tool-desc">{tool.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Subjects Grid */}
                    <section className="dash-section">
                        <div className="dash-section-header">
                            <h2 className="dash-section-title">My Subjects</h2>
                        </div>

                        <div className="dash-subjects-grid">
                            <AnimatePresence mode="popLayout">
                                {filteredSubjects.map((sub, i) => (
                                    <motion.div
                                        key={sub.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                        className={`dash-slot ${i === 0 ? 'dash-slot-big' : 'dash-slot-small'}`}
                                    >
                                        <div className="dash-subject-card" onClick={() => navigateToSubject(sub.title)}>
                                            <div className="dash-card-glow" style={{ background: `radial-gradient(circle at center, ${sub.color || '#7C3AED'}22, transparent)` }}></div>
                                            <div className="dash-draft-tags">
                                                <span className="dash-tag" style={{ color: sub.color || '#7C3AED', background: `${sub.color || '#7C3AED'}15` }}>Active</span>
                                            </div>
                                            <div className="dash-draft-title">{sub.title}</div>
                                            <div className="dash-draft-footer">
                                                <span className="dash-draft-date">{new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                <div className="dash-card-actions">
                                                    <button className="dash-card-delete" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {canCreate && searchQuery.trim().length === 0 && (
                                    <motion.div
                                        key="create-slot"
                                        layout
                                        className={`dash-slot ${subjects.length === 0 ? 'dash-slot-big' : 'dash-slot-small'}`}
                                    >
                                        {isCreating ? (
                                            <form className="dash-create-form" onSubmit={handleCreate}>
                                                <div className="dash-form-content">
                                                    <h3>New Subject</h3>
                                                    <input
                                                        type="text"
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        placeholder="e.g. Quantum Physics"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="dash-create-form-actions">
                                                    <button type="button" className="dash-btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                                                    <button type="submit" className="dash-btn-submit">Create</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button type="button" className="dash-create-card" onClick={openCreateForm}>
                                                <div className="dash-create-card-icon">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                </div>
                                                <span>Add Subject</span>
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </motion.div>
            </div>

            {/* Profile Modal */}
            {showProfile && (
                <div className="dash-profile-overlay" onClick={() => setShowProfile(false)}>
                    <div className="dash-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-profile-banner">
                            <button className="dash-profile-close" onClick={() => setShowProfile(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                            <div className="dash-profile-avatar-wrap">
                            <div className="dash-profile-avatar-big">
                                {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                {(user?.user_metadata?.last_name?.[0] || '').toUpperCase()}
                            </div>
                            </div>
                        </div>
                        <div className="dash-profile-body">
                            <div className="dash-profile-name">
                                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                            </div>
                            <div className="dash-profile-headline">AskMyNotes study workspace</div>
                            <div className="dash-profile-info-grid">
                                <div className="dash-profile-info-item"><label>Email</label><span>{user?.email}</span></div>
                                <div className="dash-profile-info-item"><label>Status</label><span>Active learner</span></div>
                                <div className="dash-profile-info-item"><label>Subjects</label><span>{subjects.length} active</span></div>
                                <div className="dash-profile-info-item"><label>Visible Subjects</label><span>{filteredSubjects.length}</span></div>
                                <div className="dash-profile-info-item"><label>Access Level</label><span>Local workspace</span></div>
                                <div className="dash-profile-info-item"><label>Member Since</label><span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2025'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Assistant Panel */}
            {showVoicePanel && (
                <div className="voice-overlay" onClick={() => setShowVoicePanel(false)}>
                    <div className="voice-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="voice-panel-header">
                            <h2>🎙️ AI Voice Assistant</h2>
                            <button className="voice-close-btn" onClick={() => { setShowVoicePanel(false); stopListening(); window.speechSynthesis?.cancel(); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Subject selector */}
                        <div className="voice-subject-row">
                            <label>Subject:</label>
                            <select
                                className="voice-subject-select"
                                value={voiceSubject || subjects[0]?.title || ''}
                                onChange={(e) => setVoiceSubject(e.target.value)}
                                disabled={subjects.length === 0}
                            >
                                {subjects.length === 0 && <option value="">No subjects</option>}
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.title}>{s.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Messages */}
                        <div className="voice-messages">
                            {voiceMessages.length === 0 && (
                                <div className="voice-empty">
                                    {subjects.length === 0
                                        ? 'Create a subject first, then use the mic to ask about your notes.'
                                        : 'Tap the mic and ask a question about your notes'}
                                </div>
                            )}
                            {voiceMessages.map((msg, i) => (
                                <div key={i} className={`voice-msg ${msg.role}`}>
                                    <div className="voice-msg-avatar">{msg.role === 'ai' ? '✦' : 'U'}</div>
                                    <div
                                        className="voice-msg-text rich"
                                        dangerouslySetInnerHTML={msg.role === 'ai' ? renderRichText(msg.text) : undefined}
                                    >
                                        {msg.role !== 'ai' ? msg.text : null}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Transcript */}
                        {voiceTranscript && (
                            <div className="voice-transcript">
                                <span className="voice-transcript-label">Hearing:</span> {voiceTranscript}
                            </div>
                        )}

                        {/* Speaking indicator */}
                        {isSpeaking && (
                            <div className="voice-speaking">
                                <div className="voice-wave-bar"></div>
                                <div className="voice-wave-bar"></div>
                                <div className="voice-wave-bar"></div>
                                <div className="voice-wave-bar"></div>
                                <div className="voice-wave-bar"></div>
                                <span>Speaking...</span>
                            </div>
                        )}

                        {/* Mic button */}
                        <div className="voice-mic-wrap">
                            <button
                                className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={isListening ? stopListening : startListening}
                                disabled={subjects.length === 0}
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                            </button>
                            <span className="voice-mic-label">{isListening ? 'Listening... tap to stop' : 'Tap to speak'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
