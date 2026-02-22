"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#e2e8f0", fontSize: 13,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────

async function askClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "API error");
  return data.content?.map((b: any) => b.text || "").join("") || "";
}

// ─── TYPING ANIMATION ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "linear-gradient(135deg,#00d4ff,#7c3aed)",
          animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── AI RESPONSE RENDERER ─────────────────────────────────────────────────────

function AIResponse({ text, color = "#00d4ff" }: { text: string; color?: string }) {
  // Render markdown-like formatting
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        if (line.startsWith("## ")) return (
          <div key={i} style={{ fontSize: 15, fontWeight: 800, color, marginTop: 8, fontFamily: "'Bebas Neue',cursive", letterSpacing: 1.5 }}>
            {line.replace("## ", "")}
          </div>
        );
        if (line.startsWith("# ")) return (
          <div key={i} style={{ fontSize: 18, fontWeight: 800, color, marginTop: 8, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}>
            {line.replace("# ", "")}
          </div>
        );
        if (line.startsWith("**") && line.endsWith("**")) return (
          <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
            {line.replace(/\*\*/g, "")}
          </div>
        );
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#94a3b8", paddingLeft: 4 }}>
            <span style={{ color, flexShrink: 0 }}>▸</span>
            <span>{line.replace(/^[-•] /, "")}</span>
          </div>
        );
        if (line.match(/^\d+\./)) return (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#94a3b8", paddingLeft: 4 }}>
            <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span>
            <span>{line.replace(/^\d+\. /, "")}</span>
          </div>
        );
        if (line.startsWith("💡") || line.startsWith("⚠️") || line.startsWith("🎯") || line.startsWith("🔥") || line.startsWith("✅")) return (
          <div key={i} style={{ fontSize: 13, color: "#e2e8f0", padding: "8px 12px", background: `${color}10`, borderRadius: 8, borderLeft: `3px solid ${color}44` }}>
            {line}
          </div>
        );
        return (
          <div key={i} style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 1. AI SOLUTION EXPLAINER ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function AISolutionExplainer({ errors }: { errors: any[] }) {
  const [selected, setSelected] = useState<any>(null);
  const [customQ, setCustomQ] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"error"|"custom">("error");
  const [depth, setDepth] = useState<"simple"|"detailed"|"exam">("simple");
  const responseRef = useRef<HTMLDivElement>(null);

  const depthConfig = {
    simple:   { label: "Simple",   desc: "ELI5 — explain like I'm 10",        color: "#22c55e" },
    detailed: { label: "Detailed", desc: "Full concept + examples",             color: "#00d4ff" },
    exam:     { label: "Exam Mode",desc: "How to approach in JEE/NEET exam",   color: "#ff2254" },
  };

  const explain = async () => {
    setLoading(true); setResponse("");
    try {
      const systemPrompt = `You are an expert JEE/NEET tutor and study coach. You explain Physics, Chemistry, and Math concepts with extreme clarity. You use analogies, step-by-step breakdowns, and always relate concepts to real exam scenarios. Format your response with clear sections using ## headers, bullet points with -, and highlight key formulas. Be encouraging but brutally clear about what the student needs to fix. Keep responses under 400 words.`;

      let userMsg = "";
      if (mode === "error" && selected) {
        userMsg = `A student made a ${selected.mistakeType} mistake in ${selected.subject} — Chapter: ${selected.chapter}.
Their solution attempt: "${selected.solution}"
${selected.formula ? `Key formula involved: ${selected.formula}` : ""}
${selected.whyMistake ? `Why they think they made the mistake: "${selected.whyMistake}"` : ""}
${selected.lesson ? `Lesson noted: "${selected.lesson}"` : ""}

Explanation depth requested: ${depthConfig[depth].desc}

Please:
1. Explain what the correct concept/approach actually is
2. Explain WHY they made this specific mistake
3. Give a memory trick or mental model to never make this mistake again
4. ${depth === "exam" ? "Show exactly how to approach this in a JEE/NEET exam setting with time management tips" : "Give one similar example to cement understanding"}`;
      } else {
        userMsg = `A JEE/NEET student asks: "${customQ}"
Explanation depth: ${depthConfig[depth].desc}
Give a clear, structured explanation.`;
      }

      const result = await askClaude(systemPrompt, userMsg);
      setResponse(result);
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setResponse(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}`}</style>

      {/* Header */}
      <div style={{ ...GLASS, padding: 24, marginBottom: 20, background: "linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,58,237,0.05))", border: "1px solid rgba(0,212,255,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ fontSize: 36 }}>💡</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Bebas Neue',cursive", letterSpacing: 3 }}>AI SOLUTION EXPLAINER</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Paste any solution or pick an error — get it explained instantly</div>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["error","custom"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === m ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)", color: mode === m ? "#00d4ff" : "#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: 700, borderBottom: mode === m ? "2px solid #00d4ff" : "2px solid transparent", transition: "all 0.2s" }}>
            {m === "error" ? "📝 From My Errors" : "✏️ Custom Question"}
          </button>
        ))}
      </div>

      {/* Depth selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>EXPLANATION DEPTH</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(Object.entries(depthConfig) as any).map(([k, v]: any) => (
            <button key={k} onClick={() => setDepth(k)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${depth === k ? v.color : "rgba(255,255,255,0.08)"}`, background: depth === k ? `${v.color}15` : "transparent", color: depth === k ? v.color : "#64748b", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
              <div>{v.label}</div>
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{v.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      {mode === "error" ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>SELECT AN ERROR TO EXPLAIN</div>
          {errors.length === 0 ? (
            <div style={{ ...GLASS, padding: 24, textAlign: "center", color: "#475569" }}>No errors logged yet — add some first!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {errors.slice(0, 15).map(e => (
                <div key={e.id} onClick={() => setSelected(e)} style={{ ...GLASS, padding: "12px 14px", cursor: "pointer", border: `1px solid ${selected?.id === e.id ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.06)"}`, background: selected?.id === e.id ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{e.chapter}</span>
                      <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{e.subject} · {e.mistakeType}</span>
                    </div>
                    {selected?.id === e.id && <span style={{ color: "#00d4ff", fontSize: 16 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>TYPE YOUR QUESTION OR PASTE A SOLUTION</div>
          <textarea value={customQ} onChange={e => setCustomQ(e.target.value)} style={{ ...INP, height: 100, resize: "none" } as any} placeholder="e.g. 'Explain why the ball doesn't fall straight down when thrown horizontally' or paste any solution you don't understand..." />
        </div>
      )}

      <button onClick={explain} disabled={loading || (mode === "error" ? !selected : !customQ.trim())} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading || (mode === "error" ? !selected : !customQ.trim()) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", color: loading || (mode === "error" ? !selected : !customQ.trim()) ? "#475569" : "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: loading || (mode === "error" ? !selected : !customQ.trim()) ? "not-allowed" : "pointer", letterSpacing: 1, transition: "all 0.3s", marginBottom: 20 }}>
        {loading ? "🤖 AI is thinking..." : "✨ EXPLAIN IT TO ME"}
      </button>

      {/* Response */}
      {(loading || response) && (
        <div ref={responseRef} style={{ ...GLASS, padding: 24, border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <span style={{ fontSize: 12, color: "#00d4ff", fontWeight: 700, letterSpacing: 1 }}>AI TUTOR</span>
          </div>
          {loading ? <TypingDots /> : <AIResponse text={response} color="#00d4ff" />}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 2. AI STUDY COACH ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function AIStudyCoach({ errors, userId }: { errors: any[]; userId: string }) {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [planType, setPlanType] = useState<"daily"|"weekly"|"subject">("daily");
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [generated, setGenerated] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Compute stats from errors
  const chapterMap: Record<string, { count: number; subject: string; mistakeTypes: string[] }> = {};
  errors.forEach(e => {
    const key = `${e.subject}__${e.chapter}`;
    if (!chapterMap[key]) chapterMap[key] = { count: 0, subject: e.subject, mistakeTypes: [] };
    chapterMap[key].count++;
    chapterMap[key].mistakeTypes.push(e.mistakeType);
  });
  const weakChapters = Object.entries(chapterMap).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([k, v]) => ({ chapter: k.split("__")[1], ...v }));
  const subjectBreakdown = errors.reduce((a: any, e) => { a[e.subject] = (a[e.subject] || 0) + 1; return a; }, {});
  const mostRepeated = errors.reduce((a: any, e) => { a[e.mistakeType] = (a[e.mistakeType] || 0) + 1; return a; }, {});
  const topMistake = Object.entries(mostRepeated).sort((a: any, b: any) => b[1] - a[1])[0];
  const masteredCount = errors.filter(e => e.masteryStage === "green").length;
  const weakCount = errors.filter(e => e.masteryStage === "red").length;

  const generatePlan = async () => {
    setLoading(true); setPlan(""); setGenerated(false);
    try {
      const systemPrompt = `You are an elite JEE/NEET study strategist and AI coach. You create razor-sharp, personalized study plans based on a student's error patterns. You are direct, motivational, and extremely specific. Use ## for section headers, bullet points with -, numbered lists for steps. Include time estimates. Be like a personal trainer but for studying. Max 500 words.`;

      const context = `Student Error Analysis:
- Total errors logged: ${errors.length}
- Mastered: ${masteredCount} | Still weak: ${weakCount}
- Most repeated mistake type: ${topMistake ? `${topMistake[0]} (${topMistake[1]} times)` : "N/A"}
- Subject breakdown: ${JSON.stringify(subjectBreakdown)}
- Top weak chapters: ${weakChapters.slice(0, 5).map(c => `${c.chapter} (${c.subject}, ${c.count} errors)`).join(", ")}`;

      let userMsg = "";
      if (planType === "daily") {
        userMsg = `${context}

Generate a DAILY BATTLE PLAN for today. Include:
- Which chapter to focus on and why (based on weakness data)
- Exact time blocks (e.g. 9:00-10:30 AM: ...)
- Specific mistake types to target
- A mindset tip
- A measurable goal for today`;
      } else if (planType === "weekly") {
        userMsg = `${context}

Generate a 7-DAY STUDY WAR PLAN. Each day should target specific weak areas. Include:
- Day-by-day chapter assignments
- Which mistake types to crush each day
- Revision days built in
- Weekly goal to hit`;
      } else {
        userMsg = `${context}

Generate a SUBJECT DEEP-DIVE PLAN for ${selectedSubject}. 
Subject errors: ${subjectBreakdown[selectedSubject] || 0} total
Weak chapters in ${selectedSubject}: ${weakChapters.filter(c => c.subject === selectedSubject).map(c => c.chapter).join(", ") || "none found yet"}

Include:
- Chapter priority order
- Most dangerous mistake patterns for this subject
- Exact strategies to fix conceptual vs calculation errors
- Time allocation recommendations`;
      }

      const result = await askClaude(systemPrompt, userMsg);
      setPlan(result);
      setGenerated(true);
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setPlan(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  };

  const COLORS: Record<string, string> = { Physics: "#00d4ff", Chemistry: "#22c55e", Math: "#ff2254", Other: "#f97316" };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ ...GLASS, padding: 24, marginBottom: 20, background: "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(249,115,22,0.05))", border: "1px solid rgba(255,215,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ fontSize: 36 }}>🧠</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Bebas Neue',cursive", letterSpacing: 3 }}>AI STUDY COACH</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Personalized battle plans built from YOUR error patterns</div>
          </div>
        </div>
      </div>

      {/* Stats snapshot */}
      {errors.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Errors",  value: errors.length,  icon: "📝", color: "#00d4ff" },
            { label: "Still Weak",    value: weakCount,       icon: "🔴", color: "#ff2254" },
            { label: "Mastered",      value: masteredCount,   icon: "🟢", color: "#22c55e" },
            { label: "Top Mistake",   value: topMistake?.[0]?.split(" ")[0] ?? "—", icon: "⚠️", color: "#ffd700" },
          ].map(s => (
            <div key={s.label} style={{ ...GLASS, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive", marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weak chapters heatmap preview */}
      {weakChapters.length > 0 && (
        <div style={{ ...GLASS, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 12 }}>🔥 YOUR WEAK SPOTS (AI will target these)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {weakChapters.slice(0, 5).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#475569", width: 16 }}>#{i + 1}</span>
                <div style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{c.chapter}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${COLORS[c.subject] || "#888"}18`, color: COLORS[c.subject] || "#888" }}>{c.subject}</span>
                <div style={{ width: 60, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c.count / weakChapters[0].count) * 100}%`, background: `${COLORS[c.subject] || "#888"}`, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, color: "#475569", width: 20 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan type selector */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>CHOOSE PLAN TYPE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {([
          { id: "daily",   icon: "☀️", label: "Daily Plan",   desc: "Today's battle" },
          { id: "weekly",  icon: "📅", label: "Weekly War",   desc: "7-day strategy" },
          { id: "subject", icon: "📚", label: "Subject Deep", desc: "One subject focus" },
        ] as const).map(p => (
          <button key={p.id} onClick={() => setPlanType(p.id)} style={{ padding: "12px 8px", borderRadius: 12, border: `1px solid ${planType === p.id ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.06)"}`, background: planType === p.id ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)", color: planType === p.id ? "#ffd700" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{p.label}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Subject selector (only for subject mode) */}
      {planType === "subject" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: 1 }}>SELECT SUBJECT</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Physics", "Chemistry", "Math", "Other"].map(s => (
              <button key={s} onClick={() => setSelectedSubject(s)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${selectedSubject === s ? COLORS[s] : "rgba(255,255,255,0.08)"}`, background: selectedSubject === s ? `${COLORS[s]}15` : "transparent", color: selectedSubject === s ? COLORS[s] : "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && (
        <div style={{ ...GLASS, padding: 20, marginBottom: 20, border: "1px solid rgba(255,215,0,0.2)", textAlign: "center", color: "#64748b", fontSize: 13 }}>
          ⚠️ Log some errors first so the AI can analyze your patterns!
        </div>
      )}

      <button onClick={generatePlan} disabled={loading || errors.length === 0} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading || errors.length === 0 ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#ffd700,#f97316)", color: loading || errors.length === 0 ? "#475569" : "#000", fontFamily: "inherit", fontSize: 15, fontWeight: 900, cursor: loading || errors.length === 0 ? "not-allowed" : "pointer", letterSpacing: 1, transition: "all 0.3s", marginBottom: 20 }}>
        {loading ? "🤖 Building your battle plan..." : `⚔️ GENERATE MY ${planType.toUpperCase()} PLAN`}
      </button>

      {/* Response */}
      {(loading || plan) && (
        <div ref={responseRef} style={{ ...GLASS, padding: 24, border: "1px solid rgba(255,215,0,0.2)", background: "rgba(255,215,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#ffd700,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div>
            <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700, letterSpacing: 1 }}>YOUR PERSONAL AI COACH</span>
          </div>
          {loading ? <TypingDots /> : (
            <>
              <AIResponse text={plan} color="#ffd700" />
              {generated && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                  <button onClick={generatePlan} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.08)", color: "#ffd700", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Regenerate</button>
                  <button onClick={() => { navigator.clipboard.writeText(plan); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📋 Copy Plan</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 3. AI ANIME RECOMMENDER ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function AIAnimeRecommender({ collection }: { collection: any[] }) {
  const [recs, setRecs] = useState("");
  const [loading, setLoading] = useState(false);
  const [recType, setRecType] = useState<"similar"|"hidden"|"mood">("similar");
  const [mood, setMood] = useState("hype");
  const responseRef = useRef<HTMLDivElement>(null);

  const MOODS = [
    { id: "hype",       emoji: "🔥", label: "Hype Mode",    desc: "Intense, action-packed" },
    { id: "emotional",  emoji: "😭", label: "Emotional",    desc: "Deep feelings & story" },
    { id: "chill",      emoji: "😌", label: "Chill Vibes",  desc: "Easy, fun, relaxing" },
    { id: "dark",       emoji: "🖤", label: "Dark & Gritty",desc: "Psychological, mature" },
    { id: "adventure",  emoji: "🗺️", label: "Epic Journey", desc: "World-building, adventure" },
    { id: "motivation", emoji: "💪", label: "Motivation",   desc: "Inspire me to study!" },
  ];

  const getRecommendations = async () => {
    setLoading(true); setRecs("");
    try {
      const systemPrompt = `You are the ultimate anime/manga expert and recommendation engine. You have watched and read everything. You give HIGHLY personalized, specific recommendations with exact reasons why the person will love each one based on their taste profile. Format with ## headers, bullet points for each recommendation showing: Title, Genre tags, Why you'll love it, Power Level (rate 1-9999), and Where to watch. Be enthusiastic and knowledgeable. Give 5 recommendations. Max 600 words.`;

      const collectionSummary = collection.slice(0, 20).map(c => `${c.title} (${c.type}, rated ${c.rating}/10, status: ${c.status}, tags: ${(c.tags || []).join(",")})`).join("\n");
      const topRated = [...collection].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3).map(c => c.title).join(", ");
      const genres = collection.flatMap(c => c.tags || []);
      const genreCount: Record<string, number> = {};
      genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
      const topGenres = Object.entries(genreCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4).map(([g]) => g).join(", ");

      let userMsg = "";
      const baseContext = `My anime/manga collection (${collection.length} entries):
${collectionSummary || "Empty collection"}
Top rated: ${topRated || "none yet"}
Favorite genres: ${topGenres || "not known yet"}`;

      if (recType === "similar") {
        userMsg = `${baseContext}

Based on my taste profile, recommend 5 anime/manga I haven't watched yet that I'll LOVE. Explain specifically why each one matches my taste.`;
      } else if (recType === "hidden") {
        userMsg = `${baseContext}

Recommend 5 HIDDEN GEM anime/manga — lesser known titles (not mainstream like Naruto/AOT) that match my taste profile. These should be underrated masterpieces most people haven't heard of.`;
      } else {
        userMsg = `${baseContext}

My current mood: ${mood} (${MOODS.find(m => m.id === mood)?.desc})

Recommend 5 anime/manga that perfectly match this mood AND fit my taste profile. Explain how each one delivers that specific mood experience.`;
      }

      const result = await askClaude(systemPrompt, userMsg);
      setRecs(result);
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setRecs(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  };

  // Collection stats
  const avgRating = collection.length > 0 ? (collection.reduce((a, c) => a + (c.rating || 0), 0) / collection.length).toFixed(1) : "—";
  const genres = collection.flatMap(c => c.tags || []);
  const genreCount: Record<string, number> = {};
  genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
  const topGenre = Object.entries(genreCount).sort((a: any, b: any) => b[1] - a[1])[0];

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ ...GLASS, padding: 24, marginBottom: 20, background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(255,34,84,0.05))", border: "1px solid rgba(168,85,247,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 36 }}>🎌</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Bebas Neue',cursive", letterSpacing: 3 }}>AI ANIME RECOMMENDER</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>AI analyzes your taste & finds your next obsession</div>
          </div>
        </div>
      </div>

      {/* Collection taste profile */}
      {collection.length > 0 ? (
        <div style={{ ...GLASS, padding: 18, marginBottom: 20, border: "1px solid rgba(168,85,247,0.2)" }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 12 }}>🎯 YOUR TASTE PROFILE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "In Collection", value: collection.length, color: "#a855f7" },
              { label: "Avg Rating",    value: `${avgRating}⭐`,   color: "#ffd700" },
              { label: "Top Genre",     value: topGenre?.[0] || "—", color: "#ff2254" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Top 3 */}
          <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>
            Top rated: {[...collection].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3).map(c => c.title).join(" · ") || "—"}
          </div>
        </div>
      ) : (
        <div style={{ ...GLASS, padding: 20, marginBottom: 20, border: "1px solid rgba(168,85,247,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎌</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Add some anime to your collection first so AI can analyze your taste!</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>AI can still give general recommendations even with an empty collection.</div>
        </div>
      )}

      {/* Rec type selector */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>RECOMMENDATION MODE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {([
          { id: "similar", icon: "🎯", label: "Best Match",    desc: "Based on your taste" },
          { id: "hidden",  icon: "💎", label: "Hidden Gems",   desc: "Underrated picks" },
          { id: "mood",    icon: "🌊", label: "Mood Pick",     desc: "Match your vibe" },
        ] as const).map(r => (
          <button key={r.id} onClick={() => setRecType(r.id)} style={{ padding: "12px 8px", borderRadius: 12, border: `1px solid ${recType === r.id ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.06)"}`, background: recType === r.id ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)", color: recType === r.id ? "#a855f7" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Mood selector */}
      {recType === "mood" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>WHAT'S YOUR VIBE RIGHT NOW?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {MOODS.map(m => (
              <button key={m.id} onClick={() => setMood(m.id)} style={{ padding: "10px 8px", borderRadius: 10, border: `1px solid ${mood === m.id ? "rgba(255,34,84,0.4)" : "rgba(255,255,255,0.06)"}`, background: mood === m.id ? "rgba(255,34,84,0.08)" : "rgba(255,255,255,0.02)", color: mood === m.id ? "#ff2254" : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{m.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={getRecommendations} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#a855f7,#ff2254)", color: loading ? "#475569" : "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1, transition: "all 0.3s", marginBottom: 20 }}>
        {loading ? "🤖 Finding your next obsession..." : "🎌 GET MY RECOMMENDATIONS"}
      </button>

      {/* Response */}
      {(loading || recs) && (
        <div ref={responseRef} style={{ ...GLASS, padding: 24, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#ff2254)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎌</div>
            <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 700, letterSpacing: 1 }}>AI ANIME ORACLE</span>
          </div>
          {loading ? <TypingDots /> : (
            <>
              <AIResponse text={recs} color="#a855f7" />
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                <button onClick={getRecommendations} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)", color: "#a855f7", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Refresh Recs</button>
                <button onClick={() => { navigator.clipboard.writeText(recs); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📋 Copy</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AI HUB (main wrapper with tab navigation) ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function AIHub({ userId, errors, collection }: { userId: string; errors: any[]; collection: any[] }) {
  const [tab, setTab] = useState<"explainer"|"coach"|"anime">("explainer");

  const TABS = [
    { id: "explainer", icon: "💡", label: "Solution Explainer", color: "#00d4ff" },
    { id: "coach",     icon: "🧠", label: "Study Coach",        color: "#ffd700" },
    { id: "anime",     icon: "🎌", label: "Anime Recommender",  color: "#a855f7" },
  ] as const;

  return (
    <div style={{ paddingBottom: 40 }}>
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}`}</style>

      {/* AI Hub header */}
      <div style={{ textAlign: "center", marginBottom: 28, padding: "24px 20px", background: "linear-gradient(135deg,rgba(0,212,255,0.05),rgba(168,85,247,0.05),rgba(255,34,84,0.05))", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(0,212,255,0.08),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 42, marginBottom: 8 }}>🤖</div>
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Bebas Neue',cursive", letterSpacing: 4, background: "linear-gradient(135deg,#00d4ff,#a855f7,#ff2254)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI COMMAND CENTER</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Powered by Claude · Your personal AI for study & anime</div>
      </div>

      {/* Tab selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "14px 8px", borderRadius: 14, border: `1px solid ${tab === t.id ? `${t.color}55` : "rgba(255,255,255,0.06)"}`, background: tab === t.id ? `${t.color}12` : "rgba(255,255,255,0.02)", color: tab === t.id ? t.color : "#64748b", fontFamily: "inherit", cursor: "pointer", textAlign: "center", transition: "all 0.25s", boxShadow: tab === t.id ? `0 4px 20px ${t.color}20` : "none" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {tab === "explainer" && <AISolutionExplainer errors={errors} />}
      {tab === "coach"     && <AIStudyCoach errors={errors} userId={userId} />}
      {tab === "anime"     && <AIAnimeRecommender collection={collection} />}
    </div>
  );
}