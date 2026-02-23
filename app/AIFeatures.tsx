"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#e2e8f0", fontSize: 14,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

// ─── API CALL — uses Next.js /api/gemini route (no CORS!) ────────────────────

async function askGemini(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage }),
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "API error");
  return data.text || "";
}

// ─── TYPING DOTS ──────────────────────────────────────────────────────────────

function TypingDots({ color = "#00d4ff" }: { color?: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "12px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: color, animation: `typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`, opacity: 0.8 }} />
      ))}
      <span style={{ fontSize: 12, color: "#475569", marginLeft: 6 }}>AI is thinking...</span>
    </div>
  );
}

// ─── AI RESPONSE RENDERER ─────────────────────────────────────────────────────

function AIResponse({ text, color = "#00d4ff" }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
        if (line.startsWith("## ")) return <div key={i} style={{ fontSize: 16, fontWeight: 800, color, marginTop: 10, fontFamily: "'Bebas Neue',cursive", letterSpacing: 1.5 }}>{line.replace("## ", "")}</div>;
        if (line.startsWith("# "))  return <div key={i} style={{ fontSize: 19, fontWeight: 800, color, marginTop: 10, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}>{line.replace("# ", "")}</div>;
        if (line.match(/^\*\*(.+)\*\*$/)) return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginTop: 4 }}>{line.replace(/\*\*/g, "")}</div>;
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#94a3b8", paddingLeft: 4 }}>
            <span style={{ color, flexShrink: 0 }}>▸</span>
            <span style={{ lineHeight: 1.6 }}>{line.replace(/^[-•] /, "")}</span>
          </div>
        );
        if (line.match(/^\d+\./)) return (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#94a3b8", paddingLeft: 4 }}>
            <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span>
            <span style={{ lineHeight: 1.6 }}>{line.replace(/^\d+\.\s*/, "")}</span>
          </div>
        );
        if (/^[💡⚠️🎯🔥✅📌🧠⚡🎌📚]/.test(line)) return (
          <div key={i} style={{ fontSize: 13, color: "#e2e8f0", padding: "9px 13px", background: `${color}12`, borderRadius: 9, borderLeft: `3px solid ${color}55`, lineHeight: 1.6 }}>{line}</div>
        );
        return <div key={i} style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{line}</div>;
      })}
    </div>
  );
}

// ─── CANCEL BUTTON ────────────────────────────────────────────────────────────

function CancelButton({ onCancel }: { onCancel: () => void }) {
  return (
    <button
      onClick={onCancel}
      style={{
        width: "100%", padding: "10px", borderRadius: 12,
        border: "1px solid rgba(255,34,84,0.3)",
        background: "rgba(255,34,84,0.06)", color: "#ff2254",
        fontFamily: "inherit", fontSize: 13, cursor: "pointer", marginBottom: 8,
        transition: "all 0.2s",
      }}
    >
      ✕ Cancel Request
    </button>
  );
}

// ─── ERROR ALERT ──────────────────────────────────────────────────────────────

function ErrorAlert({ msg }: { msg: string }) {
  const isApiKey = msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("not configured");
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "rgba(255,34,84,0.08)", border: "1px solid rgba(255,34,84,0.3)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#ff2254", marginBottom: 8 }}>
        {isApiKey ? "⚙️ API Key Needed" : "❌ Error"}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>
        {isApiKey ? (
          <>
            Add your Gemini API key to make AI work:<br />
            1. Go to <strong style={{ color: "#00d4ff" }}>vercel.com</strong> → Project → Settings → Environment Variables<br />
            2. Add variable: <code style={{ background: "rgba(0,212,255,0.1)", padding: "2px 8px", borderRadius: 4, color: "#00d4ff" }}>GEMINI_API_KEY</code><br />
            3. Get your free key at <strong style={{ color: "#00d4ff" }}>aistudio.google.com</strong><br />
            4. Redeploy → Done! ✅
          </>
        ) : msg}
      </div>
    </div>
  );
}

// ─── CENTERED WRAPPER ─────────────────────────────────────────────────────────

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 700, margin: "0 auto" }}>{children}</div>;
}

