"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/app/auth/actions';

export default function Sidebar({ subjects = [], user, onProfileClick }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  return (
    <aside className="dash-sidebar">
      <Link href="/dashboard" className="dash-sidebar-logo">
        <motion.div 
          whileHover={{ rotate: 90 }}
          className="dash-sidebar-logo-icon"
        >
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 9h14M7 14h10M7 19h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.div>
        <span className="dash-sidebar-logo-text">AskMyNotes</span>
      </Link>

      <div className="dash-sidebar-section">
        <div className="dash-sidebar-section-title">Workspace</div>

        <Link href="/dashboard" className="dash-sidebar-link active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Dashboard
        </Link>

        <button className="dash-sidebar-link" onClick={() => setWorkspaceOpen(!workspaceOpen)}>
          <div className="dash-ws-toggle">
            <div className="dash-ws-toggle-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              My Subjects
            </div>
            <motion.svg 
              animate={{ rotate: workspaceOpen ? 180 : 0 }}
              className="dash-ws-chevron" 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </div>
        </button>

        <AnimatePresence>
          {workspaceOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="dash-ws-subjects"
              style={{ overflow: 'hidden' }}
            >
              {subjects.length === 0 ? (
                <div className="dash-ws-empty">No subjects yet</div>
              ) : (
                subjects.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link href={`/subject/${encodeURIComponent(sub.title)}`} className="dash-ws-subject">
                      <span className="dash-ws-dot" style={{ background: sub.color || ['#EF4444', '#3B82F6', '#10B981'][idx] }}></span>
                      {sub.title}
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="dash-sidebar-section">
        <div className="dash-sidebar-section-title">Settings</div>

        <button className="dash-sidebar-link" onClick={onProfileClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Account Profile
        </button>
      </div>

      <div className="dash-sidebar-footer">
        <button
          onClick={async () => {
            await signOut();
          }}
          className="dash-sidebar-logout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
