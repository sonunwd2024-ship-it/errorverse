"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { signUp, signIn, logOut, onAuth } from "../lib/auth";
import {
  addError, getErrors, deleteError,
  addCollectionEntry, getCollection, deleteCollectionEntry,
  getStreak, getTodayEntryCount, updateLeaderboard, getLeaderboard,
} from "../lib/db";

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
      color: Math.random() > 0.5 ? "#00d4ff" : "#ff2254",
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#00d4ff"; ctx.globalAlpha = (1 - dist / 100) * 0.08;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

const QUOTES = [
  "Mistakes are the portals of discovery. — James Joyce",
  "An error doesn't become a mistake until you refuse to correct it.",
  "Every expert was once a beginner. — Helen Hayes",
  "The only real mistake is the one from which we learn nothing. — Henry Ford",
  "Pain is temporary. Glory is forever.",
];

const MISTAKE_COLORS: Record<string, string> = { Conceptual: "#00d4ff", Calculation: "#ff2254", "Silly mistake": "#ffd700", "Time pressure": "#a855f7" };
const SUBJECT_COLORS: Record<string, string> = { Physics: "#00d4ff", Math: "#ff2254", Chemistry: "#22c55e", Other: "#f97316" };
const STATUS_COLORS: Record<string, string> = { Completed: "#22c55e", Watching: "#00d4ff", Reading: "#ffd700" };

