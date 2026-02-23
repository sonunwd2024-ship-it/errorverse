"use client";
import { useState, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ErrorEntry {
  id?: string;
  date: string;          // ISO string e.g. "2026-02-23"
  subject: string;
  chapter: string;
  mistakeType: string;
  masteryStage?: string; // "red" | "yellow" | "green"
  revised?: boolean;
}

interface DayData {
  date: string;
  errors: number;
  revisions: number;
  subjects: string[];
  chapters: string[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: DayData | null;
}

// ─── DATA AGGREGATION ─────────────────────────────────────────────────────────

function aggregateByDay(errors: ErrorEntry[]): Record<string, DayData> {
  const map: Record<string, DayData> = {};
  errors.forEach(e => {
    const date = e.date?.split("T")[0]; // normalize to YYYY-MM-DD
    if (!date) return;
    if (!map[date]) map[date] = { date, errors: 0, revisions: 0, subjects: [], chapters: [] };
    map[date].errors += 1;
    if (e.revised || e.masteryStage === "green") map[date].revisions += 1;
    if (!map[date].subjects.includes(e.subject)) map[date].subjects.push(e.subject);
    if (!map[date].chapters.includes(e.chapter)) map[date].chapters.push(e.chapter);
  });
  return map;
}

// ─── COLOR LOGIC ──────────────────────────────────────────────────────────────
// Priority: revision day (blue) > error intensity (green→red)

function getCellColor(day: DayData | undefined): string {
  if (!day || day.errors === 0) return "rgba(255,255,255,0.04)";
  const revisionRatio = day.errors > 0 ? day.revisions / day.errors : 0;
  if (revisionRatio >= 0.7) return "#1d6fa4"; // mostly revised → blue
  if (revisionRatio >= 0.4) return "#2a5f8f"; // partially revised → dark blue
  if (day.errors >= 8) return "#dc2626";       // many errors → dark red
  if (day.errors >= 5) return "#ef4444";       // high errors → red
  if (day.errors >= 3) return "#f97316";       // medium → orange
  if (day.errors >= 1) return "#22c55e";       // few → light green
  return "rgba(255,255,255,0.04)";
}

function getCellGlow(day: DayData | undefined): string {
  if (!day || day.errors === 0) return "none";
  const revisionRatio = day.errors > 0 ? day.revisions / day.errors : 0;
  if (revisionRatio >= 0.7) return "0 0 8px rgba(29,111,164,0.6)";
  if (day.errors >= 8) return "0 0 8px rgba(220,38,38,0.5)";
  if (day.errors >= 5) return "0 0 6px rgba(239,68,68,0.4)";
  if (day.errors >= 3) return "0 0 5px rgba(249,115,22,0.3)";
  return "none";
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getDaysInYear(year: number): string[] {
  const days: string[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getStreaks(dayMap: Record<string, DayData>): { current: number; longest: number } {
  const sorted = Object.keys(dayMap).sort();
  let current = 0, longest = 0, streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let prev: string | null = null;

  for (const date of sorted) {
    if (dayMap[date].errors === 0) { streak = 0; prev = null; continue; }
    if (!prev) { streak = 1; }
    else {
      const diff = (new Date(date).getTime() - new Date(prev).getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > longest) longest = streak;
    prev = date;
  }

  // current streak from today backwards
  let d = new Date(today);
  current = 0;
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (!dayMap[key] || dayMap[key].errors === 0) break;
    current++;
    d.setDate(d.getDate() - 1);
  }

  return { current, longest };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ═══════════════════════════════════════════════════════════════════════════════
// YEARLY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function YearlyCalendar({ dayMap, year }: { dayMap: Record<string, DayData>; year: number }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, data: null });

  const days = getDaysInYear(year);
  const firstDay = new Date(year, 0, 1).getDay(); // 0=Sun

  // Build weeks (columns)
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = Array(firstDay).fill(null);
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const CELL = 13;
  const GAP = 3;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      {/* Month labels */}
      <div style={{ display: "flex", marginLeft: 28, marginBottom: 4 }}>
        {MONTHS.map((m, mi) => {
          const firstOfMonth = new Date(year, mi, 1);
          const dayOfYear = Math.floor((firstOfMonth.getTime() - new Date(year, 0, 1).getTime()) / 86400000);
          const weekIndex = Math.floor((dayOfYear + firstDay) / 7);
          return (
            <div key={m} style={{ position: "absolute", left: 28 + weekIndex * (CELL + GAP), fontSize: 9, color: "#475569", fontFamily: "inherit" }}>{m}</div>
          );
        })}
        <div style={{ height: 14, width: weeks.length * (CELL + GAP) }} />
      </div>

      <div style={{ display: "flex", gap: 2 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 4, marginTop: 0 }}>
          {DAYS_SHORT.map((d, i) => (
            <div key={d} style={{ height: CELL, fontSize: 8, color: i % 2 === 0 ? "#475569" : "transparent", display: "flex", alignItems: "center" }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "flex", gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {week.map((date, di) => {
                const day = date ? dayMap[date] : undefined;
                const color = getCellColor(day);
                const glow = getCellGlow(day);
                const isToday = date === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={di}
                    onMouseEnter={e => date && setTooltip({ visible: true, x: e.clientX, y: e.clientY, data: day || { date, errors: 0, revisions: 0, subjects: [], chapters: [] } })}
                    onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                    onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                    style={{
                      width: CELL, height: CELL, borderRadius: 2,
                      background: date ? color : "transparent",
                      boxShadow: glow,
                      border: isToday ? "1px solid #00d4ff" : "none",
                      cursor: date ? "pointer" : "default",
                      transition: "transform 0.1s",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <Tooltip data={tooltip.data} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function MonthlyCalendar({ dayMap, year, month }: { dayMap: Record<string, DayData>; year: number; month: number }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, data: null });
  const days = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date().toISOString().split("T")[0];

  const cells: (string | null)[] = [...Array(firstDay).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#475569", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((date, i) => {
          const day = date ? dayMap[date] : undefined;
          const color = getCellColor(day);
          const glow = getCellGlow(day);
          const isToday = date === today;
          const dayNum = date ? new Date(date + "T00:00:00").getDate() : null;

          return (
            <div
              key={i}
              onMouseEnter={e => date && setTooltip({ visible: true, x: e.clientX, y: e.clientY, data: day || { date, errors: 0, revisions: 0, subjects: [], chapters: [] } })}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                background: date ? color : "transparent",
                boxShadow: glow,
                border: isToday ? "2px solid #00d4ff" : "1px solid rgba(255,255,255,0.04)",
                cursor: date ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                transition: "transform 0.15s, box-shadow 0.15s",
                position: "relative",
              }}
            >
              {date && (
                <>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: day?.errors ? "#fff" : "#475569" }}>{dayNum}</span>
                  {day?.errors ? <span style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>{day.errors}e</span> : null}
                  {day?.revisions ? <span style={{ fontSize: 8, color: "#60a5fa" }}>{day.revisions}r</span> : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <Tooltip data={tooltip.data} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────

function Tooltip({ data, x, y }: { data: DayData; x: number; y: number }) {
  return (
    <div style={{
      position: "fixed", left: x + 12, top: y - 10, zIndex: 9999,
      background: "rgba(15,15,25,0.97)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10, padding: "10px 14px", minWidth: 180, pointerEvents: "none",
      backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{formatDate(data.date)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Errors logged</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: data.errors > 5 ? "#ef4444" : "#22c55e" }}>{data.errors}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Revised</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{data.revisions}</span>
        </div>
        {data.subjects.length > 0 && (
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>Subjects</div>
            <div style={{ fontSize: 11, color: "#e2e8f0" }}>{data.subjects.join(", ")}</div>
          </div>
        )}
        {data.chapters.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>Chapters</div>
            <div style={{ fontSize: 11, color: "#e2e8f0" }}>{data.chapters.slice(0, 3).join(", ")}{data.chapters.length > 3 ? ` +${data.chapters.length - 3}` : ""}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEGEND ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
      <span style={{ fontSize: 10, color: "#475569" }}>Less</span>
      {[
        { color: "rgba(255,255,255,0.08)", label: "0" },
        { color: "#22c55e", label: "1-2" },
        { color: "#f97316", label: "3-4" },
        { color: "#ef4444", label: "5-7" },
        { color: "#dc2626", label: "8+" },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
          <span style={{ fontSize: 9, color: "#475569" }}>{label}</span>
        </div>
      ))}
      <span style={{ fontSize: 10, color: "#475569" }}>More</span>
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: "#1d6fa4" }} />
        <span style={{ fontSize: 9, color: "#60a5fa" }}>Revision day</span>
      </div>
    </div>
  );
}

// ─── PERFORMANCE SUMMARY ──────────────────────────────────────────────────────

function PerformanceSummary({ errors, dayMap }: { errors: ErrorEntry[]; dayMap: Record<string, DayData> }) {
  const streaks = useMemo(() => getStreaks(dayMap), [dayMap]);

  const totalErrors = errors.length;
  const totalRevised = errors.filter(e => e.revised || e.masteryStage === "green").length;
  const accuracyRate = totalErrors > 0 ? Math.round((totalRevised / totalErrors) * 100) : 0;

  const subjectCount: Record<string, number> = {};
  errors.forEach(e => { subjectCount[e.subject] = (subjectCount[e.subject] || 0) + 1; });
  const topSubject = Object.entries(subjectCount).sort((a, b) => b[1] - a[1])[0];

  const mistakeCount: Record<string, number> = {};
  errors.forEach(e => { mistakeCount[e.mistakeType] = (mistakeCount[e.mistakeType] || 0) + 1; });
  const topMistake = Object.entries(mistakeCount).sort((a, b) => b[1] - a[1])[0];

  const activeDays = Object.values(dayMap).filter(d => d.errors > 0).length;

  const stats = [
    { label: "Current Streak",  value: `${streaks.current}d`,   color: "#f97316", icon: "🔥" },
    { label: "Longest Streak",  value: `${streaks.longest}d`,   color: "#ffd700", icon: "🏆" },
    { label: "Active Days",     value: activeDays,               color: "#00d4ff", icon: "📅" },
    { label: "Total Errors",    value: totalErrors,              color: "#ef4444", icon: "📝" },
    { label: "Revised",         value: totalRevised,             color: "#22c55e", icon: "✅" },
    { label: "Accuracy",        value: `${accuracyRate}%`,       color: "#a855f7", icon: "🎯" },
    { label: "Weakest Subject", value: topSubject?.[0] || "—",  color: "#ff2254", icon: "⚠️" },
    { label: "Top Mistake",     value: topMistake?.[0]?.split(" ")[0] || "—", color: "#64748b", icon: "🧠" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ padding: "14px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, textAlign: "center" as const }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive", letterSpacing: 1 }}>{s.value}</div>
          <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — HEAT CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════

export function HeatCalendar({ errors }: { errors: ErrorEntry[] }) {
  const today = new Date();
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // ✅ Memoized aggregation — only recalculates when errors change
  const dayMap = useMemo(() => aggregateByDay(errors), [errors]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, animation: "fadeIn 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Bebas Neue',cursive", letterSpacing: 3, background: "linear-gradient(135deg,#00d4ff,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              MISTAKE HEAT MAP
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Your error activity at a glance</div>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10 }}>
            {(["monthly", "yearly"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: view === v ? "rgba(0,212,255,0.15)" : "transparent", color: view === v ? "#00d4ff" : "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                {v === "monthly" ? "📅 Month" : "📆 Year"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 20px 16px", backdropFilter: "blur(14px)", animation: "fadeIn 0.5s ease" }}>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {view === "monthly" ? (
            <>
              <button onClick={prevMonth} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← Prev</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{MONTHS[month]} {year}</div>
              <button onClick={nextMonth} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Next →</button>
            </>
          ) : (
            <>
              <button onClick={() => setYear(y => y - 1)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← {year - 1}</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{year}</div>
              <button onClick={() => setYear(y => y + 1)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{year + 1} →</button>
            </>
          )}
        </div>

        {/* Calendar */}
        {view === "monthly"
          ? <MonthlyCalendar dayMap={dayMap} year={year} month={month} />
          : <YearlyCalendar dayMap={dayMap} year={year} />
        }

        {/* Legend */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Legend />
        </div>
      </div>

      {/* Performance Summary */}
      <PerformanceSummary errors={errors} dayMap={dayMap} />
    </div>
  );
}