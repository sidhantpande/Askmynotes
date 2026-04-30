"use client";

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from '@/app/auth/actions';

export default function Sidebar({ subjects = [], user, onProfileClick }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  return (
    <aside className="dash-sidebar">
      <Link href="/dashboard" className="dash-sidebar-logo">
        <div className="dash-sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M7 9h14M7 14h10M7 19h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="dash-sidebar-logo-text">AskMyNotes</span>
      </Link>

      <div className="dash-sidebar-section">
        <div className="dash-sidebar-section-title">Menu</div>

        <Link href="/dashboard" className="dash-sidebar-link active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Dashboard
        </Link>

        <button className="dash-sidebar-link" onClick={() => setWorkspaceOpen(!workspaceOpen)}>
          <div className="dash-ws-toggle">
            <div className="dash-ws-toggle-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              Workspace
            </div>
            <svg className={`dash-ws-chevron ${workspaceOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </button>

        {workspaceOpen && (
          <div className="dash-ws-subjects">
            {subjects.length === 0 ? (
              <div className="dash-ws-empty">No subjects yet</div>
            ) : (
              subjects.map((sub, idx) => (
                <Link href={`/subject/${encodeURIComponent(sub.title)}`} key={sub.id} className="dash-ws-subject">
                  <span className="dash-ws-dot" style={{ background: sub.color || ['#EF4444', '#3B82F6', '#10B981'][idx] }}></span>
                  {sub.title}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="dash-sidebar-section">
        <div className="dash-sidebar-section-title">General</div>

        <button className="dash-sidebar-link" onClick={onProfileClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Profile
        </button>
      </div>

      <div className="dash-sidebar-footer">
        <button
          onClick={async () => {
            await signOut();
          }}
          className="dash-sidebar-logout"
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
