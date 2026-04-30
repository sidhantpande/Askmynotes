"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/utils/supabase/client';
import './dashboard.css';

const SUBJECT_COLORS = ['#EF4444', '#3B82F6', '#10B981'];

export default function DashboardPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
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

    const supabase = createClient();

    useEffect(() => {
        const saved = localStorage.getItem('askmynotes_subjects');
        if (saved) {
            try { setSubjects(JSON.parse(saved)); } catch { }
        }

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);
        };
        getUser();
    }, []);

    const updateSubjects = (newSubs) => {
        setSubjects(newSubs);
        localStorage.setItem('askmynotes_subjects', JSON.stringify(newSubs));
    };

    const navigateToSubject = (title) => {
        router.push(`/subject/${encodeURIComponent(title)}`);
    };

    const canCreate = subjects.length < 3;

    const handleCreate = (e) => {
        if (e) e.preventDefault();
        if (!newName.trim() || !canCreate) return;

        const newSubject = {
            id: Date.now(),
            title: newName.trim(),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            color: SUBJECT_COLORS[subjects.length],
        };
        updateSubjects([...subjects, newSubject]);
        setNewName('');
        setIsCreating(false);
    };

    const handleDelete = (id) => {
        updateSubjects(subjects.filter((s) => s.id !== id));
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
            const data = await res.json();
            const answer = data.answer || data.error || 'No answer found.';
            setVoiceMessages(prev => [...prev, { role: 'ai', text: answer }]);
            speakText(answer);
        } catch {
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
                <Header user={user} canCreate={canCreate} onCreateClick={openCreateForm} />

                <div className="dash-content">
                    {/* Page Header */}
                    <div className="dash-page-header">
                        <div>
                            <h1 className="dash-page-title">My Projects</h1>
                            <p className="dash-page-subtitle">Let&apos;s get started and take the first step towards becoming a more productive and organized you!</p>
                        </div>
                    </div>

                    {/* AI Tools */}
                    <h2 className="dash-section-title">AI Tools</h2>
                    <div className="dash-tools-grid">
                        <div className="dash-tool-card">
                            <div className="dash-tool-icon purple">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            </div>
                            <div>
                                <div className="dash-tool-name">Notes Summarizer</div>
                                <div className="dash-tool-desc">Condense long notes</div>
                            </div>
                        </div>
                        <div className="dash-tool-card">
                            <div className="dash-tool-icon pink">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                            </div>
                            <div>
                                <div className="dash-tool-name">Flashcard Generator</div>
                                <div className="dash-tool-desc">Auto-create study cards</div>
                            </div>
                        </div>
                        <div className="dash-tool-card">
                            <div className="dash-tool-icon yellow">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </div>
                            <div>
                                <div className="dash-tool-name">MCQ Practice</div>
                                <div className="dash-tool-desc">Generate test questions</div>
                            </div>
                        </div>
                        <div className="dash-tool-card">
                            <div className="dash-tool-icon blue">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                            </div>
                            <div>
                                <div className="dash-tool-name">Journal</div>
                                <div className="dash-tool-desc">Prompts &amp; questions</div>
                            </div>
                        </div>
                        <div className="dash-tool-card" onClick={() => setShowVoicePanel(true)} style={{ cursor: 'pointer' }}>
                            <div className="dash-tool-icon green">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                            </div>
                            <div>
                                <div className="dash-tool-name">AI Voice Assistant</div>
                                <div className="dash-tool-desc">Ask your notes by voice</div>
                            </div>
                        </div>
                    </div>

                    {/* My Subjects / Drafts */}
                    <h2 className="dash-section-title">My drafts</h2>

                    <div className="dash-subjects-grid">
                        {/* Slot 1: Create Card or First Subject (Big) */}
                        <div className="dash-slot dash-slot-big">
                            {subjects[0] ? (
                                <div className="dash-subject-card dash-subject-big" onClick={() => navigateToSubject(subjects[0].title)}>
                                    <div className="dash-draft-tags">
                                        <span className="dash-tag purple">Subject</span>
                                    </div>
                                    <div className="dash-draft-title">{subjects[0].title}</div>
                                    <div className="dash-draft-footer">
                                        <span className="dash-draft-date">{subjects[0].date}</span>
                                        <div className="dash-card-actions">
                                            <button className="dash-draft-edit" title="Edit">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button className="dash-card-delete" title="Delete workspace" onClick={() => handleDelete(subjects[0].id)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : isCreating ? (
                                <form className="dash-create-form dash-create-form-big" onSubmit={handleCreate}>
                                    <div>
                                        <h3>Create new workspace</h3>
                                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Physics, Chemistry..." autoFocus />
                                    </div>
                                    <div className="dash-create-form-actions">
                                        <button type="button" className="dash-btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                                        <button type="submit" className="dash-btn-submit">Create</button>
                                    </div>
                                </form>
                            ) : (
                                <button className="dash-create-card dash-create-card-big" onClick={openCreateForm}>
                                    <div className="dash-create-card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    </div>
                                    Create Subject
                                </button>
                            )}
                        </div>

                        {/* Slot 2: Second Subject (Small) or Skeleton */}
                        <div className="dash-slot dash-slot-small">
                            {subjects[1] ? (
                                <div className="dash-subject-card" onClick={() => navigateToSubject(subjects[1].title)}>
                                    <div className="dash-draft-tags">
                                        <span className="dash-tag green">Subject</span>
                                    </div>
                                    <div className="dash-draft-title">{subjects[1].title}</div>
                                    <div className="dash-draft-footer">
                                        <span className="dash-draft-date">{subjects[1].date}</span>
                                        <div className="dash-card-actions">
                                            <button className="dash-draft-edit" title="Edit">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button className="dash-card-delete" title="Delete workspace" onClick={() => handleDelete(subjects[1].id)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : subjects.length >= 1 && canCreate ? (
                                !isCreating ? (
                                    <button className="dash-create-card" onClick={openCreateForm}>
                                        <div className="dash-create-card-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </div>
                                        Create Subject
                                    </button>
                                ) : (
                                    <form className="dash-create-form" onSubmit={handleCreate}>
                                        <div>
                                            <h3>Create workspace</h3>
                                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Subject name..." autoFocus />
                                        </div>
                                        <div className="dash-create-form-actions">
                                            <button type="button" className="dash-btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                                            <button type="submit" className="dash-btn-submit">Create</button>
                                        </div>
                                    </form>
                                )
                            ) : (
                                <div className="dash-skeleton-card">
                                    <div className="dash-skeleton-tag"></div>
                                    <div className="dash-skeleton-line dash-skeleton-line-lg"></div>
                                    <div className="dash-skeleton-line dash-skeleton-line-md"></div>
                                    <div className="dash-skeleton-footer">
                                        <div className="dash-skeleton-line dash-skeleton-line-sm"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Slot 3: Third Subject (Small) or Skeleton */}
                        <div className="dash-slot dash-slot-small">
                            {subjects[2] ? (
                                <div className="dash-subject-card" onClick={() => navigateToSubject(subjects[2].title)}>
                                    <div className="dash-draft-tags">
                                        <span className="dash-tag pink">Subject</span>
                                    </div>
                                    <div className="dash-draft-title">{subjects[2].title}</div>
                                    <div className="dash-draft-footer">
                                        <span className="dash-draft-date">{subjects[2].date}</span>
                                        <div className="dash-card-actions">
                                            <button className="dash-draft-edit" title="Edit">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button className="dash-card-delete" title="Delete workspace" onClick={() => handleDelete(subjects[2].id)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : subjects.length >= 2 && canCreate ? (
                                !isCreating ? (
                                    <button className="dash-create-card" onClick={openCreateForm}>
                                        <div className="dash-create-card-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </div>
                                        Create Subject
                                    </button>
                                ) : (
                                    <form className="dash-create-form" onSubmit={handleCreate}>
                                        <div>
                                            <h3>Create workspace</h3>
                                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Subject name..." autoFocus />
                                        </div>
                                        <div className="dash-create-form-actions">
                                            <button type="button" className="dash-btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                                            <button type="submit" className="dash-btn-submit">Create</button>
                                        </div>
                                    </form>
                                )
                            ) : (
                                <div className="dash-skeleton-card">
                                    <div className="dash-skeleton-tag"></div>
                                    <div className="dash-skeleton-line dash-skeleton-line-lg"></div>
                                    <div className="dash-skeleton-line dash-skeleton-line-md"></div>
                                    <div className="dash-skeleton-footer">
                                        <div className="dash-skeleton-line dash-skeleton-line-sm"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                                <div className="dash-profile-avatar-big">KS</div>
                            </div>
                        </div>
                        <div className="dash-profile-body">
                            <div className="dash-profile-name">
                                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                            </div>
                            <div className="dash-profile-headline">Engineering Student · AskMyNotes User</div>
                            <div className="dash-profile-info-grid">
                                <div className="dash-profile-info-item"><label>Email</label><span>{user?.email}</span></div>
                                <div className="dash-profile-info-item"><label>University</label><span>MIT</span></div>
                                <div className="dash-profile-info-item"><label>Subjects</label><span>{subjects.length} active</span></div>
                                <div className="dash-profile-info-item"><label>Notes Uploaded</label><span>12 files</span></div>
                                <div className="dash-profile-info-item"><label>Questions Asked</label><span>156</span></div>
                                <div className="dash-profile-info-item"><label>Joined</label><span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2025'}</span></div>
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
                                <div className="voice-empty">Tap the mic and ask a question about your notes</div>
                            )}
                            {voiceMessages.map((msg, i) => (
                                <div key={i} className={`voice-msg ${msg.role}`}>
                                    <div className="voice-msg-avatar">{msg.role === 'ai' ? '✦' : 'U'}</div>
                                    <div className="voice-msg-text">{msg.text}</div>
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
