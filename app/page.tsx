"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { signUp, signIn, logOut, onAuth } from "../lib/auth";
import {
  addError, getErrors, deleteError,
  addCollectionEntry, getCollection, deleteCollectionEntry,
  getStreak, getTodayEntryCount, updateLeaderboard, getLeaderboard,
  getDailyActivityForMonth,
  getTodayRevisions, getRevisionSchedule, updateErrorMastery,
  getUserXP, awardXP, checkAndAwardBadges, logRevision,
  getWeeklyStats, getChapterHeatmap,
  XP_REWARDS, LEVELS, BADGES,
  type ErrorEntry, type UserXP,
} from "../lib/db";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ProfilePanel, XPTapPanel, AvatarDisplay, loadUserProfile, getAvatar } from "./ProfilePanel";
import { AIHub } from "./AIFeatures";
import { HeatCalendar } from "./HeatCalendar";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ANIME_POSTERS: Record<string, { posters: string[]; color: string; accent: string }> = {
  "one piece":           { posters: ["https://cdn.myanimelist.net/images/anime/6/73245.jpg","https://cdn.myanimelist.net/images/anime/1244/138851.jpg"], color:"#c2410c", accent:"#fb923c" },
  "naruto":              { posters: ["https://cdn.myanimelist.net/images/anime/13/17405.jpg","https://cdn.myanimelist.net/images/anime/1565/111305.jpg"], color:"#c2410c", accent:"#fbbf24" },
  "bleach":              { posters: ["https://cdn.myanimelist.net/images/anime/3/40451.jpg","https://cdn.myanimelist.net/images/anime/1764/114529.jpg"], color:"#0369a1", accent:"#38bdf8" },
  "attack on titan":     { posters: ["https://cdn.myanimelist.net/images/anime/10/47347.jpg","https://cdn.myanimelist.net/images/anime/1629/110959.jpg"], color:"#78350f", accent:"#d97706" },
  "demon slayer":        { posters: ["https://cdn.myanimelist.net/images/anime/1286/99889.jpg"], color:"#9f1239", accent:"#fb7185" },
  "death note":          { posters: ["https://cdn.myanimelist.net/images/anime/2/246.jpg"], color:"#1e1b4b", accent:"#a5b4fc" },
  "jujutsu kaisen":      { posters: ["https://cdn.myanimelist.net/images/anime/1171/109222.jpg","https://cdn.myanimelist.net/images/anime/1792/138022.jpg"], color:"#4c1d95", accent:"#c4b5fd" },
  "chainsaw man":        { posters: ["https://cdn.myanimelist.net/images/anime/1806/126216.jpg"], color:"#7f1d1d", accent:"#fca5a5" },
  "hunter x hunter":     { posters: ["https://cdn.myanimelist.net/images/anime/1337/99013.jpg"], color:"#064e3b", accent:"#6ee7b7" },
  "vinland saga":        { posters: ["https://cdn.myanimelist.net/images/anime/1170/124312.jpg"], color:"#1e3a5f", accent:"#93c5fd" },
  "berserk":             { posters: ["https://cdn.myanimelist.net/images/anime/1384/119988.jpg"], color:"#1c1917", accent:"#d6d3d1" },
  "tokyo ghoul":         { posters: ["https://cdn.myanimelist.net/images/anime/5/64449.jpg"], color:"#7f1d1d", accent:"#fca5a5" },
  "solo leveling":       { posters: ["https://cdn.myanimelist.net/images/anime/1258/138004.jpg"], color:"#1e1b4b", accent:"#818cf8" },
  "my hero academia":    { posters: ["https://cdn.myanimelist.net/images/anime/10/78745.jpg"], color:"#1d4ed8", accent:"#93c5fd" },
  "dragon ball":         { posters: ["https://cdn.myanimelist.net/images/anime/1277/142390.jpg"], color:"#b45309", accent:"#fde68a" },
  "spy x family":        { posters: ["https://cdn.myanimelist.net/images/anime/1441/122795.jpg"], color:"#9d174d", accent:"#f9a8d4" },
  "fullmetal alchemist": { posters: ["https://cdn.myanimelist.net/images/anime/1223/96541.jpg"], color:"#92400e", accent:"#fcd34d" },
  "sword art online":    { posters: ["https://cdn.myanimelist.net/images/anime/11/39717.jpg"], color:"#1e3a5f", accent:"#7dd3fc" },
  "black clover":        { posters: ["https://cdn.myanimelist.net/images/anime/2/93469.jpg"], color:"#14532d", accent:"#86efac" },
  "fairy tail":          { posters: ["https://cdn.myanimelist.net/images/anime/5/18179.jpg"], color:"#1d4ed8", accent:"#93c5fd" },
  "re:zero":             { posters: ["https://cdn.myanimelist.net/images/anime/1522/128039.jpg"], color:"#1e1b4b", accent:"#c4b5fd" },
  "overlord":            { posters: ["https://cdn.myanimelist.net/images/anime/7/88019.jpg"], color:"#14532d", accent:"#86efac" },
  "tower of god":        { posters: ["https://cdn.myanimelist.net/images/anime/1/104578.jpg"], color:"#1e3a5f", accent:"#38bdf8" },
};