// Anime/Manhwa gradient themes for collection cards
const CARD_THEMES = [
  { bg: "linear-gradient(135deg, #1a0533 0%, #6b21a8 50%, #ec4899 100%)", accent: "#f0abfc", emoji: "⚔️", label: "Action" },
  { bg: "linear-gradient(135deg, #0c1445 0%, #1e40af 50%, #06b6d4 100%)", accent: "#7dd3fc", emoji: "🌊", label: "Adventure" },
  { bg: "linear-gradient(135deg, #1a0a00 0%, #92400e 50%, #f97316 100%)", accent: "#fed7aa", emoji: "🔥", label: "Shonen" },
  { bg: "linear-gradient(135deg, #0a1a00 0%, #166534 50%, #84cc16 100%)", accent: "#bbf7d0", emoji: "🌸", label: "Slice of Life" },
  { bg: "linear-gradient(135deg, #1a0015 0%, #9d174d 50%, #f43f5e 100%)", accent: "#fda4af", emoji: "💀", label: "Dark Fantasy" },
  { bg: "linear-gradient(135deg, #0f0a1a 0%, #4c1d95 50%, #7c3aed 100%)", accent: "#c4b5fd", emoji: "🔮", label: "Isekai" },
  { bg: "linear-gradient(135deg, #0a0a1a 0%, #1e3a5f 50%, #0ea5e9 100%)", accent: "#bae6fd", emoji: "🤖", label: "Mecha" },
  { bg: "linear-gradient(135deg, #1a1000 0%, #78350f 50%, #fbbf24 100%)", accent: "#fde68a", emoji: "🗡️", label: "Samurai" },
  { bg: "linear-gradient(135deg, #0d1a00 0%, #365314 50%, #65a30d 100%)", accent: "#d9f99d", emoji: "🐉", label: "Fantasy" },
  { bg: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #dc2626 100%)", accent: "#fca5a5", emoji: "🎭", label: "Psychological" },
];

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const slices = data.map((d) => {
    const start = cumulative; const end = cumulative + d.value / total; cumulative = end;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = 50 + 40 * Math.cos(startAngle); const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle); const y2 = 50 + 40 * Math.sin(endAngle);
    const largeArc = d.value / total > 0.5 ? 1 : 0;
    return { ...d, d: `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z` };
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: 160, height: 160 }}>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.85} stroke="#0a0e1a" strokeWidth={0.5}><title>{s.label}: {s.value}</title></path>)}
    </svg>
  );
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.value}</div>
          <div style={{ width: 32, height: `${(d.value / max) * 80}px`, background: `linear-gradient(to top, ${d.color}, ${d.color}88)`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
          <div style={{ fontSize: 9, color: "#64748b", writingMode: "vertical-rl" as const, transform: "rotate(180deg)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function GlassCard({ children, style = {}, onClick, hover = true }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => hover && setHovered(true)} onMouseLeave={() => hover && setHovered(false)}
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: `1px solid ${hovered ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: 20, transition: "all 0.3s ease", transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? "0 8px 32px rgba(0,212,255,0.15)" : "0 4px 16px rgba(0,0,0,0.3)", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

// ─── STREAK CALENDAR (Duolingo style) ─────────────────────────────────────────
function StreakCalendar({ userId, streak, onClose }: { userId: string; streak: number; onClose: () => void }) {
  const today = new Date();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    // fetch daily activity for this month
    import("../lib/db").then(({ getDailyActivityForMonth }) => {
      const y = viewDate.getFullYear();
      const m = viewDate.getMonth();
      getDailyActivityForMonth(userId, y, m).then((days) => setActiveDays(new Set(days)));
    });
  }, [userId, viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <GlassCard hover={false} style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#ffd700" }}>🔥 STREAK CALENDAR</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>

          {/* Streak count */}
          <div style={{ textAlign: "center", marginBottom: 20, padding: "16px", background: "rgba(255,215,0,0.08)", borderRadius: 12, border: "1px solid rgba(255,215,0,0.2)" }}>
            <div style={{ fontSize: 56, fontFamily: "'Bebas Neue', cursive", color: "#ffd700", lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>day streak</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Add 3+ entries daily to keep it alive 🔥</div>
          </div>

          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 16 }}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{monthNames[month]} {year}</span>
            <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 16 }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 700, padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {days.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isActive = activeDays.has(dateStr);
              const isPast = new Date(dateStr) < today && !isToday;
              return (
                <div key={i} style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  fontSize: 12,
                  fontWeight: isToday ? 800 : 500,
                  background: isActive ? "linear-gradient(135deg, #ffd700, #f97316)" : isToday ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "2px solid #00d4ff" : isActive ? "none" : "1px solid rgba(255,255,255,0.05)",
                  color: isActive ? "#000" : isToday ? "#00d4ff" : isPast ? "#334155" : "#94a3b8",
                  position: "relative" as const,
                }}>
                  {day}
                  {isActive && <div style={{ fontSize: 8, marginTop: 1 }}>✓</div>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "linear-gradient(135deg, #ffd700, #f97316)" }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>3+ entries</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, border: "2px solid #00d4ff" }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>Today</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StreakBanner({ todayCount, streak }: { todayCount: number; streak: number }) {
  const needed = Math.max(0, 3 - todayCount);
  const pct = Math.min(100, (todayCount / 3) * 100);
  const qualified = todayCount >= 3;
  return (
    <GlassCard hover={false} style={{ padding: 16, marginBottom: 20, background: qualified ? "rgba(34,197,94,0.08)" : "rgba(255,215,0,0.06)", border: `1px solid ${qualified ? "rgba(34,197,94,0.3)" : "rgba(255,215,0,0.2)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{qualified ? "🔥" : "⏳"}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: qualified ? "#22c55e" : "#ffd700" }}>
            {qualified ? `Streak active! ${streak} day${streak !== 1 ? "s" : ""}` : `Add ${needed} more entr${needed === 1 ? "y" : "ies"} to keep your streak!`}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>{todayCount}/3 today</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: qualified ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #ffd700, #f97316)", borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </GlassCard>
  );
}

function AuthScreen({ onLogin }: { onLogin: (u: any) => void }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputStyle = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      let user;
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        user = await signUp(email, password, name);
      } else {
        user = await signIn(email, password);
      }
      onLogin(user);
    } catch (e: any) {
      const msg = e.code === "auth/user-not-found" ? "No account found."
        : e.code === "auth/wrong-password" ? "Incorrect password."
        : e.code === "auth/email-already-in-use" ? "Email already in use."
        : e.code === "auth/weak-password" ? "Password must be 6+ characters."
        : e.code === "auth/invalid-email" ? "Invalid email."
        : "Something went wrong. Try again.";
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 36, fontFamily: "'Bebas Neue', cursive", letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>ERRORVERSE</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Master your mistakes. Own your story.</p>
        </div>
        <GlassCard hover={false} style={{ padding: 32 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === m ? "rgba(255,255,255,0.08)" : "transparent", color: mode === m ? "#00d4ff" : "#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: 600, borderBottom: mode === m ? "2px solid #00d4ff" : "2px solid transparent", transition: "all 0.2s" }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />}
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            {error && <div style={{ fontSize: 12, color: "#ff2254", padding: "8px 12px", background: "rgba(255,34,84,0.1)", borderRadius: 8 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? "rgba(0,212,255,0.3)" : "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1 }}>
              {loading ? "..." : mode === "login" ? "ENTER THE VERSE" : "BEGIN JOURNEY"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ErrorForm({ onSubmit, onClose }: any) {
  const [form, setForm] = useState({ subject: "Physics", chapter: "", questionType: "Numerical", mistakeType: "Conceptual", solution: "", lesson: "" });
  const inputStyle = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const };
  const set = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <GlassCard hover={false} style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#00d4ff", fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>+ NEW ERROR ENTRY</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>SUBJECT</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.subject} onChange={set("subject")}>{["Physics","Chemistry","Math","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>CHAPTER</label>
                <input style={inputStyle} placeholder="e.g. Kinematics" value={form.chapter} onChange={set("chapter")} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>QUESTION TYPE</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.questionType} onChange={set("questionType")}>{["Numerical","Theory","Proof","MCQ"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>MISTAKE TYPE</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.mistakeType} onChange={set("mistakeType")}>{["Conceptual","Calculation","Silly mistake","Time pressure"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>CORRECT SOLUTION</label>
              <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Write the correct approach..." value={form.solution} onChange={set("solution")} /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>LESSON LEARNED 💡</label>
              <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="What will you remember next time?" value={form.lesson} onChange={set("lesson")} /></div>
            <button onClick={() => { onSubmit({ ...form, date: new Date().toISOString().split("T")[0] }); onClose(); }}
              style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ff2254, #ff6b35)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
              RECORD MISTAKE
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getLeaderboard().then((d) => { setLeaders(d); setLoading(false); }); }, []);
  const MEDALS = ["🥇","🥈","🥉"];
  const rankColors = ["#ffd700","#c0c0c0","#cd7f32"];
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>🏆 Ranked by <strong style={{ color: "#00d4ff" }}>fewest repeated mistakes</strong> — the cleaner your record, the higher you rank!</span>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Loading...</div>
        : leaders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 16, color: "#64748b" }}>No one on the board yet. Add 3+ entries to appear!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leaders.map((leader: any) => (
              <GlassCard key={leader.id} style={{ padding: 16, border: leader.rank <= 3 ? `1px solid ${rankColors[leader.rank-1]}44` : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: leader.rank <= 3 ? 28 : 14, minWidth: 40, textAlign: "center", color: leader.rank <= 3 ? rankColors[leader.rank-1] : "#475569", fontWeight: 800, fontFamily: "'Bebas Neue', cursive" }}>
                    {leader.rank <= 3 ? MEDALS[leader.rank-1] : `#${leader.rank}`}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #ff2254)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {(leader.displayName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{leader.displayName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{leader.totalErrors} errors • 🔥 {leader.streak} day streak</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: leader.repeatedMistakes === 0 ? "#22c55e" : "#ff2254", fontFamily: "'Bebas Neue', cursive" }}>{leader.repeatedMistakes}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>repeated</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
    </div>
  );
}

function ErrorBook({ userId, onUpdate }: { userId: string; onUpdate: () => void }) {
  const [errors, setErrors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterMistake, setFilterMistake] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getErrors(userId).then((d) => { setErrors(d); setLoading(false); }); }, [userId]);

  const handleAdd = async (form: any) => {
    const ref = await addError(userId, form);
    setErrors((p) => [{ id: ref.id, ...form }, ...p]);
    onUpdate();
  };
  const handleDelete = async (id: string) => { await deleteError(id); setErrors((p) => p.filter(e => e.id !== id)); };

  const filtered = errors.filter((e: any) => {
    if (filterSubject !== "All" && e.subject !== filterSubject) return false;
    if (filterMistake !== "All" && e.mistakeType !== filterMistake) return false;
    if (search && !e.chapter?.toLowerCase().includes(search.toLowerCase()) && !e.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const mistakeCounts = errors.reduce((acc: any, e: any) => { acc[e.mistakeType] = (acc[e.mistakeType] || 0) + 1; return acc; }, {});
  const subjectCounts = errors.reduce((acc: any, e: any) => { acc[e.subject] = (acc[e.subject] || 0) + 1; return acc; }, {});
  const mostRepeated = Object.entries(mistakeCounts).sort((a: any, b: any) => b[1] - a[1])[0] as [string, number] | undefined;
  const pieData = Object.entries(mistakeCounts).map(([k, v]) => ({ label: k, value: v as number, color: MISTAKE_COLORS[k] || "#888" }));
  const barData = Object.entries(subjectCounts).map(([k, v]) => ({ label: k, value: v as number, color: SUBJECT_COLORS[k] || "#888" }));
  const chipStyle = (active: boolean, color: string) => ({ padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" });
  const thisWeek = errors.filter((e: any) => (new Date().getTime() - new Date(e.date).getTime()) / 86400000 <= 7).length;

  return (
    <div style={{ paddingBottom: 40 }}>
      {showForm && <ErrorForm onSubmit={handleAdd} onClose={() => setShowForm(false)} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[{ label: "Total Errors", value: errors.length, icon: "📝", color: "#00d4ff" }, { label: "This Week", value: thisWeek, icon: "📅", color: "#ff2254" }, { label: "Resolved", value: Math.floor(errors.length * 0.6), icon: "✅", color: "#22c55e" }].map((s) => (
          <GlassCard key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
      {mostRepeated && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(255,34,84,0.1)", border: "1px solid rgba(255,34,84,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, color: "#ff8099" }}>Most repeated: <strong style={{ color: "#ff2254" }}>{mostRepeated[0]}</strong> ({mostRepeated[1]} times)</span>
        </div>
      )}
      {pieData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <GlassCard style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", letterSpacing: 1 }}>MISTAKE BREAKDOWN</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
              <PieChart data={pieData} /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{pieData.map((d) => (<div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} /><span style={{ fontSize: 12, color: "#94a3b8" }}>{d.label}</span><span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{d.value}</span></div>))}</div>
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", letterSpacing: 1 }}>SUBJECT DISTRIBUTION</h3>
            <BarChart data={barData} />
          </GlassCard>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
        <input style={{ flex: 1, minWidth: 160, padding: "9px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit" }} placeholder="🔍 Search errors..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowForm(true)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Error</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
        {["All","Physics","Chemistry","Math","Other"].map(s => (<button key={s} style={chipStyle(filterSubject===s,"#00d4ff")} onClick={()=>setFilterSubject(s)}>{s}</button>))}
        <span style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {["All","Conceptual","Calculation","Silly mistake","Time pressure"].map(m => (<button key={m} style={chipStyle(filterMistake===m,"#ff2254")} onClick={()=>setFilterMistake(m)}>{m}</button>))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>No errors found. Clean slate! 🎯</div>}
          {filtered.map((error: any) => (
            <GlassCard key={error.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" as const }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, background: `${SUBJECT_COLORS[error.subject]}22`, color: SUBJECT_COLORS[error.subject], border: `1px solid ${SUBJECT_COLORS[error.subject]}44` }}>{error.subject}</span>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, background: `${MISTAKE_COLORS[error.mistakeType]}22`, color: MISTAKE_COLORS[error.mistakeType], border: `1px solid ${MISTAKE_COLORS[error.mistakeType]}44` }}>{error.mistakeType}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{error.chapter}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{error.solution}</div>
                  {error.lesson && <div style={{ fontSize: 12, color: "#ffd700", borderLeft: "2px solid #ffd70044", paddingLeft: 8 }}>💡 {error.lesson}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "#475569" }}>{error.date}</div>
                  <button onClick={() => handleDelete(error.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,34,84,0.3)", background: "rgba(255,34,84,0.1)", color: "#ff2254", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function AnimeCollection({ userId, onUpdate }: { userId: string; onUpdate: () => void }) {
  const [collection, setCollection] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getCollection(userId).then((d) => { setCollection(d); setLoading(false); }); }, [userId]);

  const handleAdd = async () => {
    const title = prompt("Enter title:");
    if (!title) return;
    const entry = { title, type: "Anime", status: "Watching", rating: 8, tags: ["Action"], notes: "", powerLevel: 5000 };
    const ref = await addCollectionEntry(userId, entry);
    setCollection((p) => [{ id: ref.id, ...entry }, ...p]);
    onUpdate();
  };
  const handleDelete = async (id: string) => { await deleteCollectionEntry(id); setCollection((p) => p.filter(e => e.id !== id)); };

  const filtered = collection.filter((a) => {
    if (filterType !== "All" && a.type !== filterType) return false;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    return true;
  });
  const chipStyle = (active: boolean, color: string) => ({ padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" });

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[{ label: "Total", value: collection.length, icon: "📚", color: "#a855f7" }, { label: "Anime", value: collection.filter(a=>a.type==="Anime").length, icon: "📺", color: "#00d4ff" }, { label: "Manga", value: collection.filter(a=>a.type==="Manga").length, icon: "📖", color: "#ff2254" }, { label: "Completed", value: collection.filter(a=>a.status==="Completed").length, icon: "✅", color: "#22c55e" }].map((s) => (
          <GlassCard key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
        {["All","Anime","Manga"].map(t => (<button key={t} style={chipStyle(filterType===t,"#00d4ff")} onClick={()=>setFilterType(t)}>{t}</button>))}
        <span style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {["All","Watching","Reading","Completed"].map(s => (<button key={s} style={chipStyle(filterStatus===s,"#ff2254")} onClick={()=>setFilterStatus(s)}>{s}</button>))}
        <button onClick={handleAdd} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ff2254, #a855f7)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Entry</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Loading...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569", gridColumn: "1/-1" }}>No entries yet! 🎌</div>}
          {filtered.map((item, idx) => {
            const theme = CARD_THEMES[idx % CARD_THEMES.length];
            return (
              <GlassCard key={item.id} style={{ padding: 0, overflow: "hidden", border: "none" }}>
                {/* Anime/Manhwa themed banner */}
                <div style={{ height: 120, background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const, overflow: "hidden" }}>
                  {/* Decorative speed lines */}
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 11px)" }} />
                  {/* Corner glow */}
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${theme.accent}44, transparent)` }} />
                  <div style={{ position: "absolute", bottom: -20, left: -20, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${theme.accent}22, transparent)` }} />
                  {/* Main emoji */}
                  <span style={{ fontSize: 52, filter: `drop-shadow(0 0 16px ${theme.accent})`, position: "relative", zIndex: 1 }}>{theme.emoji}</span>
                  {/* Genre tag */}
                  <span style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(0,0,0,0.4)", color: theme.accent, border: `1px solid ${theme.accent}44`, letterSpacing: 1 }}>{theme.label.toUpperCase()}</span>
                  {/* Status badge */}
                  <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: `${STATUS_COLORS[item.status]}22`, color: STATUS_COLORS[item.status], border: `1px solid ${STATUS_COLORS[item.status]}44` }}>{item.status}</span>
                  {/* Type badge */}
                  <span style={{ position: "absolute", bottom: 8, left: 10, padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(0,0,0,0.5)", color: "#94a3b8" }}>{item.type}</span>
                </div>
                <div style={{ padding: 16, background: "rgba(10,14,26,0.95)" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 10 }}>
                    {(item.tags || []).map((tag: string) => (<span key={tag} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, background: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}33` }}>{tag}</span>))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 2 }}>{Array.from({length:10},(_,i)=>(<span key={i} style={{ fontSize: 10, color: i<item.rating?"#ffd700":"#334155" }}>★</span>))}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ffd700" }}>{item.rating}/10</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "#64748b" }}>⚡ POWER LEVEL</span><span style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{(item.powerLevel||0).toLocaleString()}</span></div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${((item.powerLevel||0)/9999)*100}%`, background: `linear-gradient(90deg, ${theme.accent}, #ff6b35)`, borderRadius: 2 }} /></div>
                  </div>
                  {item.notes && <div style={{ fontSize: 11, color: "#64748b", borderLeft: `2px solid ${theme.accent}44`, paddingLeft: 8, marginBottom: 10 }}>{item.notes}</div>}
                  <button onClick={() => handleDelete(item.id)} style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(255,34,84,0.3)", background: "rgba(255,34,84,0.08)", color: "#ff2254", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🗑 Remove</button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("errors");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const refreshStats = async (uid: string, name: string) => {
    const [s, t] = await Promise.all([getStreak(uid), getTodayEntryCount(uid)]);
    setStreak(s);
    setTodayCount(t);
    const errors = await getErrors(uid);
    const mistakeCounts: Record<string, number> = {};
    errors.forEach((e: any) => { mistakeCounts[e.mistakeType] = (mistakeCounts[e.mistakeType] || 0) + 1; });
    const repeated = Object.values(mistakeCounts).filter(v => v > 1).reduce((a, b) => a + b, 0);
    await updateLeaderboard(uid, name, errors.length, repeated, s);
  };

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) refreshStats(u.uid, u.displayName || u.email || "Anonymous");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#050810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 48 }}>⚡</div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap'); *{margin:0;padding:0;box-sizing:border-box} input::placeholder,textarea::placeholder{color:#334155} select option{background:#0d1117}`}</style>
      <Particles />
      <div style={{ position: "relative", zIndex: 1 }}><AuthScreen onLogin={setUser} /></div>
    </div>
  );

  const TABS = [
    { id: "errors", label: "Error Book", icon: "📝" },
    { id: "collection", label: "Collection", icon: "🎌" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap'); *{margin:0;padding:0;box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#050810} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px} input::placeholder,textarea::placeholder{color:#334155} select option{background:#0d1117}`}</style>
      <Particles />
      {showCalendar && user && <StreakCalendar userId={user.uid} streak={streak} onClose={() => setShowCalendar(false)} />}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ERRORVERSE</span>
          </div>
          <div style={{ flex: 1, margin: "0 24px", overflow: "hidden" }}>
            <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap" as const, fontStyle: "italic" }}>"{QUOTES[quoteIdx]}"</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Clickable streak button */}
            <button onClick={() => setShowCalendar(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: streak > 0 ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${streak > 0 ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, color: streak > 0 ? "#ffd700" : "#475569", fontWeight: 700 }}>{streak} day streak</span>
            </button>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #ff2254)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <button onClick={() => logOut()} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Logout</button>
          </div>
        </header>

        {(activeTab === "errors" || activeTab === "collection") && (
          <StreakBanner todayCount={todayCount} streak={streak} />
        )}

        <div style={{ display: "flex", gap: 4, marginBottom: 24, padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: activeTab===tab.id?"rgba(255,255,255,0.08)":"transparent", color: activeTab===tab.id?"#e2e8f0":"#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: activeTab===tab.id?600:400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          {activeTab === "errors" && <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>DAILY <span style={{ color: "#ff2254" }}>ERROR</span> BOOK</h1>}
          {activeTab === "collection" && <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>ANIME <span style={{ color: "#a855f7" }}>COLLECTION</span></h1>}
          {activeTab === "leaderboard" && <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>🏆 <span style={{ color: "#ffd700" }}>LEADERBOARD</span></h1>}
        </div>

        {activeTab === "errors" && <ErrorBook userId={user.uid} onUpdate={() => refreshStats(user.uid, user.displayName || user.email || "Anonymous")} />}
        {activeTab === "collection" && <AnimeCollection userId={user.uid} onUpdate={() => refreshStats(user.uid, user.displayName || user.email || "Anonymous")} />}
        {activeTab === "leaderboard" && <Leaderboard />}
      </div>
    </div>
  );
}