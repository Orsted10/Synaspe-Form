"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMembers, MemberFormData } from "@/lib/supabase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Download, Users, PieChart as PieChartIcon, LayoutList, ChevronLeft, ChevronRight, User } from "lucide-react";
import "../globals.css";

// COLORS
const COLORS = ['#a855f7', '#06b6d4', '#22c55e', '#ec4899', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<MemberFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "individual">("summary");
  
  // Individual Pagination
  const [currentIndex, setCurrentIndex] = useState(0);

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
    
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      const { success, data, error } = await response.json();
      
      if (success && data) {
        setMembers(data);
        setLogs((prev) => [...prev, `[ SYS.OK ] Retrieved ${data.length} records.`]);
      } else {
        setError(error || "Failed to fetch data.");
        setLogs((prev) => [...prev, `[ SYS.ERR ] ${error}`]);
      }
    } catch (err) {
      setError("Network error fetching database records.");
      setLogs((prev) => [...prev, `[ SYS.ERR ] Network error.`]);
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

  // --- DATA PROCESSING FOR CHARTS ---

  // 1. Year Distribution (Pie)
  const yearData = members.reduce((acc, curr) => {
    const year = curr.course_year || "Unknown";
    const existing = acc.find(item => item.name === year);
    if (existing) existing.value += 1;
    else acc.push({ name: year, value: 1 });
    return acc;
  }, [] as { name: string, value: number }[]);

  // 2. Areas of Interest (Bar)
  const interestDataMap: Record<string, number> = {};
  members.forEach(m => {
    (m.areas_of_interest || []).forEach(interest => {
      interestDataMap[interest] = (interestDataMap[interest] || 0) + 1;
    });
  });
  const interestData = Object.keys(interestDataMap).map(key => ({
    name: key,
    count: interestDataMap[key]
  })).sort((a, b) => b.count - a.count);

  // 3. Collaboration Preferences (Radar)
  const collabDataMap: Record<string, number> = {};
  members.forEach(m => {
    (m.collaboration_preferences || []).forEach(pref => {
      collabDataMap[pref] = (collabDataMap[pref] || 0) + 1;
    });
  });
  const collabData = Object.keys(collabDataMap).map(key => ({
    subject: key.split(" ")[0], // Shorthand for radar
    fullLabel: key,
    A: collabDataMap[key],
    fullMark: members.length
  }));

  // --- RENDERERS ---

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

  const activeMember = members[currentIndex];

  return (
    <main className="main-container" style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div className="terminal-container" style={{ margin: '0 auto 20px auto', width: '100%', maxWidth: '1400px' }}>
        <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
            style={{ padding: '4px 12px', fontSize: '0.8rem', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={14} /> EXPORT .CSV
          </button>
        </div>
        
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-secondary)' }}>
          <button 
            className={`admin-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'summary' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'summary' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
          >
            <PieChartIcon size={18} /> SUMMARY
          </button>
          <button 
            className={`admin-tab ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setActiveTab('individual')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'individual' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'individual' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
          >
            <User size={18} /> INDIVIDUAL
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glitch-text" style={{ textAlign: 'center', padding: '40px', flex: 1 }}>FETCHING DATABASE_RECORDS...</div>
      ) : error ? (
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px', flex: 1 }}>{error}</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', flex: 1 }}>No records found in database.</div>
      ) : (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1 }}>
          
          {/* ======================================= */}
          {/* SUMMARY TAB                             */}
          {/* ======================================= */}
          {activeTab === "summary" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="admin-grid">
              
              {/* Top Stats */}
              <div className="admin-card stats-card" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>TOTAL_RECRUITS</h3>
                  <div style={{ fontSize: '3rem', color: 'var(--accent-primary)', textShadow: '0 0 20px var(--accent-glow)' }}>
                    {members.length}
                  </div>
                </div>
                <Users size={64} color="var(--border-glass-hover)" />
              </div>

              {/* Year Distribution */}
              <div className="admin-card">
                <h3 className="admin-card-title">Year Distribution</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={yearData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {yearData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {yearData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                      <div style={{ width: '12px', height: '12px', background: COLORS[index % COLORS.length], borderRadius: '2px' }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaboration Preferences Radar */}
              <div className="admin-card">
                <h3 className="admin-card-title">Collaboration Styles</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={collabData}>
                      <PolarGrid stroke="var(--border-glass-hover)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fill: 'var(--text-muted)' }} />
                      <Radar name="Users" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.4} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--accent-primary)' }}
                        formatter={(value: any, name: any, props: any) => [value, props.payload.fullLabel]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Areas of Interest Bar Chart */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="admin-card-title">Domain Allocation Matrix</h3>
                <div style={{ height: '400px', width: '100%', marginTop: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interestData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 12 }} width={90} />
                      <Tooltip 
                        cursor={{ fill: 'var(--surface-glass-hover)' }}
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="var(--accent-secondary)" radius={[0, 4, 4, 0]} barSize={20}>
                        {interestData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-secondary)' : 'var(--accent-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Open Ended Answers */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Raw Expectation Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {members.filter(m => m.club_expectations).slice(0, 10).map((m, i) => (
                    <div key={i} style={{ padding: '15px', background: 'var(--surface-glass)', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>{m.full_name} [{m.uid}]</span>
                      "{m.club_expectations}"
                    </div>
                  ))}
                  {members.filter(m => m.club_expectations).length > 10 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>... and {members.filter(m => m.club_expectations).length - 10} more. Export CSV to view all.</div>
                  )}
                </div>
              </div>
              
            </motion.div>
          )}

          {/* ======================================= */}
          {/* INDIVIDUAL TAB                          */}
          {/* ======================================= */}
          {activeTab === "individual" && activeMember && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="admin-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '0' }}>
              
              {/* Pagination Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 30px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="nav-button"
                  style={{ opacity: currentIndex === 0 ? 0.3 : 1, padding: '8px' }}
                >
                  <ChevronLeft />
                </button>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  Record <span style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '0 5px' }}>{currentIndex + 1}</span> of {members.length}
                </div>
                <button 
                  onClick={() => setCurrentIndex(prev => Math.min(members.length - 1, prev + 1))}
                  disabled={currentIndex === members.length - 1}
                  className="nav-button"
                  style={{ opacity: currentIndex === members.length - 1 ? 0.3 : 1, padding: '8px' }}
                >
                  <ChevronRight />
                </button>
              </div>

              {/* Profile Data */}
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                <div style={{ borderBottom: '1px solid var(--border-glass-hover)', paddingBottom: '20px' }}>
                  <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '5px' }}>{activeMember.full_name}</h2>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                    <span>UID: <strong style={{ color: 'var(--text-primary)' }}>{activeMember.uid}</strong></span>
                    <span>Year: <strong style={{ color: 'var(--text-primary)' }}>{activeMember.course_year}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>EMAIL_ADDRESS</div>
                    <div style={{ color: 'var(--text-primary)' }}>{activeMember.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>CONTACT_MATRIX</div>
                    <div style={{ color: 'var(--text-primary)' }}>{activeMember.contact_number}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>SELECTED_DOMAINS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(activeMember.areas_of_interest || []).map((domain, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: 'var(--surface-glass)', border: '1px solid var(--accent-secondary)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>COLLABORATION_PREFS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(activeMember.collaboration_preferences || []).map((pref, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '2px solid var(--text-muted)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>EXPECTATIONS_LOG</div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{activeMember.club_expectations || "N/A"}</p>
                </div>

                <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '2px solid var(--text-muted)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>OUTCOME_PREDICTION</div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{activeMember.expected_outcomes || "N/A"}</p>
                </div>

                <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '2px solid var(--accent-secondary)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>OVERRIDE_IDEAS</div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{activeMember.additional_ideas || "None"}</p>
                </div>

              </div>
            </motion.div>
          )}

        </div>
      )}
    </main>
  );
}