function findAnimePoster(title: string) {
  if (!title) return null;
  const lower = title.toLowerCase().trim();
  for (const [key, val] of Object.entries(ANIME_POSTERS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

const DEFAULT_THEMES = [
  { accent:"#f0abfc", bg:"linear-gradient(135deg,#1a0533,#6b21a8,#ec4899)", emoji:"⚔️" },
  { accent:"#7dd3fc", bg:"linear-gradient(135deg,#0c1445,#1e40af,#06b6d4)", emoji:"🌊" },
  { accent:"#fed7aa", bg:"linear-gradient(135deg,#1a0a00,#92400e,#f97316)", emoji:"🔥" },
  { accent:"#bbf7d0", bg:"linear-gradient(135deg,#0a1a00,#166534,#84cc16)", emoji:"🌸" },
  { accent:"#fda4af", bg:"linear-gradient(135deg,#1a0015,#9d174d,#f43f5e)", emoji:"💀" },
  { accent:"#c4b5fd", bg:"linear-gradient(135deg,#0f0a1a,#4c1d95,#7c3aed)", emoji:"🔮" },
  { accent:"#fde68a", bg:"linear-gradient(135deg,#1a1000,#78350f,#fbbf24)", emoji:"🗡️" },
  { accent:"#fca5a5", bg:"linear-gradient(135deg,#1a0a0a,#7f1d1d,#dc2626)", emoji:"🎭" },
];

// ── EXPANDED QUOTES LIST ───────────────────────────────────────────────────────
const QUOTES = [
  "Mistakes are the portals of discovery. — James Joyce",
  "An error doesn't become a mistake until you refuse to correct it.",
  "Every expert was once a beginner. — Helen Hayes",
  "The only real mistake is the one from which we learn nothing. — Henry Ford",
  "Pain is temporary. Glory is forever.",
  "Fall seven times, stand up eight. — Japanese Proverb",
  "Success is stumbling from failure to failure with no loss of enthusiasm. — Winston Churchill",
  "Your mistakes do not define you. Your response to them does.",
  "The man who never made a mistake never tried anything new. — Albert Einstein",
  "Failure is the tuition you pay for success. — Walter Brunell",
  "It's not how many times you fall, it's how many times you get back up.",
  "Don't fear failure. Fear being in the same place next year as you are today.",
  "Champions aren't made in gyms. Champions are made from something deep inside them. — Muhammad Ali",
  "Every mistake you make is progress. Mistakes aren't bad — they teach you what not to do.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Push yourself because no one else is going to do it for you.",
  "Doubt kills more dreams than failure ever will. — Suzy Kassem",
  "One mistake at a time, you build a fortress of knowledge.",
  "Errors are the proof that you are trying. Keep going.",
  "Review your mistakes today so they cannot defeat you tomorrow.",
];

const MISTAKE_COLORS: Record<string, string> = { Conceptual:"#00d4ff", Calculation:"#ff2254", "Silly mistake":"#ffd700", "Time pressure":"#a855f7" };
const SUBJECT_COLORS: Record<string, string> = { Physics:"#00d4ff", Math:"#ff2254", Chemistry:"#22c55e", Other:"#f97316" };
const STATUS_COLORS: Record<string, string> = { Completed:"#22c55e", Watching:"#00d4ff", Reading:"#ffd700" };
const MASTERY_COLORS = { red: "#ff2254", yellow: "#ffd700", green: "#22c55e" };

// ─── HXH NEN LEAGUES ─────────────────────────────────────────────────────────
export const NEN_LEAGUES = [
  { id:"enhancer",    name:"Enhancer",    icon:"💪", color:"#f97316", minXP:0,    desc:"You boost your own power! Every mistake you log makes you stronger.",    character:"Gon Freecss",    quote:"The basics are everything." },
  { id:"transmuter",  name:"Transmuter",  icon:"⚡", color:"#fbbf24", minXP:200,  desc:"You change and adapt! Learning to transform your weak points.",           character:"Killua Zoldyck", quote:"I can change anything into power." },
  { id:"emitter",     name:"Emitter",     icon:"🔥", color:"#ef4444", minXP:500,  desc:"You project your power outward! Your knowledge is spreading further.",    character:"Leorio",         quote:"My power reaches beyond myself." },
  { id:"conjurer",    name:"Conjurer",    icon:"🔮", color:"#a78bfa", minXP:1000, desc:"You create real things from nothing! Your mastery is becoming solid.",    character:"Kurapika",       quote:"I manifest what others cannot imagine." },
  { id:"manipulator", name:"Manipulator", icon:"🎮", color:"#38bdf8", minXP:2000, desc:"You control the battlefield! You understand your mistakes deeply.",       character:"Illumi Zoldyck", quote:"I control outcomes, not just react to them." },
  { id:"specialist",  name:"Specialist",  icon:"♾️", color:"#00d4ff", minXP:4000, desc:"You are UNIQUE! Beyond all categories — a true master of your craft.",   character:"Ging Freecss",   quote:"I have transcended the system itself." },
];

export function getNenLeague(xp: number) {
  return [...NEN_LEAGUES].reverse().find(l => xp >= l.minXP) ?? NEN_LEAGUES[0];
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const INP_STYLE: React.CSSProperties = {
  width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#e2e8f0",
  fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box",
};

const CHIP = (active: boolean, color: string): React.CSSProperties => ({
  padding:"5px 12px", borderRadius:20,
  border:`1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
  background: active ? `${color}22` : "transparent",
  color: active ? color : "#64748b",
  fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
});

// ─── PARTICLES ────────────────────────────────────────────────────────────────

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const pts = Array.from({ length:55 }, () => ({
      x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3,
      dx: (Math.random()-.5)*.3, dy: (Math.random()-.5)*.3,
      col: Math.random()>.5 ? "#00d4ff" : "#ff2254", a: Math.random()*.5+.1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.col; ctx.globalAlpha=p.a; ctx.fill();
        p.x+=p.dx; p.y+=p.dy;
        if(p.x<0||p.x>W) p.dx*=-1; if(p.y<0||p.y>H) p.dy*=-1;
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<100){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle="#00d4ff"; ctx.globalAlpha=(1-d/100)*.07; ctx.lineWidth=.5; ctx.stroke(); }
      }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{ W=c.width=window.innerWidth; H=c.height=window.innerHeight; };
    window.addEventListener("resize",resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
}

// ─── GLASS CARD ───────────────────────────────────────────────────────────────

function GlassCard({ children, style={}, onClick, hover=true }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setHov(true)}
      onMouseLeave={()=>hover&&setHov(false)}
      style={{
        background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)",
        border:`1px solid ${hov?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.08)"}`,
        borderRadius:16, padding:20, transition:"all 0.3s ease",
        transform:hov?"translateY(-2px)":"none",
        boxShadow:hov?"0 8px 32px rgba(0,212,255,0.15)":"0 4px 16px rgba(0,0,0,0.3)",
        cursor:onClick?"pointer":"default", ...style,
      }}>
      {children}
    </div>
  );
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<{ id:number; msg:string; type:"success"|"error"|"xp" }[]>([]);
  const add = useCallback((msg:string, type:"success"|"error"|"xp"="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }: { toasts: any[] }) {
  const colors = { success:"#22c55e", error:"#ff2254", xp:"#ffd700" };
  return (
    <div style={{ position:"fixed", bottom:100, right:16, zIndex:999, display:"flex", flexDirection:"column", gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:"rgba(10,14,26,0.95)", backdropFilter:"blur(12px)",
          border:`1px solid ${colors[t.type as keyof typeof colors]}44`,
          borderLeft:`3px solid ${colors[t.type as keyof typeof colors]}`,
          borderRadius:12, padding:"12px 18px", fontSize:13, color:"#e2e8f0",
          display:"flex", alignItems:"center", gap:10, maxWidth:300,
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
          animation:"slideInToast 0.3s ease",
        }}>
          <span>{t.type==="xp"?"⚡":t.type==="error"?"❌":"✅"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── MASTERY BAR ──────────────────────────────────────────────────────────────

function MasteryBar({ level, stage, showLabel=true }: { level:number; stage:ErrorEntry["masteryStage"]; showLabel?:boolean }) {
  const color = MASTERY_COLORS[stage];
  const label = stage === "green" ? "Mastered" : stage === "yellow" ? "Learning" : "Weak";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:10, color:"#64748b", fontWeight:600, letterSpacing:1 }}>MASTERY</span>
          <span style={{ fontSize:10, color, fontWeight:700 }}>{label} · {level}%</span>
        </div>
      )}
      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${level}%`, background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:3, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── REVIEW INTERVAL BADGE ────────────────────────────────────────────────────

function RevisionBadge({ nextDate }: { nextDate: string }) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = nextDate < today;
  const isDueToday = nextDate === today;
  const color = isOverdue ? "#ff2254" : isDueToday ? "#ffd700" : "#64748b";
  const label = isOverdue ? "⚠️ Overdue" : isDueToday ? "📅 Due Today" : `📅 ${nextDate}`;
  return (
    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:`${color}18`, color, border:`1px solid ${color}33`, fontWeight:600 }}>
      {label}
    </span>
  );
}

// ─── XP POPUP ─────────────────────────────────────────────────────────────────

function XPPopup({ xp, onDone }: { xp:number; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return ()=>clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)", zIndex:9999,
      background:"linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,107,53,0.2))",
      border:"1px solid rgba(255,215,0,0.4)", borderRadius:20, padding:"16px 32px",
      textAlign:"center", backdropFilter:"blur(20px)", animation:"popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
    }}>
      <div style={{ fontSize:36, fontWeight:900, color:"#ffd700", fontFamily:"'Bebas Neue',cursive", letterSpacing:3 }}>+{xp} XP</div>
      <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>Keep grinding! ⚡</div>
    </div>
  );
}

// ─── LEVEL BANNER ─────────────────────────────────────────────────────────────

function LevelBanner({ xpData }: { xpData: UserXP }) {
  const currentLevel = LEVELS.find(l => l.level === xpData.level) ?? LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === xpData.level + 1);
  const progress = nextLevel
    ? ((xpData.totalXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  return (
    <GlassCard hover={false} style={{
      padding:20, marginBottom:20,
      background:"linear-gradient(135deg,rgba(123,97,255,0.1),rgba(0,212,255,0.05))",
      border:"1px solid rgba(123,97,255,0.25)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" as const }}>
        <div style={{ fontSize:36 }}>{currentLevel.icon}</div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>{xpData.levelName?.toUpperCase()}</span>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:12, background:"rgba(123,97,255,0.2)", color:"#a78bfa", border:"1px solid rgba(123,97,255,0.3)" }}>Level {xpData.level}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b", marginBottom:5 }}>
            <span>{xpData.totalXP} XP</span>
            <span>{nextLevel ? `${nextLevel.minXP} XP to ${nextLevel.name}` : "MAX LEVEL 👑"}</span>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min(progress,100)}%`, background:"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:3, transition:"width 1s ease" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:"#ffd700", fontFamily:"'Bebas Neue',cursive" }}>{xpData.currentStreak ?? 0}</div>
            <div style={{ fontSize:10, color:"#64748b" }}>🔥 STREAK</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:"#a855f7", fontFamily:"'Bebas Neue',cursive" }}>{(xpData.badges ?? []).length}</div>
            <div style={{ fontSize:10, color:"#64748b" }}>🏅 BADGES</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── BADGES PANEL ─────────────────────────────────────────────────────────────

function BadgesPanel({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
      {BADGES.map(b => {
        const unlocked = earnedSet.has(b.id);
        return (
          <GlassCard key={b.id} style={{
            padding:16, textAlign:"center", opacity:unlocked?1:0.45,
            filter:unlocked?"none":"grayscale(1)",
            border:unlocked?"1px solid rgba(255,215,0,0.2)":undefined,
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>{b.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>{b.name}</div>
            <div style={{ fontSize:11, color:"#64748b", lineHeight:1.4 }}>{b.desc}</div>
            {unlocked && <div style={{ fontSize:10, color:"#ffd700", marginTop:6, fontWeight:600 }}>✓ EARNED</div>}
          </GlassCard>
        );
      })}
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

function PieChart({ data }: { data:{label:string;value:number;color:string}[] }) {
  const total = data.reduce((s,d)=>s+d.value,0) || 1;
  let cum = 0;
  const slices = data.map(d => {
    const s=cum, e=cum+d.value/total; cum=e;
    const sa=s*2*Math.PI-Math.PI/2, ea=e*2*Math.PI-Math.PI/2;
    const x1=50+40*Math.cos(sa),y1=50+40*Math.sin(sa),x2=50+40*Math.cos(ea),y2=50+40*Math.sin(ea);
    return { ...d, d:`M50,50 L${x1},${y1} A40,40 0 ${d.value/total>.5?1:0},1 ${x2},${y2} Z` };
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width:160, height:160 }}>
      {slices.map((s,i) => <path key={i} d={s.d} fill={s.color} opacity={0.85} stroke="#0a0e1a" strokeWidth={0.5}><title>{s.label}: {s.value}</title></path>)}
    </svg>
  );
}

function BarChart({ data }: { data:{label:string;value:number;color:string}[] }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:100 }}>
      {data.map((d,i) => (
        <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:10, color:"#94a3b8" }}>{d.value}</div>
          <div style={{ width:32, height:`${(d.value/max)*80}px`, background:`linear-gradient(to top,${d.color},${d.color}88)`, borderRadius:"4px 4px 0 0", minHeight:4 }} />
          <div style={{ fontSize:9, color:"#64748b", writingMode:"vertical-rl" as const, transform:"rotate(180deg)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data:{week:string;count:number}[] }) {
  if (data.length === 0) return <div style={{ textAlign:"center", padding:40, color:"#475569", fontSize:13 }}>No data yet</div>;
  const max = Math.max(...data.map(d=>d.count), 1);
  const W=400, H=100, pad=20;
  const pts = data.map((d,i) => ({
    x: pad + (i/(data.length-1||1))*(W-pad*2),
    y: H - pad - (d.count/max)*(H-pad*2),
    ...d,
  }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:500, height:120 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#00d4ff" />
          <text x={p.x} y={H-2} textAnchor="middle" fontSize={8} fill="#475569">{p.week.slice(5)}</text>
        </g>
      ))}
    </svg>
  );
}

function HeatmapBar({ chapters }: { chapters:{chapter:string;subject:string;count:number}[] }) {
  const max = Math.max(...chapters.map(c=>c.count), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {chapters.slice(0,10).map((c,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:120, fontSize:11, color:"#94a3b8", textAlign:"right", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{c.chapter}</div>
          <div style={{ flex:1, height:16, background:"rgba(255,255,255,0.04)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(c.count/max)*100}%`, background:`linear-gradient(90deg,${SUBJECT_COLORS[c.subject]||"#888"},${SUBJECT_COLORS[c.subject]||"#888"}88)`, borderRadius:4, transition:"width 0.8s ease", display:"flex", alignItems:"center", paddingLeft:6 }}>
              <span style={{ fontSize:9, color:"#000", fontWeight:700, opacity:(c.count/max)>0.5?1:0 }}>{c.count}</span>
            </div>
          </div>
          <span style={{ fontSize:11, color:"#64748b", width:20, textAlign:"right" }}>{c.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── STREAK CALENDAR ──────────────────────────────────────────────────────────

function StreakCalendar({ userId, streak, onClose }: { userId:string; streak:number; onClose:()=>void }) {
  const today = new Date();
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [vd, setVd] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [active, setActive] = useState<Set<string>>(new Set());
  useEffect(() => {
    getDailyActivityForMonth(userId, vd.getFullYear(), vd.getMonth()).then(d => setActive(new Set(d)));
  }, [userId, vd]);
  const y=vd.getFullYear(), m=vd.getMonth(), fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
  const todayStr = today.toISOString().split("T")[0];
  const days: any[] = [...Array(fd).fill(null), ...Array.from({length:dim},(_,i)=>i+1)];
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <GlassCard hover={false} style={{ padding:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:22,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#ffd700" }}>🔥 STREAK CALENDAR</h2>
            <button onClick={onClose} style={{ background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ textAlign:"center",marginBottom:20,padding:16,background:"rgba(255,215,0,0.08)",borderRadius:12,border:"1px solid rgba(255,215,0,0.2)" }}>
            <div style={{ fontSize:56,fontFamily:"'Bebas Neue',cursive",color:"#ffd700",lineHeight:1 }}>{streak}</div>
            <div style={{ fontSize:13,color:"#94a3b8",marginTop:4 }}>day streak</div>
            <div style={{ fontSize:11,color:"#64748b",marginTop:6 }}>Add 3+ entries daily to keep it alive 🔥</div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <button onClick={()=>setVd(new Date(y,m-1,1))} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18 }}>‹</button>
            <span style={{ fontSize:15,fontWeight:700,color:"#e2e8f0" }}>{MONTHS[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1,1))} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18 }}>›</button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8 }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{ textAlign:"center",fontSize:10,color:"#475569",fontWeight:700,padding:"4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4 }}>
            {days.map((day,i) => {
              if(!day) return <div key={i}/>;
              const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isToday=ds===todayStr, isActive=active.has(ds), isPast=new Date(ds)<today&&!isToday;
              return <div key={i} style={{ aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontSize:12,fontWeight:isToday?800:500,background:isActive?"linear-gradient(135deg,#ffd700,#f97316)":isToday?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.03)",border:isToday?"2px solid #00d4ff":"1px solid rgba(255,255,255,0.05)",color:isActive?"#000":isToday?"#00d4ff":isPast?"#334155":"#94a3b8" }}>
                {day}{isActive&&<div style={{ fontSize:8,marginTop:1 }}>✓</div>}
              </div>;
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── INFO PANEL (how to use) ──────────────────────────────────────────────────

function InfoPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const pages = [
    { icon:"⚡", title:"Welcome to ErrorVerse!", color:"#00d4ff", content:"ErrorVerse is like your **training journal** — but way cooler!\n\nEvery time you get a question wrong in school, you write it here. Then the app helps you fix it and never forget it again!", tip:"Think of it like catching your mistakes before they catch you in the exam! 🎯", visual:(<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,margin:"16px 0"}}>{[{e:"📝",l:"Write it"},{e:"→",l:""},{e:"🔁",l:"Review"},{e:"→",l:""},{e:"🏆",l:"Master it!"}].map((s,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:s.e==="→"?20:32}}>{s.e}</div>{s.l&&<div style={{fontSize:9,color:"#64748b"}}>{s.l}</div>}</div>))}</div>) },
    { icon:"📝", title:"Learn Tab — Your Error Book", color:"#ff2254", content:"This is where you **write down your mistakes**!\n\nWhen you get something wrong, tap the **+ Add Error** button and fill in the subject, chapter, why you got it wrong, and the correct answer.", tip:"Be honest about WHY you made the mistake — that's the secret sauce! 🔑", visual:(<div style={{background:"rgba(255,34,84,0.1)",border:"1px solid rgba(255,34,84,0.3)",borderRadius:12,padding:12,margin:"12px 0"}}><div style={{fontSize:11,color:"#ff8099",marginBottom:6}}>Example entry:</div><div style={{fontSize:13,color:"#e2e8f0"}}>📚 Physics → Kinematics</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>❌ Why: Forgot to square the velocity</div><div style={{fontSize:12,color:"#22c55e",marginTop:4}}>✅ Correct: v² = u² + 2as</div></div>) },
    { icon:"🔁", title:"Review Tab — Don't Forget!", color:"#00d4ff", content:"This is the **magic part**!\n\nThe app sends your old mistakes back at the PERFECT time — just when you're about to forget. Scientists call this **Spaced Repetition** and it's the fastest way to remember anything forever!", tip:"Hit ✅ Mastered when you can solve it easily. Hit 📖 Reviewed if you still need practice! 💪", visual:(<div style={{display:"flex",gap:6,margin:"12px 0",flexWrap:"wrap" as const}}>{[{label:"Day 1",color:"#ff2254",text:"Learn it"},{label:"Day 3",color:"#ffd700",text:"Review"},{label:"Day 7",color:"#f97316",text:"Review"},{label:"Day 30",color:"#22c55e",text:"Mastered!"}].map(s=>(<div key={s.label} style={{flex:1,minWidth:60,padding:"8px 4px",borderRadius:8,background:`${s.color}18`,border:`1px solid ${s.color}44`,textAlign:"center" as const}}><div style={{fontSize:10,color:s.color,fontWeight:700}}>{s.label}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{s.text}</div></div>))}</div>) },
    { icon:"📊", title:"Stats — See Your Progress", color:"#a855f7", content:"This shows you **cool charts and graphs** about your mistakes!\n\nYou can see which subject trips you up most, how many you fixed this week, and which chapters are your weakest spots.\n\nAccess Stats by tapping **Review** then the 📊 icon inside!", tip:"The chapters with the tallest bars need the most practice! 📈", visual:(<div style={{margin:"12px 0"}}>{[{label:"Physics",pct:80,color:"#00d4ff"},{label:"Math",pct:55,color:"#ff2254"},{label:"Chemistry",pct:35,color:"#22c55e"}].map(s=>(<div key={s.label} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8",marginBottom:3}}><span>{s.label}</span><span>{s.pct}%</span></div><div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${s.pct}%`,background:`linear-gradient(90deg,${s.color},${s.color}88)`,borderRadius:4}}/></div></div>))}</div>) },
    { icon:"🔥", title:"Heat Map — Your Activity", color:"#f97316", content:"The **Heat Map** shows every day you used the app!\n\nThe **brighter the square**, the more you studied that day. Try to make your whole calendar glow!", tip:"Green squares = active days. Try to make a long chain without any dark spots! 🟩🟩🟩", visual:(<div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:3,margin:"12px 0"}}>{[0,0,1,2,3,2,1,0,2,3,3,2,1,2,3,0,1,2,3,3,2,3,3,2,1,2,3,3,3,3].map((n,i)=>{const c=["rgba(255,255,255,0.05)","rgba(249,115,22,0.3)","rgba(249,115,22,0.6)","rgba(249,115,22,1)"];return <div key={i} style={{aspectRatio:"1",borderRadius:3,background:c[n]}}/>;})}
</div>) },
    { icon:"🏆", title:"Rank Tab — Beat Everyone!", color:"#ffd700", content:"See where you stand against **all other students** in your Nen League!\n\nEvery week, the **top 3 warriors PROMOTE** up! The bottom 3 go back down — just like Duolingo!", tip:"The secret to ranking up? ZERO repeated mistakes! 🎯", visual:(<div style={{margin:"12px 0"}}>{[{rank:"🥇",name:"Gojo_Fan99",m:0,c:"#ffd700"},{rank:"🥈",name:"NarutoKing",m:1,c:"#c0c0c0"},{rank:"🥉",name:"You!",m:2,c:"#cd7f32"}].map(p=>(<div key={p.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:`${p.c}10`,marginBottom:6}}><span style={{fontSize:18}}>{p.rank}</span><span style={{flex:1,fontSize:13,color:"#e2e8f0",fontWeight:600}}>{p.name}</span><span style={{fontSize:11,color:p.m===0?"#22c55e":"#ff8099"}}>♻ {p.m} repeats</span></div>))}</div>) },
    { icon:"♾️", title:"Nen Leagues — Your Power Level!", color:"#00d4ff", content:"Your rank uses **Hunter x Hunter Nen types** — just like your favourite anime!\n\nStart as Enhancer 💪 and reach Specialist ♾️ — the rarest type! Earn XP by logging and mastering errors.", tip:"Specialist ♾️ is the rarest Nen type — only the greatest warriors reach it! 👑", visual:(<div style={{display:"flex",flexDirection:"column",gap:5,margin:"8px 0"}}>{NEN_LEAGUES.map((l,i)=>(<div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:8,background:`${l.color}12`,border:`1px solid ${l.color}33`,opacity:0.5+i*0.1}}><span style={{fontSize:14}}>{l.icon}</span><span style={{fontSize:11,color:l.color,fontWeight:700,flex:1}}>{l.name}</span><span style={{fontSize:10,color:"#64748b"}}>{l.minXP}+ XP</span></div>))}</div>) },
    { icon:"🤖", title:"AI Hub — Your Smart Helper!", color:"#a855f7", content:"The **AI Hub** is like a super-smart tutor available 24/7!\n\nIt finds patterns in your mistakes, suggests what to study next, and explains WHY you keep getting things wrong.", tip:"Ask it anything! Try: 'Why do I keep making calculation mistakes?' 🤖", visual:(<div style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:12,padding:12,margin:"12px 0"}}><div style={{fontSize:12,color:"#94a3b8",marginBottom:6}}>💬 You ask:</div><div style={{fontSize:13,color:"#c4b5fd",fontStyle:"italic"}}>"What is my weakest chapter this week?"</div><div style={{fontSize:12,color:"#94a3b8",marginTop:8,marginBottom:4}}>🤖 AI says:</div><div style={{fontSize:12,color:"#e2e8f0"}}>"You've made 7 mistakes in Kinematics. Here's what to focus on..."</div></div>) },
    { icon:"🔥", title:"Streaks — Never Stop!", color:"#ffd700", content:"Log **3 or more errors** every day to keep your streak alive!\n\nMiss a day and it resets to zero — so never stop!", tip:"Even on easy days, find 3 small mistakes to log. Consistency beats intensity! 🔥", visual:(<div style={{textAlign:"center",margin:"12px 0"}}><div style={{display:"flex",justifyContent:"center",gap:6}}>{[true,true,true,true,true,false,false].map((active,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:32,height:32,borderRadius:8,background:active?"linear-gradient(135deg,#ffd700,#f97316)":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{active?"🔥":"○"}</div><div style={{fontSize:8,color:"#475569"}}>{"SMTWTFS"[i]}</div></div>))}</div><div style={{fontSize:11,color:"#ffd700",marginTop:8,fontWeight:600}}>5 day streak! Keep going! 🔥</div></div>) },
  ];
  const cur = pages[page];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:420,maxHeight:"94vh",overflowY:"auto",scrollbarWidth:"none" as any}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#94a3b8",fontSize:18,cursor:"pointer",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{background:"rgba(8,12,24,0.98)",border:`1px solid ${cur.color}33`,borderRadius:24,padding:24,position:"relative" as const,overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`${cur.color}15`,filter:"blur(40px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:20}}>
            {pages.map((_,i)=>(<div key={i} onClick={()=>setPage(i)} style={{height:4,borderRadius:2,background:i===page?cur.color:"rgba(255,255,255,0.1)",width:i===page?24:8,transition:"all 0.3s",cursor:"pointer"}}/>))}
          </div>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{display:"inline-flex",width:72,height:72,borderRadius:"50%",background:`${cur.color}18`,border:`2px solid ${cur.color}44`,alignItems:"center",justifyContent:"center",fontSize:36}}>{cur.icon}</div>
          </div>
          <div style={{fontSize:20,fontWeight:900,color:"#e2e8f0",fontFamily:"'Bebas Neue',cursive",letterSpacing:2,textAlign:"center",marginBottom:14}}>{cur.title}</div>
          <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.7,marginBottom:8}}>
            {cur.content.split('\n').map((line,i)=>(<div key={i} style={{marginBottom:line===""?8:4}}>{line.split('**').map((part,j)=>j%2===1?<span key={j} style={{color:"#e2e8f0",fontWeight:700}}>{part}</span>:<span key={j}>{part}</span>)}</div>))}
          </div>
          {cur.visual}
          <div style={{padding:"10px 14px",borderRadius:12,background:`${cur.color}10`,border:`1px solid ${cur.color}30`,marginTop:10,marginBottom:20}}>
            <div style={{fontSize:12,color:cur.color,lineHeight:1.5}}>💡 {cur.tip}</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            {page>0&&<button onClick={()=>setPage(p=>p-1)} style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94a3b8",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>← Back</button>}
            {page<pages.length-1
              ?<button onClick={()=>setPage(p=>p+1)} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${cur.color},${cur.color}88)`,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:1}}>Next →</button>
              :<button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:1}}>LET'S GO! ⚡</button>
            }
          </div>
          <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"#334155"}}>{page+1} / {pages.length}</div>
        </div>
      </div>
    </div>
  );
}

// ─── WELCOME PAGE (new user onboarding) ───────────────────────────────────────

function WelcomePage({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated star field background
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      col: ["#00d4ff", "#ff2254", "#ffd700", "#a855f7", "#22c55e"][Math.floor(Math.random() * 5)],
      a: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));
    let raf: number, t = 0;
    const draw = () => {
      t += 0.02;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const alpha = s.a * (0.6 + 0.4 * Math.sin(t + s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.col;
        ctx.globalAlpha = alpha;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -5) { s.y = H + 5; s.x = Math.random() * W; }
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const steps = [
    {
      icon: "⚡",
      iconGlow: "#00d4ff",
      title: "Welcome to",
      titleHighlight: "ErrorVerse",
      sub: "The smartest way to study",
      desc: "Turn every mistake into a superpower. This app is your personal training ground — log errors, track progress, and never repeat the same mistake twice.",
      visual: (
        <div style={{ display: "flex", justifyContent: "center", gap: 20, margin: "24px 0" }}>
          {["📝", "🔁", "🏆"].map((e, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: `rgba(0,212,255,${0.1 + i * 0.05})`,
                border: "1px solid rgba(0,212,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
                animation: `floatUp${i} 2s ease-in-out ${i * 0.3}s infinite alternate`,
              }}>{e}</div>
              <span style={{ fontSize: 11, color: "#64748b" }}>{["Log it", "Review it", "Own it"][i]}</span>
            </div>
          ))}
        </div>
      ),
      color: "#00d4ff",
    },
    {
      icon: "📝",
      iconGlow: "#ff2254",
      title: "Log Your",
      titleHighlight: "Mistakes",
      sub: "Every error is a lesson",
      desc: "Whenever you get something wrong — in class, homework, or mock tests — just open ErrorVerse and tap '+ Add Error'. Fill in the subject, chapter, and what went wrong.",
      visual: (
        <div style={{ background: "rgba(255,34,84,0.08)", border: "1px solid rgba(255,34,84,0.25)", borderRadius: 16, padding: 16, margin: "20px 0" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {["Physics", "Math", "Chemistry"].map((s, i) => (
              <div key={s} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${Object.values(SUBJECT_COLORS)[i]}18`, color: Object.values(SUBJECT_COLORS)[i], border: `1px solid ${Object.values(SUBJECT_COLORS)[i]}44` }}>{s}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 6 }}>📚 Chapter: Kinematics</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>❌ Why: Forgot to use v² = u² + 2as</div>
          <div style={{ fontSize: 12, color: "#22c55e" }}>✅ Fix: Always list what's given first</div>
        </div>
      ),
      color: "#ff2254",
    },
    {
      icon: "🔁",
      iconGlow: "#00d4ff",
      title: "Review at the",
      titleHighlight: "Right Time",
      sub: "Science-backed spaced repetition",
      desc: "The app reminds you to review each mistake at exactly the right time — Day 1, Day 3, Day 7, Day 30. This is called Spaced Repetition and it's how top scorers actually study!",
      visual: (
        <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" as const }}>
          {[{ d: "Day 1", c: "#ff2254", p: 100 }, { d: "Day 3", c: "#ffd700", p: 75 }, { d: "Day 7", c: "#f97316", p: 50 }, { d: "Day 30", c: "#22c55e", p: 25 }].map(s => (
            <div key={s.d} style={{ flex: 1, minWidth: 60, padding: "10px 8px", borderRadius: 12, background: `${s.c}12`, border: `1px solid ${s.c}33`, textAlign: "center" as const }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{s.d}</div>
              <div style={{ height: 40, display: "flex", alignItems: "flex-end", justifyContent: "center", margin: "6px 0" }}>
                <div style={{ width: 16, height: `${s.p}%`, background: `linear-gradient(to top,${s.c},${s.c}66)`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 9, color: "#64748b" }}>review</div>
            </div>
          ))}
        </div>
      ),
      color: "#00d4ff",
    },
    {
      icon: "🏆",
      iconGlow: "#ffd700",
      title: "Climb the",
      titleHighlight: "Leaderboard",
      sub: "Compete like a champion",
      desc: "Earn XP by logging and mastering mistakes. Climb from Enhancer 💪 all the way to Specialist ♾️ — the rarest Nen type, just like your favourite HxH characters!",
      visual: (
        <div style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {NEN_LEAGUES.slice(0, 3).map((l, i) => (
              <div key={l.id} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, background: `${l.color}12`, border: `1px solid ${l.color}33`, textAlign: "center" as const }}>
                <div style={{ fontSize: 20 }}>{l.icon}</div>
                <div style={{ fontSize: 9, color: l.color, fontWeight: 700, marginTop: 4 }}>{l.name}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>Start → Earn XP → Level Up → ♾️</div>
        </div>
      ),
      color: "#ffd700",
    },
    {
      icon: "🚀",
      iconGlow: "#22c55e",
      title: "You're",
      titleHighlight: "Ready!",
      sub: "Your journey starts now",
      desc: "Log 3 mistakes a day to build your streak 🔥. Master every error, climb the leaderboard, and become the version of yourself that never repeats mistakes.",
      visual: (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <div style={{ fontSize: 64, marginBottom: 12, animation: "spinOnce 1s ease-out" }}>🚀</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" as const }}>
            {["Log daily 📝", "Review smart 🔁", "Rank up 🏆", "Never repeat ♾️"].map(t => (
              <div key={t} style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", fontSize: 12, color: "#22c55e", fontWeight: 600 }}>{t}</div>
            ))}
          </div>
        </div>
      ),
      color: "#22c55e",
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setLeaving(true);
      setTimeout(onDone, 600);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#050810",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 20,
      opacity: leaving ? 0 : 1,
      transition: "opacity 0.6s ease",
    }}>
      <style>{`
        @keyframes floatUp0 { from { transform: translateY(0px); } to { transform: translateY(-8px); } }
        @keyframes floatUp1 { from { transform: translateY(0px); } to { transform: translateY(-8px); } }
        @keyframes floatUp2 { from { transform: translateY(0px); } to { transform: translateY(-8px); } }
        @keyframes spinOnce { from { transform: rotate(-20deg) scale(0.5); opacity:0; } to { transform: rotate(0deg) scale(1); opacity:1; } }
        @keyframes welcomeFadeIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px ${cur.iconGlow}44; } 50% { box-shadow: 0 0 50px ${cur.iconGlow}88, 0 0 80px ${cur.iconGlow}33; } }
        @keyframes orbitLeft { from { transform: translateX(0) rotate(0deg); } to { transform: translateX(-10px) rotate(360deg); } }
        @keyframes orbitRight { from { transform: translateX(0) rotate(0deg); } to { transform: translateX(10px) rotate(-360deg); } }
      `}</style>

      {/* Star canvas bg */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* Glow orbs */}
      <div style={{ position: "fixed", top: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: `${cur.color}08`, filter: "blur(80px)", pointerEvents: "none", zIndex: 0, animation: "orbitLeft 8s ease-in-out infinite alternate" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: 250, height: 250, borderRadius: "50%", background: `#ff225408`, filter: "blur(80px)", pointerEvents: "none", zIndex: 0, animation: "orbitRight 10s ease-in-out infinite alternate" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, animation: "welcomeFadeIn 0.5s ease" }} key={step}>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              height: 4, borderRadius: 2, cursor: "pointer", transition: "all 0.3s",
              width: i === step ? 28 : 8,
              background: i === step ? cur.color : i < step ? `${cur.color}55` : "rgba(255,255,255,0.12)",
            }} />
          ))}
        </div>

        {/* Main card */}
        <div style={{
          background: "rgba(8,12,24,0.96)",
          border: `1px solid ${cur.color}30`,
          borderRadius: 28,
          padding: "32px 28px",
          backdropFilter: "blur(24px)",
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${cur.color}15`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Corner glow */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `${cur.color}12`, filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              display: "inline-flex", width: 90, height: 90, borderRadius: "50%",
              background: `${cur.iconGlow}15`,
              border: `2px solid ${cur.iconGlow}40`,
              alignItems: "center", justifyContent: "center",
              fontSize: 44,
              animation: "pulseGlow 2.5s ease-in-out infinite",
            }}>{cur.icon}</div>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 4 }}>{cur.sub}</div>
            <div style={{ fontSize: 32, fontFamily: "'Bebas Neue',cursive", letterSpacing: 3, lineHeight: 1.1 }}>
              <span style={{ color: "#e2e8f0" }}>{cur.title} </span>
              <span style={{ color: cur.color }}>{cur.titleHighlight}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, textAlign: "center", marginBottom: 4 }}>{cur.desc}</div>

          {/* Visual */}
          {cur.visual}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 0, padding: "13px 18px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#64748b", fontFamily: "inherit", fontSize: 14, cursor: "pointer",
              }}>←</button>
            )}
            <button onClick={handleNext} style={{
              flex: 1, padding: "14px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg,${cur.color},${cur.color}99)`,
              color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 800,
              cursor: "pointer", letterSpacing: 1,
              boxShadow: `0 8px 24px ${cur.color}44`,
              transition: "all 0.2s",
            }}>
              {isLast ? "START MY JOURNEY ⚡" : "NEXT →"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#334155" }}>{step + 1} of {steps.length}</div>
        </div>

        {/* Skip button */}
        {!isLast && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { setLeaving(true); setTimeout(onDone, 600); }} style={{
              background: "none", border: "none", color: "#334155", fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
            }}>Skip intro →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STREAK BANNER ────────────────────────────────────────────────────────────

function StreakBanner({ todayCount, streak }: { todayCount:number; streak:number }) {
  const needed=Math.max(0,3-todayCount), pct=Math.min(100,(todayCount/3)*100), q=todayCount>=3;
  return (
    <GlassCard hover={false} style={{ padding:16,marginBottom:20,background:q?"rgba(34,197,94,0.08)":"rgba(255,215,0,0.06)",border:`1px solid ${q?"rgba(34,197,94,0.3)":"rgba(255,215,0,0.2)"}` }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:20 }}>{q?"🔥":"⏳"}</span>
          <span style={{ fontSize:13,fontWeight:600,color:q?"#22c55e":"#ffd700" }}>{q?`Streak active! ${streak} day${streak!==1?"s":""}`:`Add ${needed} more entr${needed===1?"y":"ies"} to activate streak!`}</span>
        </div>
        <span style={{ fontSize:12,color:"#64748b" }}>{todayCount}/3 today</span>
      </div>
      <div style={{ height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:q?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#ffd700,#f97316)",borderRadius:3,transition:"width 0.5s ease" }} />
      </div>
    </GlassCard>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin:(u:any)=>void }) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="signup"&&!name.trim()){setError("Enter your name.");setLoading(false);return;}
      const u=mode==="signup"?await signUp(email,password,name):await signIn(email,password);
      if(u) onLogin(u);
    } catch(e:any) {
      setError(e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"?"Incorrect password.":e.code==="auth/email-already-in-use"?"Email already in use.":e.code==="auth/weak-password"?"Password must be 6+ chars.":"Something went wrong.");
    }
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:420 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ fontSize:48,marginBottom:8 }}>⚡</div>
          <h1 style={{ fontSize:36,fontFamily:"'Bebas Neue',cursive",letterSpacing:4,background:"linear-gradient(135deg,#00d4ff,#ff2254)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0 }}>ERRORVERSE</h1>
          <p style={{ color:"#64748b",fontSize:13,marginTop:6 }}>Master your mistakes. Own your story.</p>
        </div>
        <GlassCard hover={false} style={{ padding:32 }}>
          <div style={{ display:"flex",gap:8,marginBottom:24 }}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?"rgba(255,255,255,0.08)":"transparent",color:mode===m?"#00d4ff":"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:600,borderBottom:mode===m?"2px solid #00d4ff":"2px solid transparent",transition:"all 0.2s" }}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {mode==="signup"&&<input style={INP_STYLE} placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />}
            <input style={INP_STYLE} placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input style={INP_STYLE} placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
            {error&&<div style={{ fontSize:12,color:"#ff2254",padding:"8px 12px",background:"rgba(255,34,84,0.1)",borderRadius:8 }}>{error}</div>}
            <button onClick={handle} disabled={loading} style={{ width:"100%",padding:"13px",borderRadius:10,border:"none",background:loading?"rgba(0,212,255,0.3)":"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:1 }}>
              {loading?"...":(mode==="login"?"ENTER THE VERSE":"BEGIN JOURNEY")}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── ERROR FORM ───────────────────────────────────────────────────────────────

function ErrorForm({ onSubmit, onClose }: any) {
  const [form,setForm]=useState({
    subject:"Physics" as ErrorEntry["subject"],
    chapter:"",
    questionType:"Numerical" as ErrorEntry["questionType"],
    mistakeType:"Conceptual" as ErrorEntry["mistakeType"],
    difficulty:"Medium" as ErrorEntry["difficulty"],
    solution:"",
    lesson:"",
    whyMistake:"",
    formula:"",
  });
  const set=(k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.value}));
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:580,maxHeight:"92vh",overflow:"auto" }}>
        <GlassCard hover={false} style={{ padding:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,color:"#00d4ff",fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>+ NEW ERROR ENTRY</h2>
            <button onClick={onClose} style={{ background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>SUBJECT</label>
                <select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.subject} onChange={set("subject")}>
                  {["Physics","Chemistry","Math","Other"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>CHAPTER</label>
                <input style={INP_STYLE} placeholder="e.g. Kinematics" value={form.chapter} onChange={set("chapter")} />
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>QUESTION TYPE</label>
                <select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.questionType} onChange={set("questionType")}>
                  {["Numerical","Theory","Proof","MCQ"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>MISTAKE TYPE</label>
                <select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.mistakeType} onChange={set("mistakeType")}>
                  {["Conceptual","Calculation","Silly mistake","Time pressure"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>DIFFICULTY</label>
                <select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.difficulty} onChange={set("difficulty")}>
                  {["Easy","Medium","Hard"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>❓ WHY DID I MAKE THIS MISTAKE?</label>
              <textarea style={{ ...INP_STYLE,height:64,resize:"vertical" } as any} placeholder="Be brutally honest..." value={form.whyMistake} onChange={set("whyMistake")} />
            </div>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>✅ CORRECT SOLUTION / CONCEPT</label>
              <textarea style={{ ...INP_STYLE,height:80,resize:"vertical" } as any} placeholder="Write the correct approach..." value={form.solution} onChange={set("solution")} />
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>🔢 FORMULA / KEY POINT</label>
                <input style={INP_STYLE} placeholder="e.g. F = ma" value={form.formula} onChange={set("formula")} />
              </div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>💡 LESSON LEARNED</label>
                <input style={INP_STYLE} placeholder="What to remember next time?" value={form.lesson} onChange={set("lesson")} />
              </div>
            </div>
            <button
              onClick={()=>{ if(!form.chapter.trim()){return;} onSubmit({...form,date:new Date().toISOString().split("T")[0]}); onClose(); }}
              style={{ padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ff2254,#ff6b35)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1 }}>
              RECORD MISTAKE (+{XP_REWARDS.addError} XP) ⚡
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── COLLECTION FORM ──────────────────────────────────────────────────────────

function CollectionForm({ onSubmit, onClose }: any) {
  const [form,setForm]=useState({title:"",type:"Anime",status:"Watching",rating:8,genre:"Action",notes:"",powerLevel:5000});
  const set=(k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.type==="number"?Number(e.target.value):e.target.value}));
  const match=findAnimePoster(form.title);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto" }}>
        <GlassCard hover={false} style={{ padding:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,color:"#a855f7",fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>🎌 ADD TO COLLECTION</h2>
            <button onClick={onClose} style={{ background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer" }}>✕</button>
          </div>
          {match&&(
            <div style={{ marginBottom:16,borderRadius:10,overflow:"hidden",height:80,position:"relative" as const }}>
              <img src={match.posters[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:"top" }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.7),transparent)",display:"flex",alignItems:"center",padding:"0 16px" }}>
                <span style={{ color:match.accent,fontWeight:700,fontSize:13 }}>✦ Poster matched!</span>
              </div>
            </div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>TITLE *</label><input style={INP_STYLE} placeholder="e.g. Naruto, One Piece, Berserk..." value={form.title} onChange={set("title")} /></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>TYPE</label><select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.type} onChange={set("type")}>{["Anime","Manga","Manhwa","Novel"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>STATUS</label><select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.status} onChange={set("status")}>{["Watching","Reading","Completed","On Hold","Dropped"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>GENRE</label><select style={{ ...INP_STYLE,cursor:"pointer" }} value={form.genre} onChange={set("genre")}>{["Action","Adventure","Fantasy","Romance","Horror","Psychological","Isekai","Slice of Life","Sports","Sci-Fi","Mystery","Shonen","Seinen","Shoujo"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>RATING (1-10)</label><input style={INP_STYLE} type="number" min={1} max={10} value={form.rating} onChange={set("rating")} /></div>
            </div>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>POWER LEVEL ⚡</label><input style={INP_STYLE} type="number" min={0} max={9999} value={form.powerLevel} onChange={set("powerLevel")} /><div style={{ height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",marginTop:6 }}><div style={{ height:"100%",width:`${(form.powerLevel/9999)*100}%`,background:"linear-gradient(90deg,#a855f7,#00d4ff)",borderRadius:2,transition:"width 0.3s" }}/></div></div>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>NOTES</label><textarea style={{ ...INP_STYLE,height:60,resize:"vertical" } as any} placeholder="Your thoughts..." value={form.notes} onChange={set("notes")} /></div>
            <button disabled={!form.title.trim()} onClick={()=>{onSubmit({title:form.title.trim(),type:form.type,status:form.status,rating:form.rating,tags:[form.genre],notes:form.notes,powerLevel:form.powerLevel});onClose();}} style={{ padding:"12px",borderRadius:10,border:"none",background:form.title.trim()?"linear-gradient(135deg,#ff2254,#a855f7)":"rgba(255,255,255,0.1)",color:form.title.trim()?"#fff":"#475569",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:form.title.trim()?"pointer":"not-allowed",letterSpacing:1 }}>ADD TO COLLECTION</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── SPACED REVISION (with Stats tab inside) ──────────────────────────────────

function SpacedRevision({ userId, onXP }: { userId:string; onXP:(xp:number)=>void }) {
  const [dueErrors, setDueErrors] = useState<ErrorEntry[]>([]);
  const [schedule, setSchedule] = useState<{date:string;count:number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string|null>(null);
  const [innerTab, setInnerTab] = useState<"review"|"stats">("review");
  const { toasts, add: addToast } = useToast();

  // Stats state
  const [statsErrors, setStatsErrors] = useState<ErrorEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<{week:string;count:number}[]>([]);
  const [heatmap, setHeatmap] = useState<{chapter:string;subject:string;count:number}[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [due, sched] = await Promise.all([getTodayRevisions(userId), getRevisionSchedule(userId)]);
    setDueErrors(due);
    setSchedule(sched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (innerTab === "stats" && statsLoading) {
      Promise.all([getErrors(userId), getWeeklyStats(userId), getChapterHeatmap(userId)])
        .then(([e, w, h]) => { setStatsErrors(e); setWeeklyData(w); setHeatmap(h); setStatsLoading(false); });
    }
  }, [innerTab, userId, statsLoading]);

  const handleAction = async (error: ErrorEntry, action: "mastered"|"reviewed"|"skipped") => {
    if (!error.id || completing) return;
    setCompleting(error.id);
    try {
      const xpEarned = await updateErrorMastery(error.id, action);
      await logRevision(userId, error.id, action, xpEarned);
      if (xpEarned > 0) {
        await awardXP(userId, xpEarned);
        onXP(xpEarned);
      }
      setDueErrors(p => p.filter(e => e.id !== error.id));
      addToast(action==="mastered"?`✅ Mastered! +${xpEarned} XP`:action==="reviewed"?`📖 Reviewed! +${xpEarned} XP`:"⏭ Skipped.", action==="skipped"?"error":"xp");
    } catch(e) { addToast("Something went wrong","error"); }
    setCompleting(null);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingSchedule = schedule.filter(s => s.date > todayStr).slice(0,4);

  // Stats calculations
  const mc = statsErrors.reduce((a:any,e)=>{a[e.mistakeType]=(a[e.mistakeType]||0)+1;return a;},{});
  const sc = statsErrors.reduce((a:any,e)=>{a[e.subject]=(a[e.subject]||0)+1;return a;},{});
  const dc = statsErrors.reduce((a:any,e)=>{a[e.difficulty]=(a[e.difficulty]||0)+1;return a;},{});
  const pieData=Object.entries(mc).map(([k,v])=>({label:k,value:v as number,color:MISTAKE_COLORS[k]||"#888"}));
  const barData=Object.entries(sc).map(([k,v])=>({label:k,value:v as number,color:SUBJECT_COLORS[k]||"#888"}));
  const diffData=Object.entries(dc).map(([k,v])=>({label:k,value:v as number,color:k==="Hard"?"#ff2254":k==="Medium"?"#ffd700":"#22c55e"}));
  const mr=Object.entries(mc).sort((a:any,b:any)=>b[1]-a[1])[0] as [string,number]|undefined;
  const masteredCount=statsErrors.filter(e=>e.masteryStage==="green").length;
  const masteryPct=statsErrors.length>0?Math.round((masteredCount/statsErrors.length)*100):0;

  return (
    <div style={{ paddingBottom:40 }}>
      <ToastContainer toasts={toasts} />

      {/* Inner tab switcher */}
      <div style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(255,255,255,0.03)", padding:5, borderRadius:14, border:"1px solid rgba(255,255,255,0.07)" }}>
        {[
          { id:"review", label:"Review", icon:"🔁", color:"#00d4ff" },
          { id:"stats",  label:"Stats",  icon:"📊", color:"#a855f7" },
        ].map(t => {
          const isActive = innerTab === t.id;
          return (
            <button key={t.id} onClick={() => setInnerTab(t.id as any)} style={{
              flex:1, padding:"10px", borderRadius:10, border:"none",
              background: isActive ? `${t.color}18` : "transparent",
              outline: isActive ? `1px solid ${t.color}44` : "none",
              color: isActive ? t.color : "#475569",
              fontFamily:"inherit", fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              transition:"all 0.2s",
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* REVIEW TAB */}
      {innerTab === "review" && (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20 }}>
            {[
              { label:"Due Today",value:dueErrors.length,icon:"🎯",color:"#ff2254" },
              { label:"Upcoming",value:schedule.filter(s=>s.date>todayStr).reduce((a,b)=>a+b.count,0),icon:"📅",color:"#00d4ff" },
            ].map(s=>(
              <GlassCard key={s.label} style={{ padding:16,textAlign:"center" }}>
                <div style={{ fontSize:24 }}>{s.icon}</div>
                <div style={{ fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{s.value}</div>
                <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>{s.label}</div>
              </GlassCard>
            ))}
            {upcomingSchedule.map(s=>(
              <GlassCard key={s.date} style={{ padding:16,textAlign:"center" }}>
                <div style={{ fontSize:13,color:"#64748b",marginBottom:4 }}>📅 {s.date.slice(5)}</div>
                <div style={{ fontSize:24,fontWeight:800,color:"#ffd700",fontFamily:"'Bebas Neue',cursive" }}>{s.count}</div>
                <div style={{ fontSize:11,color:"#64748b" }}>due</div>
              </GlassCard>
            ))}
          </div>
          {loading ? <div style={{ textAlign:"center",padding:60,color:"#475569" }}>Loading revisions...</div> : (
            dueErrors.length === 0 ? (
              <div style={{ textAlign:"center",padding:60 }}>
                <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
                <div style={{ fontSize:18,fontWeight:700,color:"#22c55e",fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>ALL DONE FOR TODAY!</div>
                <div style={{ fontSize:13,color:"#64748b",marginTop:8 }}>Come back tomorrow to keep your streak alive.</div>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {dueErrors.map(err=>(
                  <GlassCard key={err.id} style={{ padding:20,borderLeft:`3px solid ${MASTERY_COLORS[err.masteryStage??"red"]}` }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap" as const,gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",gap:6,marginBottom:8,flexWrap:"wrap" as const }}>
                            <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44` }}>{err.subject}</span>
                            <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44` }}>{err.mistakeType}</span>
                            <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:"rgba(255,255,255,0.04)",color:"#64748b" }}>{err.difficulty}</span>
                          </div>
                          <div style={{ fontSize:16,fontWeight:700,color:"#e2e8f0",marginBottom:4 }}>{err.chapter}</div>
                          {err.solution&&<div style={{ fontSize:12,color:"#94a3b8",marginBottom:6 }}>{err.solution}</div>}
                          {err.formula&&<div style={{ fontSize:12,color:"#00d4ff",fontFamily:"monospace",padding:"4px 8px",background:"rgba(0,212,255,0.06)",borderRadius:6,display:"inline-block" }}>∫ {err.formula}</div>}
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0 }}>
                          <RevisionBadge nextDate={err.nextReviewDate??""} />
                        </div>
                      </div>
                      <MasteryBar level={err.masteryLevel??0} stage={err.masteryStage??"red"} />
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" as const }}>
                        <button disabled={!!completing} onClick={()=>handleAction(err,"mastered")} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",flex:1 }}>✅ Mastered (+{XP_REWARDS.masterError}xp)</button>
                        <button disabled={!!completing} onClick={()=>handleAction(err,"reviewed")} style={{ padding:"8px 16px",borderRadius:8,border:"1px solid rgba(0,212,255,0.3)",background:"rgba(0,212,255,0.08)",color:"#00d4ff",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",flex:1 }}>📖 Reviewed (+{XP_REWARDS.reviewError}xp)</button>
                        <button disabled={!!completing} onClick={()=>handleAction(err,"skipped")} style={{ padding:"8px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#64748b",fontFamily:"inherit",fontSize:12,cursor:"pointer" }}>⏭ Skip</button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* STATS TAB (inside Review) */}
      {innerTab === "stats" && (
        <div style={{ paddingBottom:20 }}>
          {statsLoading ? <div style={{ textAlign:"center",padding:80,color:"#475569" }}><div style={{ fontSize:40,marginBottom:12 }}>📊</div><div style={{ fontSize:14 }}>Loading stats...</div></div> : (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24 }}>
                {[
                  { label:"Total Errors",value:statsErrors.length,icon:"📝",color:"#00d4ff" },
                  { label:"Mastered",value:masteredCount,icon:"🟢",color:"#22c55e" },
                  { label:"Mastery Rate",value:`${masteryPct}%`,icon:"📊",color:"#a855f7" },
                  { label:"This Week",value:weeklyData.slice(-1)[0]?.count??0,icon:"📅",color:"#ff2254" },
                ].map(s=>(
                  <GlassCard key={s.label} style={{ padding:16,textAlign:"center" }}>
                    <div style={{ fontSize:22 }}>{s.icon}</div>
                    <div style={{ fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{s.value}</div>
                    <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>{s.label}</div>
                  </GlassCard>
                ))}
              </div>
              {mr&&<div style={{ padding:"12px 16px",borderRadius:10,marginBottom:20,background:"rgba(255,34,84,0.1)",border:"1px solid rgba(255,34,84,0.3)",display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:20 }}>⚠️</span>
                <span style={{ fontSize:13,color:"#ff8099" }}>Most repeated mistake type: <strong style={{ color:"#ff2254" }}>{mr[0]}</strong> ({mr[1]} errors)</span>
              </div>}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                <GlassCard style={{ padding:20 }}>
                  <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>MISTAKE TYPE BREAKDOWN</h3>
                  {pieData.length>0?(
                    <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" as const }}>
                      <PieChart data={pieData}/>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {pieData.map(d=>(<div key={d.label} style={{ display:"flex",alignItems:"center",gap:8 }}><div style={{ width:10,height:10,borderRadius:"50%",background:d.color }}/><span style={{ fontSize:12,color:"#94a3b8" }}>{d.label}</span><span style={{ fontSize:12,color:d.color,fontWeight:700 }}>{d.value}</span></div>))}
                      </div>
                    </div>
                  ):<div style={{ color:"#475569",fontSize:13,textAlign:"center",padding:40 }}>No data yet</div>}
                </GlassCard>
                <GlassCard style={{ padding:20 }}>
                  <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>SUBJECT DISTRIBUTION</h3>
                  {barData.length>0?<BarChart data={barData}/>:<div style={{ color:"#475569",fontSize:13,textAlign:"center",padding:40 }}>No data yet</div>}
                  {diffData.length>0&&<><h3 style={{ margin:"20px 0 12px",fontSize:13,color:"#64748b",letterSpacing:1 }}>DIFFICULTY SPLIT</h3><BarChart data={diffData}/></>}
                </GlassCard>
              </div>
              <GlassCard style={{ padding:20,marginBottom:16 }}>
                <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>📈 WEEKLY ERROR TREND</h3>
                <LineChart data={weeklyData}/>
              </GlassCard>
              <GlassCard style={{ padding:20 }}>
                <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>🔥 WEAK CHAPTER HEATMAP</h3>
                {heatmap.length>0?<HeatmapBar chapters={heatmap}/>:<div style={{ color:"#475569",fontSize:13,textAlign:"center",padding:40 }}>No data yet</div>}
              </GlassCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ERROR BOOK ───────────────────────────────────────────────────────────────

function ErrorBook({ userId, onEntryAdded }: { userId:string; onEntryAdded:(n:number)=>void }) {
  const [errors,setErrors]=useState<ErrorEntry[]>([]),[showForm,setShowForm]=useState(false),[fs,setFs]=useState("All"),[fm,setFm]=useState("All"),[search,setSearch]=useState(""),[loading,setLoading]=useState(true);
  const { toasts, add: addToast } = useToast();

  useEffect(()=>{getErrors(userId).then(d=>{setErrors(d);setLoading(false);});},[userId]);

  const handleAdd=async(form:any)=>{
    const {ref,newCount}=await addError(userId,form);
    const newErr:ErrorEntry={id:ref.id,...form,masteryLevel:0,masteryStage:"red",nextReviewDate:new Date(Date.now()+86400000).toISOString().split("T")[0],reviewHistory:[],revisionInterval:1,isArchived:false};
    setErrors(p=>[newErr,...p]);
    onEntryAdded(newCount);
    addToast(`Error logged! +${XP_REWARDS.addError} XP ⚡`,"xp");
    const allErrors=[newErr,...errors];
    const newBadges=await checkAndAwardBadges(userId,allErrors);
    if(newBadges.length>0) addToast(`🏅 New badge: ${BADGES.find(b=>b.id===newBadges[0])?.name}!`,"xp");
  };

  const handleDel=async(id:string)=>{ await deleteError(id); setErrors(p=>p.filter(e=>e.id!==id)); };

  const filtered=errors.filter((e:ErrorEntry)=>{
    if(fs!=="All"&&e.subject!==fs) return false;
    if(fm!=="All"&&e.mistakeType!==fm) return false;
    if(search&&!e.chapter?.toLowerCase().includes(search.toLowerCase())&&!e.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const mc=errors.reduce((a:any,e)=>{a[e.mistakeType]=(a[e.mistakeType]||0)+1;return a;},{});
  const sc=errors.reduce((a:any,e)=>{a[e.subject]=(a[e.subject]||0)+1;return a;},{});
  const mr=Object.entries(mc).sort((a:any,b:any)=>b[1]-a[1])[0] as [string,number]|undefined;
  const pieData=Object.entries(mc).map(([k,v])=>({label:k,value:v as number,color:MISTAKE_COLORS[k]||"#888"}));
  const barData=Object.entries(sc).map(([k,v])=>({label:k,value:v as number,color:SUBJECT_COLORS[k]||"#888"}));
  const tw=errors.filter(e=>(new Date().getTime()-new Date(e.date).getTime())/86400000<=7).length;
  const masteredCount=errors.filter(e=>e.masteryStage==="green").length;

  return (
    <div style={{ paddingBottom:40 }}>
      <ToastContainer toasts={toasts}/>
      {showForm&&<ErrorForm onSubmit={handleAdd} onClose={()=>setShowForm(false)}/>}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20 }}>
        {[
          { label:"Total Errors",value:errors.length,icon:"📝",color:"#00d4ff" },
          { label:"This Week",value:tw,icon:"📅",color:"#ff2254" },
          { label:"Mastered",value:masteredCount,icon:"🟢",color:"#22c55e" },
        ].map(s=>(
          <GlassCard key={s.label} style={{ padding:16,textAlign:"center" }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{s.value}</div>
            <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
      {mr&&<div style={{ padding:"12px 16px",borderRadius:10,marginBottom:16,background:"rgba(255,34,84,0.1)",border:"1px solid rgba(255,34,84,0.3)",display:"flex",alignItems:"center",gap:10 }}>
        <span style={{ fontSize:20 }}>⚠️</span>
        <span style={{ fontSize:13,color:"#ff8099" }}>Most repeated: <strong style={{ color:"#ff2254" }}>{mr[0]}</strong> ({mr[1]} times)</span>
      </div>}
      {pieData.length>0&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
          <GlassCard style={{ padding:20 }}>
            <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>MISTAKE BREAKDOWN</h3>
            <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" as const }}>
              <PieChart data={pieData}/>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{pieData.map(d=><div key={d.label} style={{ display:"flex",alignItems:"center",gap:8 }}><div style={{ width:10,height:10,borderRadius:"50%",background:d.color }}/><span style={{ fontSize:12,color:"#94a3b8" }}>{d.label}</span><span style={{ fontSize:12,color:d.color,fontWeight:700 }}>{d.value}</span></div>)}</div>
            </div>
          </GlassCard>
          <GlassCard style={{ padding:20 }}>
            <h3 style={{ margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1 }}>SUBJECT DISTRIBUTION</h3>
            <BarChart data={barData}/>
          </GlassCard>
        </div>
      )}
      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" as const,alignItems:"center" }}>
        <input style={{ flex:1,minWidth:160,...INP_STYLE }} placeholder="🔍 Search errors..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={()=>setShowForm(true)} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add Error</button>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const }}>
        {["All","Physics","Chemistry","Math","Other"].map(s=><button key={s} style={CHIP(fs===s,"#00d4ff")} onClick={()=>setFs(s)}>{s}</button>)}
        <span style={{ borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px" }}/>
        {["All","Conceptual","Calculation","Silly mistake","Time pressure"].map(m=><button key={m} style={CHIP(fm===m,"#ff2254")} onClick={()=>setFm(m)}>{m}</button>)}
      </div>
      {loading?<div style={{ textAlign:"center",padding:40,color:"#475569" }}>Loading...</div>:(
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {filtered.length===0&&<div style={{ textAlign:"center",padding:40,color:"#475569" }}>No errors found. Clean slate! 🎯</div>}
          {filtered.map((err:ErrorEntry)=>(
            <GlassCard key={err.id} style={{ padding:16,borderLeft:`3px solid ${MASTERY_COLORS[err.masteryStage??"red"]}` }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap" as const }}>
                <div style={{ flex:1,minWidth:200 }}>
                  <div style={{ display:"flex",gap:8,marginBottom:8,flexWrap:"wrap" as const }}>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44` }}>{err.subject}</span>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44` }}>{err.mistakeType}</span>
                    <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.04)",color:"#64748b" }}>{err.difficulty}</span>
                  </div>
                  <div style={{ fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:4 }}>{err.chapter}</div>
                  <div style={{ fontSize:12,color:"#94a3b8",marginBottom:6 }}>{err.solution}</div>
                  {err.formula&&<div style={{ fontSize:11,color:"#00d4ff",fontFamily:"monospace",marginBottom:6 }}>∫ {err.formula}</div>}
                  {err.lesson&&<div style={{ fontSize:12,color:"#ffd700",borderLeft:"2px solid #ffd70044",paddingLeft:8,marginBottom:8 }}>💡 {err.lesson}</div>}
                  <div style={{ maxWidth:200 }}>
                    <MasteryBar level={err.masteryLevel??0} stage={err.masteryStage??"red"}/>
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0 }}>
                  <div style={{ fontSize:11,color:"#475569" }}>{err.date}</div>
                  {err.nextReviewDate&&<RevisionBadge nextDate={err.nextReviewDate}/>}
                  <button onClick={()=>handleDel(err.id!)} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.08)",color:"#ff2254",fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>🗑 Delete</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANIME COLLECTION ─────────────────────────────────────────────────────────

function SlidingPoster({ posters, color, accent }: { posters:string[];color:string;accent:string }) {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ if(posters.length<=1) return; const t=setInterval(()=>setIdx(i=>(i+1)%posters.length),3000); return()=>clearInterval(t); },[posters.length]);
  return (
    <div style={{ position:"relative",height:150,overflow:"hidden",borderRadius:"16px 16px 0 0" }}>
      {posters.map((src,i)=>(
        <img key={src} src={src} alt="" crossOrigin="anonymous"
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",opacity:i===idx?1:0,transition:"opacity 0.8s ease" }}
          onError={e=>{(e.target as HTMLImageElement).style.opacity="0";}} />
      ))}
      <div style={{ position:"absolute",inset:0,background:`linear-gradient(to bottom,${color}33 0%,rgba(10,14,26,0.92) 100%)` }} />
      {posters.length>1&&(
        <div style={{ position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:2 }}>
          {posters.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?16:6,height:6,borderRadius:3,background:i===idx?accent:"rgba(255,255,255,0.35)",cursor:"pointer",transition:"all 0.3s" }} />)}
        </div>
      )}
    </div>
  );
}

function AnimeCollection({ userId, onEntryAdded }: { userId:string; onEntryAdded:(n:number)=>void }) {
  const [col,setCol]=useState<any[]>([]),[showForm,setShowForm]=useState(false),[ft,setFt]=useState("All"),[fst,setFst]=useState("All"),[loading,setLoading]=useState(true);
  useEffect(()=>{getCollection(userId).then(d=>{setCol(d);setLoading(false);});},[userId]);
  const handleAdd=async(entry:any)=>{ const {ref,newCount}=await addCollectionEntry(userId,entry); setCol(p=>[{id:ref.id,...entry},...p]); onEntryAdded(newCount); };
  const handleDel=async(id:string)=>{ await deleteCollectionEntry(id); setCol(p=>p.filter(e=>e.id!==id)); };
  const filtered=col.filter(a=>{ if(ft!=="All"&&a.type!==ft) return false; if(fst!=="All"&&a.status!==fst) return false; return true; });
  return (
    <div style={{ paddingBottom:40 }}>
      {showForm&&<CollectionForm onSubmit={handleAdd} onClose={()=>setShowForm(false)}/>}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20 }}>
        {[{label:"Total",value:col.length,icon:"📚",color:"#a855f7"},{label:"Anime",value:col.filter(a=>a.type==="Anime").length,icon:"📺",color:"#00d4ff"},{label:"Manga/Other",value:col.filter(a=>a.type!=="Anime").length,icon:"📖",color:"#ff2254"},{label:"Completed",value:col.filter(a=>a.status==="Completed").length,icon:"✅",color:"#22c55e"}].map(s=>(
          <GlassCard key={s.label} style={{ padding:16,textAlign:"center" }}><div style={{ fontSize:22 }}>{s.icon}</div><div style={{ fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{s.value}</div><div style={{ fontSize:11,color:"#64748b" }}>{s.label}</div></GlassCard>
        ))}
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const,alignItems:"center" }}>
        {["All","Anime","Manga","Manhwa","Novel"].map(t=><button key={t} style={CHIP(ft===t,"#00d4ff")} onClick={()=>setFt(t)}>{t}</button>)}
        <span style={{ borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px" }}/>
        {["All","Watching","Reading","Completed","On Hold","Dropped"].map(s=><button key={s} style={CHIP(fst===s,"#ff2254")} onClick={()=>setFst(s)}>{s}</button>)}
        <button onClick={()=>setShowForm(true)} style={{ marginLeft:"auto",padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#ff2254,#a855f7)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add Entry</button>
      </div>
      {loading?<div style={{ textAlign:"center",padding:40,color:"#475569" }}>Loading...</div>:(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16 }}>
          {filtered.length===0&&<div style={{ textAlign:"center",padding:40,color:"#475569",gridColumn:"1/-1" }}>No entries yet! Click "+ Add Entry" 🎌</div>}
          {filtered.map((item,idx)=>{
            const match=findAnimePoster(item.title||"");
            const fb=DEFAULT_THEMES[idx%DEFAULT_THEMES.length];
            const accent=match?match.accent:fb.accent;
            const rating=item.rating??8, powerLevel=item.powerLevel??5000;
            const tags=item.tags||[item.genre].filter(Boolean)||["Action"];
            const status=item.status||"Watching";
            const sc=STATUS_COLORS[status]||"#94a3b8";
            return (
              <GlassCard key={item.id} style={{ padding:0,overflow:"hidden",border:"none" }}>
                <div style={{ position:"relative" as const }}>
                  {match?<SlidingPoster posters={match.posters} color={match.color} accent={match.accent}/>:(
                    <div style={{ height:150,background:fb.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative" as const,overflow:"hidden",borderRadius:"16px 16px 0 0" }}>
                      <div style={{ position:"absolute",inset:0,background:"repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.02) 10px,rgba(255,255,255,0.02) 11px)" }}/>
                      <span style={{ fontSize:52,filter:`drop-shadow(0 0 20px ${accent})`,position:"relative",zIndex:1 }}>{fb.emoji}</span>
                    </div>
                  )}
                  <span style={{ position:"absolute",top:10,right:10,padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:`${sc}33`,color:sc,border:`1px solid ${sc}55`,backdropFilter:"blur(4px)" }}>{status}</span>
                  <span style={{ position:"absolute",bottom:10,left:10,padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:"rgba(0,0,0,0.65)",color:"#94a3b8",backdropFilter:"blur(4px)" }}>{item.type||"Anime"}</span>
                </div>
                <div style={{ padding:16,background:"rgba(10,14,26,0.97)" }}>
                  <div style={{ fontSize:16,fontWeight:700,color:"#e2e8f0",marginBottom:6 }}>{item.title}</div>
                  <div style={{ display:"flex",gap:4,flexWrap:"wrap" as const,marginBottom:10 }}>{tags.map((tag:string)=><span key={tag} style={{ padding:"2px 8px",borderRadius:12,fontSize:10,background:`${accent}18`,color:accent,border:`1px solid ${accent}33` }}>{tag}</span>)}</div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <div style={{ display:"flex",gap:2 }}>{Array.from({length:10},(_,i)=><span key={i} style={{ fontSize:11,color:i<rating?"#ffd700":"#334155" }}>★</span>)}</div>
                    <span style={{ fontSize:12,fontWeight:700,color:"#ffd700" }}>{rating}/10</span>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:10,color:"#64748b" }}>⚡ POWER LEVEL</span><span style={{ fontSize:11,fontWeight:700,color:accent }}>{powerLevel.toLocaleString()}</span></div>
                    <div style={{ height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${(powerLevel/9999)*100}%`,background:`linear-gradient(90deg,${accent},#ff6b35)`,borderRadius:3,transition:"width 0.5s" }}/></div>
                  </div>
                  {item.notes&&<div style={{ fontSize:11,color:"#64748b",borderLeft:`2px solid ${accent}44`,paddingLeft:8,marginBottom:10,fontStyle:"italic" }}>{item.notes}</div>}
                  <button onClick={()=>handleDel(item.id)} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.08)",color:"#ff2254",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>🗑 Remove</button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD (with avatars) ───────────────────────────────────────────────

function Leaderboard({ currentUserId }: { currentUserId: string }) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState("enhancer");

  useEffect(() => {
    getLeaderboard().then(async data => {
      setLeaders(data);
      const pm: Record<string, any> = {};
      await Promise.all(data.map(async (l: any) => {
        try { const snap = await getDoc(doc(db, "userProfiles", l.userId ?? l.id)); if (snap.exists()) pm[l.userId ?? l.id] = snap.data(); } catch {}
      }));
      setProfiles(pm); setLoading(false);
    });
  }, []);

  const MEDALS = ["🥇", "🥈", "🥉"], RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];
  const leagueLeaders = leaders.filter(l => getNenLeague(l.totalXP ?? 0).id === activeLeague);
  const myEntry = leaders.find(l => (l.userId ?? l.id) === currentUserId);
  const myNen = myEntry ? getNenLeague(myEntry.totalXP ?? 0) : NEN_LEAGUES[0];
  const myRank = leagueLeaders.findIndex(l => (l.userId ?? l.id) === currentUserId) + 1;
  const nextNen = NEN_LEAGUES[NEN_LEAGUES.findIndex(l => l.id === myNen.id) + 1];
  const activeLg = NEN_LEAGUES.find(l => l.id === activeLeague) ?? NEN_LEAGUES[0];

  return (
    <div style={{ paddingBottom: 40 }}>
      {myEntry && (
        <div style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 20, background: `${myNen.color}12`, border: `1px solid ${myNen.color}30`, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 36 }}>{myNen.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: myNen.color, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}>YOU ARE {myNen.name.toUpperCase()} TYPE</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>"{myNen.quote}"</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>— {myNen.character}</div>
          </div>
          {nextNen && <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 10, color: "#64748b" }}>next:</div><div style={{ fontSize: 18 }}>{nextNen.icon}</div><div style={{ fontSize: 10, color: nextNen.color, fontWeight: 700 }}>{nextNen.name}</div></div>}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>⚡ SELECT NEN LEAGUE DIVISION</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
          {NEN_LEAGUES.map(league => {
            const count = leaders.filter(l => getNenLeague(l.totalXP ?? 0).id === league.id).length;
            const isActive = activeLeague === league.id;
            return (
              <button key={league.id} onClick={() => setActiveLeague(league.id)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 12, border: `1px solid ${isActive ? league.color : "rgba(255,255,255,0.08)"}`, background: isActive ? `${league.color}18` : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 72 }}>
                <span style={{ fontSize: 20 }}>{league.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? league.color : "#475569" }}>{league.name}</span>
                <span style={{ fontSize: 9, color: "#334155" }}>{count} warriors</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px", borderRadius: 14, marginBottom: 16, background: `linear-gradient(135deg,${activeLg.color}15,transparent)`, border: `1px solid ${activeLg.color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>{activeLg.icon}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: activeLg.color, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}>{activeLg.name.toUpperCase()} LEAGUE</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{activeLg.desc}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 700 }}>⬆ Top 3 promote next week</span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(255,34,84,0.15)", color: "#ff2254", fontWeight: 700 }}>⬇ Bottom 3 demote</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[{ icon: "👥", label: "In League", value: leagueLeaders.length, color: "#00d4ff" }, { icon: "🏅", label: "My Rank", value: myRank > 0 ? `#${myRank}` : "—", color: "#a855f7" }, { icon: "⬆", label: "Promote at", value: "Top 3", color: "#22c55e" }].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Loading warriors...</div>
      ) : leagueLeaders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{activeLg.icon}</div>
          <div style={{ fontSize: 16, color: "#64748b" }}>No {activeLg.name} warriors yet!</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>Earn {activeLg.minXP}+ XP to join this league.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>⬆ PROMOTION ZONE (Top 3)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leagueLeaders.map((l: any, i: number) => {
              const uid = l.userId ?? l.id;
              const profile = profiles[uid];
              const name = profile?.displayName || l.displayName || "Warrior";
              const isMe = uid === currentUserId;
              const isMedal = i < 3;
              const isDemotion = i >= leagueLeaders.length - 3 && leagueLeaders.length > 5;
              // Avatar: get from profile
              const avatarKey = profile?.avatar || "av_luffy";
              const photoURL = profile?.photoURL || null;

              return (
                <div key={uid} style={{ padding: "14px 16px", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, background: isMe ? "rgba(123,97,255,0.12)" : isMedal ? `${RANK_COLORS[i]}08` : "rgba(255,255,255,0.03)", border: isMe ? "1px solid rgba(123,97,255,0.35)" : isMedal ? `1px solid ${RANK_COLORS[i]}30` : "1px solid rgba(255,255,255,0.06)", position: "relative" as const }}>

                  {/* Rank */}
                  <div style={{ fontSize: isMedal ? 26 : 14, minWidth: 36, textAlign: "center", color: isMedal ? RANK_COLORS[i] : "#475569", fontWeight: 800, fontFamily: "'Bebas Neue',cursive", flexShrink: 0 }}>
                    {isMedal ? MEDALS[i] : `#${i + 1}`}
                  </div>

                  {/* Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    <AvatarDisplay avatar={avatarKey} photoURL={photoURL} displayName={name} size={40} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isMe ? "#a78bfa" : "#e2e8f0" }}>{name}{isMe ? " (You)" : ""}</span>
                      {isMedal && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: `${RANK_COLORS[i]}22`, color: RANK_COLORS[i], fontWeight: 700 }}>TOP {i + 1}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>📝 {l.totalErrors ?? 0} errors</span>
                      <span style={{ fontSize: 11, color: "#ffd700" }}>🔥 {l.streak ?? 0}d</span>
                      <span style={{ fontSize: 11, color: l.repeatedMistakes === 0 ? "#22c55e" : "#ff2254" }}>♻ {l.repeatedMistakes ?? 0} repeats</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: l.repeatedMistakes === 0 ? "#22c55e" : "#ff2254", fontFamily: "'Bebas Neue',cursive" }}>{l.repeatedMistakes ?? 0}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>REPEATS</div>
                  </div>
                  {isDemotion && <div style={{ position: "absolute", right: 10, bottom: 2, fontSize: 9, color: "#ff2254", fontWeight: 700 }}>⬇ DEMOTION</div>}
                </div>
              );
            })}
          </div>
          {leagueLeaders.length > 5 && <div style={{ fontSize: 11, color: "#ff2254", fontWeight: 700, letterSpacing: 1, marginTop: 8 }}>⬇ DEMOTION ZONE (Bottom 3)</div>}
        </>
      )}
    </div>
  );
}

// ─── AI TAB LOADER ─────────────────────────────────────────────────────────────

function AITabLoader({ userId }: { userId: string }) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getErrors(userId), getCollection(userId)]).then(([e, c]) => {
      setErrors(e); setCollection(c); setLoading(false);
    });
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:"#475569" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
      <div style={{ fontSize:14 }}>Loading AI features...</div>
    </div>
  );

  return <AIHub userId={userId} errors={errors} collection={collection} />;
}

// ─── HEAT CALENDAR TAB LOADER ─────────────────────────────────────────────────

function HeatCalendarLoader({ userId }: { userId: string }) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getErrors(userId).then(e => { setErrors(e); setLoading(false); });
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:"#475569" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🔥</div>
      <div style={{ fontSize:14 }}>Loading heat map...</div>
    </div>
  );

  return <HeatCalendar errors={errors} />;
}

// ─── NAVIGATION CONFIG ────────────────────────────────────────────────────────
// Changes: Heat moved to PRIMARY_TABS icon collection, Watch moved to SECONDARY_TABS

const PRIMARY_TABS = [
  { id:"errors",      label:"Learn",      icon:"📝", color:"#ff2254", glow:"rgba(255,34,84,0.5)" },
  { id:"revision",    label:"Review",     icon:"🔁", color:"#00d4ff", glow:"rgba(0,212,255,0.5)" },
  { id:"leaderboard", label:"Rank",       icon:"🏆", color:"#ffd700", glow:"rgba(255,215,0,0.5)" },
  { id:"heatmap",     label:"Heat",       icon:"🔥", color:"#f97316", glow:"rgba(249,115,22,0.5)" },
  { id:"achievements",label:"Badges",     icon:"🏅", color:"#22c55e", glow:"rgba(34,197,94,0.5)" },
];

const SECONDARY_TABS = [
  { id:"collection",  label:"Watch",  icon:"🎌", color:"#a855f7", glow:"rgba(168,85,247,0.5)" },
  { id:"ai",          label:"AI Hub", icon:"🤖", color:"#a855f7", glow:"rgba(168,85,247,0.5)" },
];

function BottomNav({ active, setActive }: { active:string; setActive:(t:string)=>void }) {
  const [showMore, setShowMore] = useState(false);
  const allTabs = [...PRIMARY_TABS, ...SECONDARY_TABS];
  const activeTab = allTabs.find(t => t.id === active);
  const isSecondaryActive = SECONDARY_TABS.some(t => t.id === active);

  return (
    <>
      {showMore && (
        <div style={{ position:"fixed", inset:0, zIndex:99 }} onClick={() => setShowMore(false)} />
      )}

      {showMore && (
        <div style={{
          position:"fixed", bottom:68, left:0, right:0, zIndex:100,
          display:"flex", justifyContent:"center", padding:"0 16px",
          pointerEvents:"none",
        }}>
          <div style={{
            display:"flex", gap:10, padding:"14px 20px",
            background:"rgba(4,6,14,0.98)", backdropFilter:"blur(24px)",
            border:"1px solid rgba(255,255,255,0.1)", borderRadius:20,
            boxShadow:"0 -4px 40px rgba(0,0,0,0.6)",
            pointerEvents:"all",
          }}>
            {SECONDARY_TABS.map(t => {
              const isActive = active === t.id;
              return (
                <button key={t.id} onClick={() => { setActive(t.id); setShowMore(false); }} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                  padding:"10px 18px", borderRadius:14, border:"none",
                  background: isActive ? `${t.color}18` : "rgba(255,255,255,0.04)",
                  outline: isActive ? `1px solid ${t.color}44` : "1px solid rgba(255,255,255,0.06)",
                  cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                }}>
                  <span style={{ fontSize:26, lineHeight:1, filter: isActive ? `drop-shadow(0 0 10px ${t.color})` : "none", transition:"filter 0.2s" }}>{t.icon}</span>
                  <span style={{ fontSize:10, fontWeight: isActive ? 800 : 500, color: isActive ? t.color : "#64748b", letterSpacing:0.3 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:101,
        height:64,
        background:"rgba(3,5,12,0.98)", backdropFilter:"blur(28px)",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        display:"flex", alignItems:"stretch",
        paddingBottom:"env(safe-area-inset-bottom,0px)",
      }}>
        {PRIMARY_TABS.map(t => {
          const isActive = active === t.id;
          return (
            <button key={t.id} onClick={() => { setActive(t.id); setShowMore(false); }} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:3,
              border:"none", background:"transparent",
              cursor:"pointer", fontFamily:"inherit",
              position:"relative", padding:"6px 2px 8px",
              transition:"all 0.15s",
            }}>
              <div style={{
                position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                width: isActive ? 32 : 0,
                height:2, borderRadius:"0 0 3px 3px",
                background:t.color,
                boxShadow: isActive ? `0 2px 12px ${t.glow}` : "none",
                transition:"width 0.25s ease, box-shadow 0.25s ease",
              }} />
              <span style={{
                fontSize: isActive ? 24 : 21, lineHeight:1,
                filter: isActive ? `drop-shadow(0 0 10px ${t.glow})` : "none",
                transition:"all 0.2s",
                transform: isActive ? "translateY(-1px)" : "none",
              }}>{t.icon}</span>
              <span style={{
                fontSize:9.5, fontWeight: isActive ? 800 : 400,
                color: isActive ? t.color : "#3d4d63",
                letterSpacing:0.2, transition:"all 0.15s",
              }}>{t.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button onClick={() => setShowMore(s => !s)} style={{
          flex:1, display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:3,
          border:"none", background:"transparent",
          cursor:"pointer", fontFamily:"inherit",
          position:"relative", padding:"6px 2px 8px",
          transition:"all 0.15s",
        }}>
          <div style={{
            position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
            width: isSecondaryActive ? 32 : 0,
            height:2, borderRadius:"0 0 3px 3px",
            background: activeTab?.color ?? "#64748b",
            boxShadow: isSecondaryActive ? `0 2px 12px ${(activeTab as any)?.glow ?? "#64748b44"}` : "none",
            transition:"width 0.25s ease",
          }} />

          {isSecondaryActive ? (
            <>
              <span style={{ fontSize:24, lineHeight:1, filter: `drop-shadow(0 0 10px ${(activeTab as any)?.glow ?? "#64748b"})`, transform:"translateY(-1px)" }}>{activeTab?.icon}</span>
              <span style={{ fontSize:9.5, fontWeight:800, color: activeTab?.color ?? "#64748b", letterSpacing:0.2 }}>{activeTab?.label}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize:20, lineHeight:1, color: showMore ? "#94a3b8" : "#3d4d63", transform: showMore ? "rotate(45deg)" : "none", transition:"all 0.25s ease", display:"block" }}>⊕</span>
              <span style={{ fontSize:9.5, fontWeight:400, color: showMore ? "#94a3b8" : "#3d4d63", letterSpacing:0.2, transition:"color 0.15s" }}>More</span>
            </>
          )}
        </button>
      </nav>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user,setUser]=useState<any>(null),[authLoading,setAuthLoading]=useState(true);
  const [activeTab,setActiveTab]=useState("errors"),[quoteIdx,setQuoteIdx]=useState(0);
  const [streak,setStreak]=useState(0),[todayCount,setTodayCount]=useState(0);
  const [showCal,setShowCal]=useState(false);
  const [xpData,setXpData]=useState<UserXP|null>(null);
  const [xpPopup,setXpPopup]=useState<number|null>(null);
  const { toasts, add: addToast } = useToast();

  const [showProfile, setShowProfile] = useState(false);
  const [showXPPanel, setShowXPPanel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userAvatar, setUserAvatar] = useState("av_luffy");
  const [userPhoto, setUserPhoto] = useState<string|null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const syncLeaderboard = useCallback(async (uid: string, name: string, stk: number) => {
    try {
      const errors = await getErrors(uid);
      const mc: Record<string,number> = {};
      errors.forEach((e:any) => { mc[e.mistakeType]=(mc[e.mistakeType]||0)+1; });
      const repeated = Object.values(mc).filter(v=>v>1).reduce((a,b)=>a+b,0);
      await updateLeaderboard(uid, name, errors.length, repeated, stk);
    } catch(e) { console.error("syncLeaderboard:", e); }
  }, []);

  const handleUpdateProfile = useCallback(async (data: any) => {
    if (data.displayName) setDisplayName(data.displayName);
    if (data.avatar) setUserAvatar(data.avatar);
    if (data.photoURL !== undefined) setUserPhoto(data.photoURL ?? null);
    if (user) {
      await syncLeaderboard(user.uid, data.displayName || displayName, streak);
    }
  }, [user, displayName, streak, syncLeaderboard]);

  const loadStats = useCallback(async (uid: string, name: string, isNew?: boolean) => {
    const [s, t, xp] = await Promise.all([getStreak(uid), getTodayEntryCount(uid), getUserXP(uid)]);
    setStreak(s); setTodayCount(t); setXpData(xp);
    const profile = await loadUserProfile(uid);
    if (profile) {
      const resolvedName = profile.displayName || name;
      if (profile.displayName) setDisplayName(profile.displayName);
      if (profile.avatar) setUserAvatar(profile.avatar);
      if (profile.photoURL !== undefined) setUserPhoto(profile.photoURL ?? null);
      await syncLeaderboard(uid, resolvedName, s);
    } else {
      await syncLeaderboard(uid, name, s);
    }
    // Show welcome for brand new users (no XP data yet)
    if (isNew || (!xp && !profile)) {
      setShowWelcome(true);
    }
  }, [syncLeaderboard]);

  const handleEntryAdded = useCallback(async (newCount: number) => {
    setTodayCount(newCount);
    if (newCount >= 3 && user) {
      const s = await getStreak(user.uid);
      setStreak(s);
    }
    if (user) {
      const xp = await getUserXP(user.uid);
      setXpData(xp);
    }
  }, [user]);

  const handleXPGained = useCallback((xp: number) => {
    setXpPopup(xp);
    setXpData(prev => prev ? ({...prev, totalXP:(prev.totalXP||0)+xp}) : prev);
  }, []);

  useEffect(() => {
    const unsub = onAuth(async u => {
      setUser(u); setAuthLoading(false);
      if (u) {
        const name = u.displayName || u.email?.split("@")[0] || "Warrior";
        setDisplayName(name);
        // Detect new users: check if metadata shows account was just created
        const isNew = u.metadata?.creationTime === u.metadata?.lastSignInTime;
        loadStats(u.uid, name, isNew);
      }
    });
    return () => unsub();
  }, [loadStats]);

  useEffect(() => {
    const i = setInterval(() => setQuoteIdx(q=>(q+1)%QUOTES.length), 5000);
    return () => clearInterval(i);
  }, []);

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#050810", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:48, animation:"pulse 1s infinite" }}>⚡</div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight:"100vh", background:"#050810", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:#334155}
        select option{background:#0d1117}
      `}</style>
      <Particles/>
      <div style={{ position:"relative", zIndex:1 }}>
        <AuthScreen onLogin={u => { setUser(u); const name = u.displayName||u.email?.split("@")[0]||"Warrior"; setDisplayName(name); loadStats(u.uid, name, true); }} />
      </div>
    </div>
  );

  const PAGE_TITLES: Record<string,{title:string;sub:string;color:string}> = {
    errors:       { title:"DAILY ERROR BOOK",  sub:"errors",       color:"#ff2254" },
    revision:     { title:"REVIEW & STATS",    sub:"revision",     color:"#00d4ff" },
    achievements: { title:"ACHIEVEMENTS",      sub:"achievements", color:"#ffd700" },
    collection:   { title:"ANIME COLLECTION",  sub:"collection",   color:"#a855f7" },
    leaderboard:  { title:"LEADERBOARD",       sub:"leaderboard",  color:"#ffd700" },
    ai:           { title:"AI COMMAND",        sub:"ai",           color:"#a855f7" },
    heatmap:      { title:"MISTAKE HEAT MAP",  sub:"heatmap",      color:"#22c55e" },
  };

  const pt = PAGE_TITLES[activeTab] ?? PAGE_TITLES["errors"];

  return (
    <div style={{ minHeight:"100vh", background:"#050810", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050810}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        input::placeholder,textarea::placeholder{color:#334155}
        select option{background:#0d1117}
        @keyframes slideInToast{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes popIn{from{transform:translateX(-50%) scale(0.5);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      <Particles/>
      <ToastContainer toasts={toasts}/>
      {xpPopup && <XPPopup xp={xpPopup} onDone={()=>setXpPopup(null)}/>}
      {showCal && <StreakCalendar userId={user.uid} streak={streak} onClose={()=>setShowCal(false)}/>}
      {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}
      {showWelcome && <WelcomePage onDone={() => setShowWelcome(false)} />}

      {showProfile && (
        <ProfilePanel
          user={{ ...user, displayName }}
          xpData={xpData}
          streak={streak}
          todayCount={todayCount}
          onClose={() => setShowProfile(false)}
          onLogout={() => { setShowProfile(false); logOut(); }}
          onUpdateProfile={handleUpdateProfile}
          LEVELS={LEVELS}
          BADGES={BADGES}
          XP_REWARDS={XP_REWARDS}
        />
      )}

      {showXPPanel && xpData && (
        <XPTapPanel
          xpData={xpData}
          streak={streak}
          onClose={() => setShowXPPanel(false)}
          LEVELS={LEVELS}
          BADGES={BADGES}
        />
      )}

      {/* Main content */}
      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"0 16px", paddingBottom:80 }}>

        {/* COMPACT TOP HEADER */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", marginBottom:16, gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* ℹ️ Info icon — replaces /3 */}
            <button
              onClick={() => setShowInfo(true)}
              title="How to use ErrorVerse"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.3)",
                color: "#fff",
                fontSize: 16, fontWeight: 900,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "serif",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >ℹ</button>
            <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:24, letterSpacing:4, background:"linear-gradient(135deg,#00d4ff,#ff2254)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ERRORVERSE</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Streak pill */}
            <button onClick={()=>setShowCal(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:20, background:streak>0?"rgba(255,215,0,0.12)":"rgba(255,255,255,0.05)", border:`1px solid ${streak>0?"rgba(255,215,0,0.35)":"rgba(255,255,255,0.08)"}`, cursor:"pointer", fontFamily:"inherit" }}>
              <span style={{ fontSize:13 }}>🔥</span>
              <span style={{ fontSize:12, color:streak>0?"#ffd700":"#475569", fontWeight:700 }}>{streak}d</span>
            </button>

            {/* Daily progress pill */}
            <div style={{ padding:"5px 10px", borderRadius:12, background:todayCount>=3?"rgba(34,197,94,0.12)":"rgba(0,212,255,0.08)", border:`1px solid ${todayCount>=3?"rgba(34,197,94,0.3)":"rgba(0,212,255,0.2)"}`, fontSize:11, color:todayCount>=3?"#22c55e":"#00d4ff", fontWeight:700 }}>{todayCount}/3 ✓</div>

            {/* XP pill */}
            {xpData && (
              <button onClick={() => setShowXPPanel(true)} style={{ padding:"5px 10px", borderRadius:12, background:"rgba(123,97,255,0.12)", border:"1px solid rgba(123,97,255,0.3)", fontSize:11, color:"#a78bfa", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                ⚡ {xpData.totalXP} · Lv{xpData.level}
              </button>
            )}

            {/* Avatar / profile button */}
            <button onClick={() => setShowProfile(true)} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"3px 10px 3px 3px", cursor:"pointer" }}>
              <AvatarDisplay avatar={userAvatar} photoURL={userPhoto} displayName={displayName} size={28} />
              <span style={{ fontSize:12, color:"#94a3b8", fontWeight:600, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                {displayName.split(" ")[0] || "You"}
              </span>
            </button>
          </div>
        </header>

        {/* Scrolling quote — bold white, clearly readable */}
        <div style={{ marginBottom:14, overflow:"hidden", minHeight:22 }}>
          <span style={{
            fontSize:13,
            color:"#ffffff",
            fontWeight:700,
            fontStyle:"italic",
            letterSpacing:0.3,
            textShadow:"0 0 20px rgba(0,212,255,0.3)",
          }}>"{QUOTES[quoteIdx]}"</span>
        </div>

        {/* Page banners */}
        {activeTab==="achievements" && xpData && <LevelBanner xpData={xpData}/>}
        {(activeTab==="errors" || activeTab==="collection") && <StreakBanner todayCount={todayCount} streak={streak}/>}

        {/* Page title */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:28, fontFamily:"'Bebas Neue',cursive", letterSpacing:3, color:"#e2e8f0", margin:0 }}>
            {pt.title.split(" ").map((w,i,arr)=>
              i===arr.length-1
                ? <span key={i} style={{ color:pt.color }}> {w}</span>
                : <span key={i}>{w} </span>
            )}
          </h1>
        </div>

        {/* Tab content */}
        {activeTab==="errors"       && <ErrorBook userId={user.uid} onEntryAdded={handleEntryAdded}/>}
        {activeTab==="revision"     && <SpacedRevision userId={user.uid} onXP={handleXPGained}/>}
        {activeTab==="achievements" && <BadgesPanel earned={xpData?.badges??[]}/>}
        {activeTab==="collection"   && <AnimeCollection userId={user.uid} onEntryAdded={handleEntryAdded}/>}
        {activeTab==="leaderboard"  && <Leaderboard currentUserId={user.uid}/>}
        {activeTab==="ai"           && <AITabLoader userId={user.uid}/>}
        {activeTab==="heatmap"      && <HeatCalendarLoader userId={user.uid}/>}
      </div>

      {/* Bottom nav */}
      <BottomNav active={activeTab} setActive={setActiveTab} />
    </div>
  );
}