function Glass({ children, style = {}, ref: _ref }: { children: React.ReactNode; style?: React.CSSProperties; ref?: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={_ref} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SOLUTION EXPLAINER
// ═══════════════════════════════════════════════════════════════════════════════

function AISolutionExplainer({ errors }: { errors: any[] }) {
  const [selected, setSelected] = useState<any>(null);
  const [customQ, setCustomQ] = useState("");
  const [response, setResponse] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"error" | "custom">("error");
  const [depth, setDepth] = useState<"simple" | "detailed" | "exam">("simple");
  const ref = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const DEPTH = {
    simple:   { label: "Simple 🐣",     color: "#22c55e", desc: "ELI5 — beginner friendly" },
    detailed: { label: "Detailed 📚",   color: "#00d4ff", desc: "Full concept + examples" },
    exam:     { label: "Exam Mode 🎯",  color: "#ff2254", desc: "JEE/NEET strategy & timing" },
  };

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const explain = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setResponse(""); setErr("");
    try {
      const sys = `You are an expert JEE/NEET tutor. Explain Physics, Chemistry, and Math with extreme clarity using analogies, step-by-step breakdowns, and exam tips. Format with ## headers, bullet points with -, numbered steps. Be encouraging. Under 400 words.`;
      const msg = mode === "error" && selected
        ? `Student made a ${selected.mistakeType} mistake in ${selected.subject}, Chapter: ${selected.chapter}.\nSolution: "${selected.solution}"\n${selected.formula ? `Formula: ${selected.formula}` : ""}\n${selected.whyMistake ? `Why they think: "${selected.whyMistake}"` : ""}\nDepth: ${DEPTH[depth].desc}\n1. Correct concept 2. Why they made this mistake 3. Memory trick 4. ${depth === "exam" ? "JEE/NEET exam approach" : "Similar example"}`
        : `JEE/NEET student asks: "${customQ}"\nDepth: ${DEPTH[depth].desc}\nGive a clear structured explanation.`;
      const result = await askGemini(sys, msg, abortRef.current.signal);
      setResponse(result);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <Center>
      {/* Mode */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
        {(["error", "custom"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: "11px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === m ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)", color: mode === m ? "#00d4ff" : "#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: 700, borderBottom: mode === m ? "2px solid #00d4ff" : "2px solid transparent", transition: "all 0.2s" }}>
            {m === "error" ? "📝 Pick from My Errors" : "✏️ Ask Anything"}
          </button>
        ))}
      </div>

      {/* Depth */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>EXPLANATION DEPTH</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {(Object.entries(DEPTH) as any[]).map(([k, v]) => (
            <button key={k} onClick={() => setDepth(k)} style={{ padding: "10px 8px", borderRadius: 10, border: `1px solid ${depth === k ? v.color : "rgba(255,255,255,0.08)"}`, background: depth === k ? `${v.color}18` : "rgba(255,255,255,0.02)", color: depth === k ? v.color : "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center" as const, transition: "all 0.2s" }}>
              <div>{v.label}</div>
              <div style={{ fontSize: 9, opacity: 0.65, marginTop: 3 }}>{v.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      {mode === "error" ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>SELECT AN ERROR</div>
          {errors.length === 0
            ? <Glass style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 13 }}>No errors yet — log some in Error Book first!</Glass>
            : <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {errors.slice(0, 20).map(e => (
                  <div
                    key={e.id}
                    onClick={() => setSelected(e)}
                    style={{
                      padding: "12px 16px", cursor: "pointer", borderRadius: 16,
                      background: selected?.id === e.id ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected?.id === e.id ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.06)"}`,
                      backdropFilter: "blur(14px)", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{e.chapter}</span>
                        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 10 }}>{e.subject} · {e.mistakeType}</span>
                      </div>
                      {selected?.id === e.id && <span style={{ color: "#00d4ff" }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      ) : (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>YOUR QUESTION</div>
          <textarea value={customQ} onChange={e => setCustomQ(e.target.value)} style={{ ...INP, height: 96, resize: "none" } as any} placeholder="e.g. 'Why does a projectile travel in a parabola?' or paste any solution you don't understand..." />
        </div>
      )}

      {loading && <CancelButton onCancel={cancel} />}

      <button onClick={explain} disabled={loading || (mode === "error" ? !selected : !customQ.trim())} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", color: loading ? "#475569" : "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1, marginBottom: 16 }}>
        {loading ? "Thinking..." : "✨ EXPLAIN IT TO ME"}
      </button>

      {err && <ErrorAlert msg={err} />}

      {(loading || response) && !err && (
        <div ref={ref} style={{ padding: 24, border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.02)", backdropFilter: "blur(14px)", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <span style={{ fontSize: 12, color: "#00d4ff", fontWeight: 700, letterSpacing: 1 }}>GEMINI AI TUTOR</span>
          </div>
          {loading ? <TypingDots color="#00d4ff" /> : (
            <>
              <AIResponse text={response} color="#00d4ff" />
              <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={explain} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.08)", color: "#00d4ff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Again</button>
                <button onClick={() => navigator.clipboard.writeText(response)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📋 Copy</button>
              </div>
            </>
          )}
        </div>
      )}
    </Center>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STUDY COACH
// ═══════════════════════════════════════════════════════════════════════════════

function AIStudyCoach({ errors }: { errors: any[] }) {
  const [plan, setPlan] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [planType, setPlanType] = useState<"daily" | "weekly" | "subject">("daily");
  const [subject, setSubject] = useState("Physics");
  const ref = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const chMap: Record<string, { count: number; subject: string }> = {};
  errors.forEach(e => { const k = `${e.subject}__${e.chapter}`; if (!chMap[k]) chMap[k] = { count: 0, subject: e.subject }; chMap[k].count++; });
  const weak = Object.entries(chMap).sort((a, b) => b[1].count - a[1].count).slice(0, 6).map(([k, v]) => ({ chapter: k.split("__")[1], ...v }));
  const subBreak = errors.reduce((a: any, e) => { a[e.subject] = (a[e.subject] || 0) + 1; return a; }, {});
  const topMistake = Object.entries(errors.reduce((a: any, e) => { a[e.mistakeType] = (a[e.mistakeType] || 0) + 1; return a; }, {})).sort((a: any, b: any) => b[1] - a[1])[0];
  const mastered = errors.filter(e => e.masteryStage === "green").length;
  const weakCount = errors.filter(e => e.masteryStage === "red").length;
  const COLORS: Record<string, string> = { Physics: "#00d4ff", Chemistry: "#22c55e", Math: "#ff2254", Other: "#f97316" };

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const generate = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setPlan(""); setErr("");
    try {
      const sys = `You are an elite JEE/NEET study strategist. Create sharp personalized study plans. Be direct and specific. Use ## headers, bullet points, numbered steps with time estimates. Max 500 words.`;
      const ctx = `Data: total=${errors.length}, mastered=${mastered}, weak=${weakCount}, top mistake=${topMistake ? `${topMistake[0]}(${topMistake[1]}x)` : "N/A"}, subjects=${JSON.stringify(subBreak)}, weak chapters=${weak.slice(0, 5).map(c => `${c.chapter}(${c.subject},${c.count})`).join(",")}`;
      const msg = planType === "daily"
        ? `${ctx}\n\nDaily Battle Plan: exact time blocks, which chapter to focus on & why, mistake types to target, mindset tip, measurable goal.`
        : planType === "weekly"
        ? `${ctx}\n\n7-Day War Plan: day-by-day chapters, mistake types to crush, revision days, weekly goal.`
        : `${ctx}\n\nSubject Deep-Dive for ${subject}. Errors: ${subBreak[subject] || 0}. Weak chapters: ${weak.filter(c => c.subject === subject).map(c => c.chapter).join(",") || "none"}. Chapter priority, error patterns, fix strategies.`;
      const result = await askGemini(sys, msg, abortRef.current.signal);
      setPlan(result);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <Center>
      {/* Stats */}
      {errors.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Total",    value: errors.length, color: "#00d4ff" },
            { label: "Weak 🔴",  value: weakCount,      color: "#ff2254" },
            { label: "Mastered", value: mastered,        color: "#22c55e" },
            { label: "Top Err",  value: (topMistake?.[0] as string)?.split(" ")[0] ?? "—", color: "#ffd700" },
          ].map(s => (
            <Glass key={s.label} style={{ padding: "10px 6px", textAlign: "center" as const }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{s.label}</div>
            </Glass>
          ))}
        </div>
      )}

      {/* Weak spots */}
      {weak.length > 0 && (
        <Glass style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>🔥 AI WILL TARGET THESE</div>
          {weak.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "#475569", width: 14 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{c.chapter}</span>
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 5, background: `${COLORS[c.subject] || "#888"}18`, color: COLORS[c.subject] || "#888" }}>{c.subject}</span>
              <div style={{ width: 48, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(c.count / weak[0].count) * 100}%`, background: COLORS[c.subject] || "#888", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, color: "#475569", width: 14, textAlign: "right" as const }}>{c.count}</span>
            </div>
          ))}
        </Glass>
      )}

      {/* Plan type */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>PLAN TYPE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {([
          { id: "daily",   icon: "☀️", label: "Daily Plan",    desc: "Today's battle" },
          { id: "weekly",  icon: "📅", label: "Weekly War",    desc: "7-day strategy" },
          { id: "subject", icon: "📚", label: "Subject Focus", desc: "One subject deep" },
        ] as const).map(p => (
          <button key={p.id} onClick={() => setPlanType(p.id)} style={{ padding: "14px 8px", borderRadius: 12, border: `1px solid ${planType === p.id ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.06)"}`, background: planType === p.id ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)", color: planType === p.id ? "#ffd700" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center" as const, transition: "all 0.2s" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{p.label}</div>
            <div style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {planType === "subject" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["Physics", "Chemistry", "Math", "Other"].map(s => (
            <button key={s} onClick={() => setSubject(s)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${subject === s ? COLORS[s] : "rgba(255,255,255,0.08)"}`, background: subject === s ? `${COLORS[s]}18` : "transparent", color: subject === s ? COLORS[s] : "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{s}</button>
          ))}
        </div>
      )}

      {errors.length === 0 && <Glass style={{ padding: 16, marginBottom: 16, textAlign: "center" as const, color: "#64748b", fontSize: 13, border: "1px solid rgba(255,215,0,0.15)" }}>⚠️ Log errors first so AI can build a personalized plan!</Glass>}

      {loading && <CancelButton onCancel={cancel} />}

      <button onClick={generate} disabled={loading || errors.length === 0} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading || errors.length === 0 ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#ffd700,#f97316)", color: loading || errors.length === 0 ? "#475569" : "#000", fontFamily: "inherit", fontSize: 15, fontWeight: 900, cursor: loading || errors.length === 0 ? "not-allowed" : "pointer", letterSpacing: 1, marginBottom: 16 }}>
        {loading ? "Building plan..." : `⚔️ GENERATE ${planType.toUpperCase()} PLAN`}
      </button>

      {err && <ErrorAlert msg={err} />}

      {(loading || plan) && !err && (
        <div ref={ref} style={{ padding: 24, border: "1px solid rgba(255,215,0,0.2)", background: "rgba(255,215,0,0.02)", backdropFilter: "blur(14px)", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ffd700,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>🧠</div>
            <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700, letterSpacing: 1 }}>GEMINI AI COACH</span>
          </div>
          {loading ? <TypingDots color="#ffd700" /> : (
            <>
              <AIResponse text={plan} color="#ffd700" />
              <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={generate} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.08)", color: "#ffd700", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Regenerate</button>
                <button onClick={() => navigator.clipboard.writeText(plan)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📋 Copy</button>
              </div>
            </>
          )}
        </div>
      )}
    </Center>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RECOMMENDER (Anime + Manga + Manhwa + all media)
// ═══════════════════════════════════════════════════════════════════════════════

function AIAnimeRecommender({ collection }: { collection: any[] }) {
  const [recs, setRecs] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"taste" | "genre" | "hidden" | "mood">("taste");
  const [genreQ, setGenreQ] = useState("");
  const [mood, setMood] = useState("hype");
  const [media, setMedia] = useState("All");
  const ref = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const MOODS = [
    { id: "hype",       emoji: "🔥", label: "Hype",      desc: "Intense action" },
    { id: "emotional",  emoji: "😭", label: "Emotional", desc: "Deep story" },
    { id: "dark",       emoji: "🖤", label: "Dark",      desc: "Psychological" },
    { id: "chill",      emoji: "😌", label: "Chill",     desc: "Easy & fun" },
    { id: "epic",       emoji: "🗺️", label: "Epic",      desc: "World-building" },
    { id: "motivation", emoji: "💪", label: "Grind",     desc: "Motivational" },
  ];
  const MEDIA = ["All", "Anime", "Manga", "Manhwa", "Manhua", "Webtoon", "Light Novel"];

  // ✅ FIXED: Send top 30 by rating instead of just first 15
  const sorted = [...collection].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const summary = sorted.slice(0, 30).map(c =>
    `${c.title}(${c.type},${c.rating}/10,${(c.tags || []).join(",")})`
  ).join("; ");

  const topRated = sorted.slice(0, 3).map(c => c.title).join(", ");
  const genres = collection.flatMap(c => c.tags || []);
  const gc: Record<string, number> = {};
  genres.forEach(g => { gc[g] = (gc[g] || 0) + 1; });
  const topGenre = Object.entries(gc).sort((a: any, b: any) => b[1] - a[1])[0];
  const avg = collection.length > 0 ? (collection.reduce((a, c) => a + (c.rating || 0), 0) / collection.length).toFixed(1) : "—";
  const mediaLine = media === "All" ? "Recommend a mix of Anime, Manga, Manhwa, Manhua, Webtoon, Light Novel" : `Only recommend ${media}`;

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const getRecs = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setRecs(""); setErr("");
    try {
      const sys = `You are the ultimate expert on anime, manga, manhwa, manhua, webtoons, and light novels across all media types. Give HIGHLY specific, personalized recommendations. For each of 5 picks include: ## Title, Media Type, Genre tags, Why you'll love it, Power Level (1-9999), Where to read/watch. Max 600 words.`;
      const base = `Collection(${collection.length}): ${summary || "empty"}. Top rated: ${topRated || "none"}. Fav genre: ${topGenre?.[0] || "unknown"}. Avg rating: ${avg}.`;
      const msg = mode === "taste"
        ? `${base}\n${mediaLine} not in my collection that match my taste. Explain why each matches.`
        : mode === "genre"
        ? `${base}\nUser search: "${genreQ}"\n${mediaLine}. Find 5 titles matching this description perfectly. Use search query as primary filter.`
        : mode === "hidden"
        ? `${base}\n${mediaLine} that are HIDDEN GEMS — underrated, not mainstream (avoid: Naruto, AOT, One Piece, Solo Leveling, etc). Undiscovered masterpieces.`
        : `${base}\nMood: ${mood}(${MOODS.find(m => m.id === mood)?.desc}).\n${mediaLine} that deliver this mood AND match my taste.`;
      const result = await askGemini(sys, msg, abortRef.current.signal);
      setRecs(result);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <Center>
      {/* Taste profile */}
      <Glass style={{ padding: 16, marginBottom: 18, border: "1px solid rgba(168,85,247,0.2)" }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>🎯 YOUR TASTE PROFILE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 8 }}>
          {[
            { label: "In Collection", value: collection.length, color: "#a855f7" },
            { label: "Avg Rating",    value: `${avg}⭐`,         color: "#ffd700" },
            { label: "Top Genre",     value: topGenre?.[0] || "—", color: "#ff2254" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" as const, padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#475569" }}>{collection.length > 0 ? `Top: ${topRated}` : "💡 Empty collection? Use Genre Search mode — no collection needed!"}</div>
      </Glass>

      {/* Media filter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>MEDIA TYPE</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {MEDIA.map(m => (
            <button key={m} onClick={() => setMedia(m)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${media === m ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`, background: media === m ? "rgba(168,85,247,0.12)" : "transparent", color: media === m ? "#a855f7" : "#64748b", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>RECOMMENDATION MODE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {([
          { id: "taste",  icon: "🎯", label: "My Taste",    desc: "Based on collection" },
          { id: "genre",  icon: "🔍", label: "Genre Search", desc: "Describe what you want" },
          { id: "hidden", icon: "💎", label: "Hidden Gems",  desc: "Underrated picks" },
          { id: "mood",   icon: "🌊", label: "Mood Pick",    desc: "Match your vibe" },
        ] as const).map(r => (
          <button key={r.id} onClick={() => setMode(r.id)} style={{ padding: "12px 4px", borderRadius: 12, border: `1px solid ${mode === r.id ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.06)"}`, background: mode === r.id ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)", color: mode === r.id ? "#a855f7" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center" as const, transition: "all 0.2s" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{r.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>{r.label}</div>
            <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{r.desc}</div>
          </button>
        ))}
      </div>

      {mode === "genre" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>DESCRIBE WHAT YOU WANT</div>
          <input value={genreQ} onChange={e => setGenreQ(e.target.value)} style={INP} placeholder="e.g. 'dark manhwa with overpowered MC' · 'romance manga slow burn' · 'action like Solo Leveling' · 'psychological thriller'" />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>💡 Works without a collection! Just describe it.</div>
        </div>
      )}

      {mode === "mood" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>YOUR VIBE RIGHT NOW</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {MOODS.map(m => (
              <button key={m.id} onClick={() => setMood(m.id)} style={{ padding: "10px 6px", borderRadius: 10, border: `1px solid ${mood === m.id ? "rgba(255,34,84,0.4)" : "rgba(255,255,255,0.06)"}`, background: mood === m.id ? "rgba(255,34,84,0.08)" : "rgba(255,255,255,0.02)", color: mood === m.id ? "#ff2254" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>{m.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <CancelButton onCancel={cancel} />}

      <button onClick={getRecs} disabled={loading || (mode === "genre" && !genreQ.trim())} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#a855f7,#ff2254)", color: loading ? "#475569" : "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1, marginBottom: 16 }}>
        {loading ? "Finding your next obsession..." : "🎌 GET RECOMMENDATIONS"}
      </button>

      {err && <ErrorAlert msg={err} />}

      {(loading || recs) && !err && (
        <div ref={ref} style={{ padding: 24, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.02)", backdropFilter: "blur(14px)", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#ff2254)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎌</div>
            <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 700, letterSpacing: 1 }}>GEMINI AI ORACLE</span>
            <span style={{ fontSize: 11, color: "#475569" }}>· {media === "All" ? "All media types" : media}</span>
          </div>
          {loading ? <TypingDots color="#a855f7" /> : (
            <>
              <AIResponse text={recs} color="#a855f7" />
              <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={getRecs} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)", color: "#a855f7", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Refresh</button>
                <button onClick={() => navigator.clipboard.writeText(recs)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📋 Copy</button>
              </div>
            </>
          )}
        </div>
      )}
    </Center>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI HUB — MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function AIHub({ userId, errors, collection }: { userId: string; errors: any[]; collection: any[] }) {
  const [tab, setTab] = useState<"explainer" | "coach" | "anime">("explainer");

  const TABS = [
    { id: "explainer", icon: "💡", label: "Solution Explainer", color: "#00d4ff", desc: "Explain any mistake or question" },
    { id: "coach",     icon: "🧠", label: "Study Coach",        color: "#ffd700", desc: "Personalized battle plans" },
    { id: "anime",     icon: "🎌", label: "Recommender",        color: "#a855f7", desc: "Anime · Manga · Manhwa · More" },
  ] as const;

  return (
    <div style={{ paddingBottom: 60 }}>
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-9px)}}`}</style>

      {/* Hero */}
      <div style={{ maxWidth: 700, margin: "0 auto 28px", textAlign: "center", padding: "28px 24px", background: "linear-gradient(135deg,rgba(0,212,255,0.06),rgba(168,85,247,0.06),rgba(255,34,84,0.04))", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(0,212,255,0.1),transparent 60%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 44, marginBottom: 10 }}>🤖</div>
        <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Bebas Neue',cursive", letterSpacing: 4, background: "linear-gradient(135deg,#00d4ff,#a855f7,#ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>AI COMMAND CENTER</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Powered by Gemini AI · Study smarter, discover more</div>
      </div>

      {/* Tab selector */}
      <div style={{ maxWidth: 700, margin: "0 auto 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "18px 10px", borderRadius: 14, border: `2px solid ${tab === t.id ? t.color : "rgba(255,255,255,0.06)"}`, background: tab === t.id ? `${t.color}10` : "rgba(255,255,255,0.02)", color: tab === t.id ? t.color : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center" as const, transition: "all 0.25s", boxShadow: tab === t.id ? `0 4px 24px ${t.color}25` : "none" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{t.label}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "explainer" && <AISolutionExplainer errors={errors} />}
      {tab === "coach"     && <AIStudyCoach errors={errors} />}
      {tab === "anime"     && <AIAnimeRecommender collection={collection} />}
    </div>
  );
}