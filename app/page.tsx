"use client";
import { useState, useEffect, useRef } from "react";

// ── Particle Canvas ──────────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
if (!canvas) return;
const ctx = canvas.getContext("2d");
if (!ctx) return;
```

---

Then save with **Ctrl + S** and run these commands in Command Prompt:

**Command 1:**
```
git add app/page.tsx
```

**Command 2:**
```
git commit -m "fix typescript error"
```

**Command 3:**
```
git push origin main --force

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: Math.random() > 0.5 ? "#00d4ff" : "#ff2254",
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
      });
      // Draw faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#00d4ff";
            ctx.globalAlpha = (1 - dist / 100) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Quotes ───────────────────────────────────────────────────────────────────
const QUOTES = [
  "Mistakes are the portals of discovery. — James Joyce",
  "An error doesn't become a mistake until you refuse to correct it. — Orlando A. Battista",
  "Every expert was once a beginner. — Helen Hayes",
  "The only real mistake is the one from which we learn nothing. — Henry Ford",
  "Pain is temporary. Glory is forever. — Unknown",
  "A ship in harbor is safe, but that is not what ships are for. — John A. Shedd",
];

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_ERRORS = [
  { id: 1, subject: "Physics", chapter: "Kinematics", questionType: "Numerical", mistakeType: "Calculation", lesson: "Always double check sign conventions", date: "2025-02-18", solution: "v = u + at, applied correctly gives v = 15 m/s" },
  { id: 2, subject: "Math", chapter: "Integration", questionType: "Proof", mistakeType: "Conceptual", lesson: "Understood the limits of integration properly", date: "2025-02-17", solution: "Used substitution u = sinx correctly" },
  { id: 3, subject: "Chemistry", chapter: "Equilibrium", questionType: "Theory", mistakeType: "Silly mistake", lesson: "Read the question more carefully", date: "2025-02-16", solution: "Kp = Kc(RT)^Δn, Δn was miscounted" },
  { id: 4, subject: "Math", chapter: "Vectors", questionType: "Numerical", mistakeType: "Time pressure", lesson: "Practice speed for dot product questions", date: "2025-02-15", solution: "a·b = |a||b|cosθ" },
  { id: 5, subject: "Physics", chapter: "Thermodynamics", questionType: "Conceptual", mistakeType: "Conceptual", lesson: "Entropy increases in irreversible processes", date: "2025-02-14", solution: "ΔS > 0 for irreversible" },
];

