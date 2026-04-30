"use client";

import { useState, useEffect } from 'react';

export default function Header({ user, canCreate, onCreateClick }) {
    const [isDark, setIsDark] = useState(true);

    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
    const initials = (firstName.charAt(0) + lastName.charAt(0)) || user?.email?.charAt(0).toUpperCase() || 'U';

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            setIsDark(false);
            document.body.classList.add('light-mode');
        }
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <header className="dash-header">
            <div className="dash-header-user">
                <div className="dash-header-avatar">{initials}</div>
                <div>
                    <div className="dash-header-name">{fullName}</div>
                    <div className="dash-header-email">{user?.email}</div>
                </div>
            </div>

            <div className="dash-header-actions">
                {canCreate && (
                    <button className="dash-create-btn" onClick={onCreateClick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Create Subject
                    </button>
                )}

                <button className="dash-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                    {isDark ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
            </div>
        </header>
    );
}
