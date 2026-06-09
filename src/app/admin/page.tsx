"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMembers, MemberFormData } from "@/lib/supabase";
import "../globals.css";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<MemberFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For visual terminal typing effect
  const [logs, setLogs] = useState<string[]>(["[ SYS.AUTH ] Enter passphrase..."]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "synapse2026") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLogs((prev) => [...prev, "ACCESS DENIED. Incorrect passphrase."]);
      setPassword("");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setLogs((prev) => [...prev, "[ SYS.SYNC ] Establishing secure link..."]);
    const { success, data, error } = await getMembers();
    
    if (success && data) {
      setMembers(data);
      setLogs((prev) => [...prev, `[ SYS.OK ] Retrieved ${data.length} records.`]);
    } else {
      setError(error || "Failed to fetch data.");
      setLogs((prev) => [...prev, `[ SYS.ERR ] ${error}`]);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (members.length === 0) return;
    
    const headers = Object.keys(members[0]);
    const csvContent = [
      headers.join(","),
      ...members.map(row => 
        headers.map(header => {
          let cell = (row as any)[header] ?? "";
          if (Array.isArray(cell)) cell = cell.join("; ");
          // Escape quotes and commas
          const cellString = String(cell).replace(/"/g, '""');
          return `"${cellString}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `synapse_recruits_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <main className="main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-container" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="terminal-title">admin_auth.exe</span>
          </div>
          <div className="terminal-content">
            <div style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('DENIED') ? '#ef4444' : 'inherit' }}>{log}</div>
              ))}
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>$</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="cli-input"
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container" style={{ padding: '40px 20px' }}>
      <div className="terminal-container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="terminal-title">synapse_database_viewer.exe</span>
          </div>
          <button 
            onClick={downloadCSV}
            className="action-button primary"
            style={{ padding: '4px 12px', fontSize: '0.8rem', minHeight: 'unset' }}
          >
            [ EXPORT .CSV ]
          </button>
        </div>
        
        <div className="terminal-content" style={{ overflowX: 'auto', padding: '20px' }}>
          {loading ? (
            <div className="glitch-text" style={{ textAlign: 'center', padding: '40px' }}>FETCHING DATABASE_RECORDS...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>{error}</div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No records found in database.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--accent-secondary)' }}>
                  <th style={{ padding: '12px' }}>NAME</th>
                  <th style={{ padding: '12px' }}>UID</th>
                  <th style={{ padding: '12px' }}>YEAR</th>
                  <th style={{ padding: '12px' }}>INTERESTS</th>
                  <th style={{ padding: '12px' }}>EMAIL</th>
                  <th style={{ padding: '12px' }}>PHONE</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-glass-hover)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{m.full_name}</td>
                    <td style={{ padding: '12px', color: 'var(--accent-primary)' }}>{m.uid}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.course_year}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{m.areas_of_interest?.join(", ")}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.email}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.contact_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