const MOCK_ANIME = [
  { id: 1, title: "Attack on Titan", type: "Anime", status: "Completed", rating: 10, tags: ["Action", "Psychological"], notes: "Masterpiece. The ending divided fans but the journey was phenomenal.", powerLevel: 9800 },
  { id: 2, title: "Vagabond", type: "Manga", status: "Reading", rating: 10, tags: ["Action", "Philosophical"], notes: "Inoue's art is transcendent. Miyamoto Musashi's journey is deeply moving.", powerLevel: 9999 },
  { id: 3, title: "Death Note", type: "Anime", status: "Completed", rating: 9, tags: ["Psychological", "Thriller"], notes: "The cat-and-mouse dynamic between Light and L is unparalleled.", powerLevel: 8500 },
  { id: 4, title: "Berserk", type: "Manga", status: "Reading", rating: 10, tags: ["Dark Fantasy", "Action"], notes: "Guts' saga is the most brutal and beautiful thing in manga.", powerLevel: 9700 },
  { id: 5, title: "Vinland Saga", type: "Anime", status: "Completed", rating: 9, tags: ["Action", "Historical"], notes: "Season 2 was unexpected perfection. Thorfinn's growth is inspiring.", powerLevel: 8800 },
  { id: 6, title: "Chainsaw Man", type: "Manga", status: "Reading", rating: 9, tags: ["Action", "Psychological"], notes: "Fujimoto breaks every trope. Shocking and brilliant.", powerLevel: 9200 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const MISTAKE_COLORS = {
  Conceptual: "#00d4ff",
  Calculation: "#ff2254",
  "Silly mistake": "#ffd700",
  "Time pressure": "#a855f7",
};

const SUBJECT_COLORS = {
  Physics: "#00d4ff",
  Math: "#ff2254",
  Chemistry: "#22c55e",
  Other: "#f97316",
};

const STATUS_COLORS = {
  Completed: "#22c55e",
  Watching: "#00d4ff",
  Reading: "#ffd700",
};

// ── Pie Chart SVG ─────────────────────────────────────────────────────────────
function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const slices = data.map((d) => {
    const start = cumulative;
    const end = cumulative + d.value / total;
    cumulative = end;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle);
    const y2 = 50 + 40 * Math.sin(endAngle);
    const largeArc = d.value / total > 0.5 ? 1 : 0;
    return { ...d, d: `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z` };
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: 160, height: 160 }}>
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.85} stroke="#0a0e1a" strokeWidth={0.5}>
          <title>{s.label}: {s.value}</title>
        </path>
      ))}
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.value}</div>
          <div style={{
            width: 32, height: `${(d.value / max) * 80}px`,
            background: `linear-gradient(to top, ${d.color}, ${d.color}88)`,
            borderRadius: "4px 4px 0 0",
            transition: "height 0.6s ease",
            minHeight: 4,
          }} />
          <div style={{ fontSize: 9, color: "#64748b", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Glass Card ────────────────────────────────────────────────────────────────
function GlassCard({ children, style = {}, onClick, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${hovered ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: 20,
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(0,212,255,0.15)" : "0 4px 16px rgba(0,0,0,0.3)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 36, fontFamily: "'Bebas Neue', cursive", letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            ERRORVERSE
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Master your mistakes. Own your story.</p>
        </div>
        <GlassCard hover={false} style={{ padding: 32 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: mode === m ? "linear-gradient(135deg, #00d4ff22, #ff225522)" : "transparent",
                color: mode === m ? "#00d4ff" : "#64748b",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                borderBottom: mode === m ? "2px solid #00d4ff" : "2px solid transparent",
                transition: "all 0.2s",
              }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            )}
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button
              onClick={() => onLogin({ name: name || "Student", email })}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #00d4ff, #0066ff)",
                color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
                cursor: "pointer", letterSpacing: 1,
                boxShadow: "0 0 20px rgba(0,212,255,0.3)",
                transition: "all 0.2s",
              }}
            >
              {mode === "login" ? "ENTER THE VERSE" : "BEGIN JOURNEY"}
            </button>
          </div>
          <p style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: 16, marginBottom: 0 }}>
            Demo mode — no real backend required
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Error Entry Form ──────────────────────────────────────────────────────────
function ErrorForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    subject: "Physics", chapter: "", questionType: "Numerical",
    mistakeType: "Conceptual", solution: "", lesson: "",
  });
  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#e2e8f0", fontSize: 13,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <GlassCard hover={false} style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#00d4ff", fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>
              + NEW ERROR ENTRY
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>SUBJECT</label>
                <select style={selectStyle} value={form.subject} onChange={set("subject")}>
                  {["Physics", "Chemistry", "Math", "Other"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>CHAPTER</label>
                <input style={inputStyle} placeholder="e.g. Kinematics" value={form.chapter} onChange={set("chapter")} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>QUESTION TYPE</label>
                <select style={selectStyle} value={form.questionType} onChange={set("questionType")}>
                  {["Numerical", "Theory", "Proof", "MCQ"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>MISTAKE TYPE</label>
                <select style={selectStyle} value={form.mistakeType} onChange={set("mistakeType")}>
                  {["Conceptual", "Calculation", "Silly mistake", "Time pressure"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>CORRECT SOLUTION</label>
              <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Write the correct approach & solution..." value={form.solution} onChange={set("solution")} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>LESSON LEARNED 💡</label>
              <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="What will you remember next time?" value={form.lesson} onChange={set("lesson")} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)", cursor: "pointer" }}>
              <span style={{ fontSize: 18 }}>📸</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Upload screenshot (optional)</span>
            </div>
            <button
              onClick={() => { onSubmit({ ...form, id: Date.now(), date: new Date().toISOString().split("T")[0] }); onClose(); }}
              style={{
                padding: "12px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #ff2254, #ff6b35)",
                color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                cursor: "pointer", letterSpacing: 1, marginTop: 4,
              }}
            >
              RECORD MISTAKE
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Error Book Dashboard ──────────────────────────────────────────────────────
function ErrorBook({ errors, onAddError }) {
  const [showForm, setShowForm] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterMistake, setFilterMistake] = useState("All");
  const [search, setSearch] = useState("");
  const [streak] = useState(7);

  const filtered = errors.filter((e) => {
    if (filterSubject !== "All" && e.subject !== filterSubject) return false;
    if (filterMistake !== "All" && e.mistakeType !== filterMistake) return false;
    if (search && !e.chapter.toLowerCase().includes(search.toLowerCase()) && !e.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const mistakeCounts = errors.reduce((acc, e) => { acc[e.mistakeType] = (acc[e.mistakeType] || 0) + 1; return acc; }, {});
  const subjectCounts = errors.reduce((acc, e) => { acc[e.subject] = (acc[e.subject] || 0) + 1; return acc; }, {});
  const mostRepeated = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];

  const pieData = Object.entries(mistakeCounts).map(([k, v]) => ({ label: k, value: v, color: MISTAKE_COLORS[k] || "#888" }));
  const barData = Object.entries(subjectCounts).map(([k, v]) => ({ label: k, value: v, color: SUBJECT_COLORS[k] || "#888" }));

  const chipStyle = (active, color) => ({
    padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
    background: active ? `${color}22` : "transparent", color: active ? color : "#64748b",
    fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  });

  return (
    <div style={{ padding: "0 0 40px" }}>
      {showForm && <ErrorForm onSubmit={onAddError} onClose={() => setShowForm(false)} />}

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Errors", value: errors.length, icon: "📝", color: "#00d4ff" },
          { label: "This Week", value: 3, icon: "📅", color: "#ff2254" },
          { label: "Day Streak", value: streak, icon: "🔥", color: "#ffd700" },
          { label: "Resolved", value: Math.floor(errors.length * 0.6), icon: "✅", color: "#22c55e" },
        ].map((s) => (
          <GlassCard key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Alert */}
      {mostRepeated && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: "rgba(255,34,84,0.1)", border: "1px solid rgba(255,34,84,0.3)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, color: "#ff8099" }}>
            Most repeated mistake: <strong style={{ color: "#ff2254" }}>{mostRepeated[0]}</strong> ({mostRepeated[1]} times). Time to fix this pattern.
          </span>
        </div>
      )}

      {/* Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", letterSpacing: 1 }}>MISTAKE BREAKDOWN</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <PieChart data={pieData} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pieData.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{d.label}</span>
                  <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", letterSpacing: 1 }}>SUBJECT DISTRIBUTION</h3>
          <BarChart data={barData} />
        </GlassCard>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{
            flex: 1, minWidth: 160, padding: "9px 14px", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0",
            fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
          placeholder="🔍 Search errors..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #00d4ff, #0066ff)",
            color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          + Add Error
        </button>
        <button
          style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)", color: "#64748b", fontFamily: "inherit",
            fontSize: 13, cursor: "pointer",
          }}
        >
          📥 Export PDF
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "Physics", "Chemistry", "Math", "Other"].map((s) => (
          <button key={s} style={chipStyle(filterSubject === s, "#00d4ff")} onClick={() => setFilterSubject(s)}>{s}</button>
        ))}
        <span style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {["All", "Conceptual", "Calculation", "Silly mistake", "Time pressure"].map((m) => (
          <button key={m} style={chipStyle(filterMistake === m, "#ff2254")} onClick={() => setFilterMistake(m)}>{m}</button>
        ))}
      </div>

      {/* Error Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>No errors found. Clean slate! 🎯</div>
        )}
        {filtered.map((error) => (
          <GlassCard key={error.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, background: `${SUBJECT_COLORS[error.subject]}22`, color: SUBJECT_COLORS[error.subject], border: `1px solid ${SUBJECT_COLORS[error.subject]}44` }}>
                    {error.subject}
                  </span>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, background: `${MISTAKE_COLORS[error.mistakeType]}22`, color: MISTAKE_COLORS[error.mistakeType], border: `1px solid ${MISTAKE_COLORS[error.mistakeType]}44` }}>
                    {error.mistakeType}
                  </span>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
                    {error.questionType}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{error.chapter}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{error.solution}</div>
                {error.lesson && (
                  <div style={{ fontSize: 12, color: "#ffd700", borderLeft: "2px solid #ffd70044", paddingLeft: 8 }}>
                    💡 {error.lesson}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{error.date}</div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Anime Collection ──────────────────────────────────────────────────────────
function AnimeCollection() {
  const [collection, setCollection] = useState(MOCK_ANIME);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", type: "Anime", status: "Watching", rating: 8, tags: [], notes: "", powerLevel: 5000 });

  const filtered = collection.filter((a) => {
    if (filterType !== "All" && a.type !== filterType) return false;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    return true;
  });

  const ALL_TAGS = ["Action", "Psychological", "Romance", "Dark Fantasy", "Thriller", "Historical", "Philosophical", "Sci-Fi"];

  const chipStyle = (active, color) => ({
    padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
    background: active ? `${color}22` : "transparent", color: active ? color : "#64748b",
    fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  });

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#e2e8f0", fontSize: 13,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  // Anime card emoji avatars
  const AVATARS = ["⚔️", "📖", "🌙", "🗡️", "🐉", "🔮", "🌸", "⚡", "🎭", "🌊"];

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <GlassCard hover={false} style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#ff2254", fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>+ ADD TO COLLECTION</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input style={inputStyle} placeholder="Title" value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={newEntry.type} onChange={e => setNewEntry(p => ({ ...p, type: e.target.value }))}>
                    <option>Anime</option><option>Manga</option>
                  </select>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={newEntry.status} onChange={e => setNewEntry(p => ({ ...p, status: e.target.value }))}>
                    <option>Watching</option><option>Reading</option><option>Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>RATING: {newEntry.rating}/10</label>
                  <input type="range" min={1} max={10} value={newEntry.rating} onChange={e => setNewEntry(p => ({ ...p, rating: +e.target.value }))} style={{ width: "100%", accentColor: "#ff2254" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>POWER LEVEL: {newEntry.powerLevel.toLocaleString()}</label>
                  <input type="range" min={100} max={9999} value={newEntry.powerLevel} onChange={e => setNewEntry(p => ({ ...p, powerLevel: +e.target.value }))} style={{ width: "100%", accentColor: "#ffd700" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>TAGS</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ALL_TAGS.map(tag => {
                      const active = newEntry.tags.includes(tag);
                      return <button key={tag} style={chipStyle(active, "#a855f7")} onClick={() => setNewEntry(p => ({ ...p, tags: active ? p.tags.filter(t => t !== tag) : [...p.tags, tag] }))}>{tag}</button>;
                    })}
                  </div>
                </div>
                <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} placeholder="Personal notes..." value={newEntry.notes} onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))} />
                <button
                  onClick={() => { if (newEntry.title) { setCollection(p => [{ ...newEntry, id: Date.now() }, ...p]); setShowAdd(false); setNewEntry({ title: "", type: "Anime", status: "Watching", rating: 8, tags: [], notes: "", powerLevel: 5000 }); } }}
                  style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ff2254, #a855f7)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}
                >
                  ADD TO COLLECTION
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", value: collection.length, icon: "📚", color: "#a855f7" },
          { label: "Anime", value: collection.filter(a => a.type === "Anime").length, icon: "📺", color: "#00d4ff" },
          { label: "Manga", value: collection.filter(a => a.type === "Manga").length, icon: "📖", color: "#ff2254" },
          { label: "Completed", value: collection.filter(a => a.status === "Completed").length, icon: "✅", color: "#22c55e" },
        ].map((s) => (
          <GlassCard key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["All", "Anime", "Manga"].map(t => (
          <button key={t} style={chipStyle(filterType === t, "#00d4ff")} onClick={() => setFilterType(t)}>{t}</button>
        ))}
        <span style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {["All", "Watching", "Reading", "Completed"].map(s => (
          <button key={s} style={chipStyle(filterStatus === s, "#ff2254")} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ff2254, #a855f7)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          + Add Entry
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((item, idx) => {
          const avatar = AVATARS[idx % AVATARS.length];
          return (
            <GlassCard key={item.id} style={{ padding: 0, overflow: "hidden" }}>
              {/* Cover */}
              <div style={{
                height: 80, background: `linear-gradient(135deg, ${["#0d1b2a", "#1a0a2e", "#0a1a0d", "#2a0a0a"][idx % 4]}, #0a0e1a)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative",
              }}>
                <span style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}>{avatar}</span>
                <span style={{
                  position: "absolute", top: 8, right: 8, padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700,
                  background: `${STATUS_COLORS[item.status]}22`, color: STATUS_COLORS[item.status], border: `1px solid ${STATUS_COLORS[item.status]}44`,
                }}>{item.status}</span>
                <span style={{
                  position: "absolute", top: 8, left: 8, padding: "3px 10px", borderRadius: 12, fontSize: 10,
                  background: "rgba(255,255,255,0.08)", color: "#94a3b8",
                }}>{item.type}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{item.title}</div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {item.tags.map(tag => (
                    <span key={tag} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>{tag}</span>
                  ))}
                </div>

                {/* Rating */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i} style={{ fontSize: 10, color: i < item.rating ? "#ffd700" : "#334155" }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffd700" }}>{item.rating}/10</span>
                </div>

                {/* Power Level */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>⚡ POWER LEVEL</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#ffd700" }}>{item.powerLevel.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(item.powerLevel / 9999) * 100}%`, background: "linear-gradient(90deg, #ffd700, #ff6b35)", borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>

                {item.notes && (
                  <div style={{ fontSize: 11, color: "#64748b", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 8, lineHeight: 1.5 }}>
                    {item.notes}
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel() {
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <span style={{ fontSize: 12, color: "#00d4ff" }}>🔐 Admin Mode — Full management access</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {[
          { icon: "👥", label: "User Management", desc: "View all users, manage accounts", color: "#00d4ff" },
          { icon: "📚", label: "Anime Database", desc: "Add/edit/delete anime & manga entries", color: "#ff2254" },
          { icon: "📊", label: "Analytics", desc: "Platform-wide error statistics", color: "#ffd700" },
          { icon: "⚙️", label: "System Settings", desc: "Configure platform options", color: "#a855f7" },
          { icon: "📤", label: "Export Data", desc: "Bulk export user error books", color: "#22c55e" },
          { icon: "🔔", label: "Notifications", desc: "Send announcements to users", color: "#f97316" },
        ].map((item) => (
          <GlassCard key={item.label} style={{ padding: 20, cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("errors");
  const [errors, setErrors] = useState(MOCK_ERRORS);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
    const interval = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #050810; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        `}</style>
        <Particles />
        <div style={{ position: "relative", zIndex: 1 }}>
          <AuthScreen onLogin={setUser} />
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "errors", label: "Error Book", icon: "📝" },
    { id: "collection", label: "Collection", icon: "🎌" },
    { id: "admin", label: "Admin", icon: "🔐" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #050810; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #334155; }
        select option { background: #0d1117; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>

      <Particles />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 20,
          animation: "fadeUp 0.6s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ERRORVERSE
            </span>
          </div>

          {/* Quote ticker */}
          <div style={{ flex: 1, margin: "0 24px", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", fontStyle: "italic" }}>
              "{QUOTES[quoteIdx]}"
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>7 day streak</span>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #ff2254)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              title={user.name}>
              {user.name[0].toUpperCase()}
            </div>
            <button onClick={() => setUser(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: activeTab === tab.id ? "#e2e8f0" : "#64748b",
                fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                transition: "all 0.2s",
                boxShadow: activeTab === tab.id ? "0 0 0 1px rgba(255,255,255,0.1)" : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && tab.id === "errors" && (
                <span style={{ background: "#ff2254", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{errors.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Page title */}
        <div style={{ marginBottom: 20, animation: "fadeUp 0.5s ease" }}>
          {activeTab === "errors" && (
            <div>
              <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>
                DAILY <span style={{ color: "#ff2254" }}>ERROR</span> BOOK
              </h1>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Track your mistakes. Build mastery. — Welcome back, {user.name}</p>
            </div>
          )}
          {activeTab === "collection" && (
            <div>
              <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>
                ANIME <span style={{ color: "#a855f7" }}>COLLECTION</span>
              </h1>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Your curated universe of anime & manga.</p>
            </div>
          )}
          {activeTab === "admin" && (
            <div>
              <h1 style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: "#e2e8f0" }}>
                ADMIN <span style={{ color: "#00d4ff" }}>PANEL</span>
              </h1>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Platform management & controls.</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          {activeTab === "errors" && <ErrorBook errors={errors} onAddError={(e) => setErrors((p) => [e, ...p])} />}
          {activeTab === "collection" && <AnimeCollection />}
          {activeTab === "admin" && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}
