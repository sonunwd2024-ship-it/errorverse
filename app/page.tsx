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
  { id:"enhancer",    name:"Enhancer",    icon:"💪", color:"#f97316", minXP:0,     desc:"You boost your own power! Every mistake you log makes you stronger.",    character:"Gon Freecss",    quote:"The basics are everything." },
  { id:"transmuter",  name:"Transmuter",  icon:"⚡", color:"#fbbf24", minXP:2000,  desc:"You change and adapt! Learning to transform your weak points.",           character:"Killua Zoldyck", quote:"I can change anything into power." },
  { id:"emitter",     name:"Emitter",     icon:"🔥", color:"#ef4444", minXP:5000,  desc:"You project your power outward! Your knowledge is spreading further.",    character:"Leorio",         quote:"My power reaches beyond myself." },
  { id:"conjurer",    name:"Conjurer",    icon:"🔮", color:"#a78bfa", minXP:10000, desc:"You create real things from nothing! Your mastery is becoming solid.",    character:"Kurapika",       quote:"I manifest what others cannot imagine." },
  { id:"manipulator", name:"Manipulator", icon:"🎮", color:"#38bdf8", minXP:20000, desc:"You control the battlefield! You understand your mistakes deeply.",       character:"Illumi Zoldyck", quote:"I control outcomes, not just react to them." },
  { id:"specialist",  name:"Specialist",  icon:"♾️", color:"#00d4ff", minXP:40000, desc:"You are UNIQUE! Beyond all categories — a true master of your craft.",   character:"Ging Freecss",   quote:"I have transcended the system itself." },
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

function BadgeDetailModal({ badge, earned, onClose }: { badge: any; earned: boolean; onClose: () => void }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div style={{ maxWidth:380,width:"100%",background:"rgba(10,14,26,0.97)",border:`2px solid ${earned?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:24,padding:32,textAlign:"center",backdropFilter:"blur(24px)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:80,marginBottom:16,filter:earned?"drop-shadow(0 0 30px rgba(255,215,0,0.6))":"grayscale(1) opacity(0.4)" }}>{badge.icon}</div>
        <div style={{ fontSize:22,fontWeight:900,color:earned?"#ffd700":"#64748b",marginBottom:8,fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{badge.name}</div>
        <div style={{ fontSize:14,color:"#94a3b8",lineHeight:1.6,marginBottom:16 }}>{badge.desc}</div>
        {earned ? (
          <div style={{ padding:"10px 20px",borderRadius:12,background:"rgba(255,215,0,0.12)",border:"1px solid rgba(255,215,0,0.3)",color:"#ffd700",fontWeight:700,fontSize:14 }}>✅ BADGE EARNED!</div>
        ) : (
          <div style={{ padding:"10px 20px",borderRadius:12,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#475569",fontSize:13 }}>🔒 Keep grinding to unlock this badge</div>
        )}
        <button onClick={onClose} style={{ marginTop:16,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Close</button>
      </div>
    </div>
  );
}

function BadgesPanel({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned);
  const [selected, setSelected] = useState<any>(null);
  const earnedBadges = BADGES.filter(b => earnedSet.has(b.id));
  const lockedBadges = BADGES.filter(b => !earnedSet.has(b.id));
  return (
    <div>
      {selected && <BadgeDetailModal badge={selected} earned={earnedSet.has(selected.id)} onClose={() => setSelected(null)} />}
      {earnedBadges.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,color:"#ffd700",fontWeight:700,letterSpacing:1,marginBottom:12 }}>🏅 EARNED ({earnedBadges.length})</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
            {earnedBadges.map(b => (
              <div key={b.id} onClick={() => setSelected(b)} style={{ padding:16,borderRadius:16,textAlign:"center",background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.25)",cursor:"pointer",transition:"all 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.05)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
                <div style={{ fontSize:36,marginBottom:8,filter:"drop-shadow(0 0 12px rgba(255,215,0,0.5))" }}>{b.icon}</div>
                <div style={{ fontSize:12,fontWeight:700,color:"#ffd700",marginBottom:3 }}>{b.name}</div>
                <div style={{ fontSize:10,color:"rgba(255,215,0,0.6)" }}>✓ EARNED</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize:11,color:"#475569",fontWeight:700,letterSpacing:1,marginBottom:12 }}>🔒 LOCKED ({lockedBadges.length})</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {lockedBadges.map(b => (
            <div key={b.id} onClick={() => setSelected(b)} style={{ padding:16,borderRadius:16,textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",cursor:"pointer",transition:"all 0.2s",opacity:0.6 }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="1")}
              onMouseLeave={e=>(e.currentTarget.style.opacity="0.6")}>
              <div style={{ fontSize:36,marginBottom:8,filter:"grayscale(1)" }}>{b.icon}</div>
              <div style={{ fontSize:12,fontWeight:700,color:"#64748b",marginBottom:3 }}>{b.name}</div>
              <div style={{ fontSize:10,color:"#334155" }}>Tap to see how</div>
            </div>
          ))}
        </div>
      </div>
      {earned.length === 0 && (
        <div style={{ textAlign:"center",padding:"60px 20px",color:"#475569" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>🏅</div>
          <div style={{ fontSize:16,fontWeight:700,color:"#64748b",marginBottom:8 }}>No badges yet!</div>
          <div style={{ fontSize:13 }}>Log errors, review mistakes, and build streaks to earn badges.</div>
        </div>
      )}
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
    {
      icon:"⚡", title:"Welcome to ErrorVerse!", color:"#00d4ff",
      content:"ErrorVerse is your **personal training journal** — but way cooler!\n\nEvery time you get a question wrong, log it here. The app tracks your mistakes, reminds you to revise them, and shows your progress vs. classmates — all without anyone seeing your error count.",
      tip:"Your mistakes are private. Nobody can see how many errors you've made — only your consistency and revision rate! 🔒",
      visual:(<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,margin:"16px 0"}}>{[{e:"📝",l:"Log it"},{e:"→",l:""},{e:"🔁",l:"Revise it"},{e:"→",l:""},{e:"🏆",l:"Own it!"}].map((s,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:s.e==="→"?20:30}}>{s.e}</div>{s.l&&<div style={{fontSize:9,color:"#64748b"}}>{s.l}</div>}</div>))}</div>)
    },
    {
      icon:"📝", title:"Learn Tab — Log Mistakes", color:"#ff2254",
      content:"Tap **+ Add Error** whenever you get something wrong.\n\nFill in the subject, chapter, mistake type, and what the correct answer is. The more detail you add, the smarter your revision schedule becomes.",
      tip:"Be honest about WHY you got it wrong — that self-awareness is the real learning! 🔑",
      visual:(<div style={{background:"rgba(255,34,84,0.08)",border:"1px solid rgba(255,34,84,0.25)",borderRadius:12,padding:12,margin:"12px 0"}}><div style={{fontSize:11,color:"#ff8099",marginBottom:8,fontWeight:700}}>Example entry:</div><div style={{fontSize:13,color:"#e2e8f0",marginBottom:4}}>📚 Physics → Kinematics</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>❌ Mistake type: Conceptual</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>❌ Why: Forgot to use v² = u² + 2as</div><div style={{fontSize:12,color:"#22c55e"}}>✅ Fix: Always list givens first</div></div>)
    },
    {
      icon:"🔁", title:"Review Tab — Spaced Repetition", color:"#00d4ff",
      content:"The app sends your old mistakes back at the **perfect time** — just before you forget them!\n\nThis is called **Spaced Repetition** — Day 1 → Day 3 → Day 7 → Day 30. It's how top scorers actually retain knowledge permanently.",
      tip:"Hit ✅ Mastered only when you can solve it cold, no hints. Hit 📖 Reviewed if you still need work! 💪",
      visual:(<div style={{display:"flex",gap:6,margin:"12px 0",flexWrap:"wrap" as const}}>{[{label:"Day 1",color:"#ff2254",text:"Learn"},{label:"Day 3",color:"#ffd700",text:"Review"},{label:"Day 7",color:"#f97316",text:"Review"},{label:"Day 30",color:"#22c55e",text:"Mastered!"}].map(s=>(<div key={s.label} style={{flex:1,minWidth:60,padding:"8px 4px",borderRadius:8,background:`${s.color}18`,border:`1px solid ${s.color}44`,textAlign:"center" as const}}><div style={{fontSize:10,color:s.color,fontWeight:700}}>{s.label}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{s.text}</div></div>))}</div>)
    },
    {
      icon:"🏆", title:"Two Leaderboards!", color:"#ffd700",
      content:"The Rank tab has **two separate leaderboards**:\n\n🏆 **Consistency Board** — ranked by your daily login streak. Show up every day and climb.\n\n📈 **Growth Board** — ranked by revision completion %. The more errors you go back and revise, the higher you rank.",
      tip:"You can rank differently on each board — dominate both to be the ultimate warrior! ⚔️",
      visual:(<div style={{margin:"12px 0",display:"flex",flexDirection:"column",gap:8}}><div style={{padding:"10px 14px",borderRadius:12,background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)"}}><div style={{fontSize:12,fontWeight:800,color:"#f97316",marginBottom:2}}>🏆 Consistency Board</div><div style={{fontSize:11,color:"#94a3b8"}}>Ranked by: 🔥 Daily streak (longest = #1)</div></div><div style={{padding:"10px 14px",borderRadius:12,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)"}}><div style={{fontSize:12,fontWeight:800,color:"#22c55e",marginBottom:2}}>📈 Growth Board</div><div style={{fontSize:11,color:"#94a3b8"}}>Ranked by: ♻️ Revision % (most revised = #1)</div></div></div>)
    },
    {
      icon:"🔒", title:"Private Stats — No Judgement", color:"#a78bfa",
      content:"Your **error count is completely hidden** from everyone on the leaderboard.\n\nWhat others can see:\n✅ Your streak\n✅ Days active\n✅ Revision completion %\n✅ Subjects you've covered\n\n❌ Nobody sees how many errors you made.",
      tip:"This makes the competition fair — it's about consistency and effort, not who makes the fewest mistakes! 🌟",
      visual:(<div style={{margin:"12px 0",padding:"12px 14px",borderRadius:12,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.25)"}}><div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:8}}>What the leaderboard shows:</div>{[{icon:"🔥",label:"Streak",show:true},{icon:"📅",label:"Days active",show:true},{icon:"♻️",label:"Revision %",show:true},{icon:"📚",label:"Subjects covered",show:true},{icon:"📝",label:"Error count",show:false}].map(s=>(<div key={s.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:13}}>{s.icon}</span><span style={{fontSize:11,color:s.show?"#e2e8f0":"#475569",flex:1,textDecoration:s.show?"none":"line-through"}}>{s.label}</span><span style={{fontSize:11,fontWeight:700,color:s.show?"#22c55e":"#ff2254"}}>{s.show?"Visible":"Hidden"}</span></div>))}</div>)
    },
    {
      icon:"📅", title:"Monday Promotions!", color:"#22c55e",
      content:"Every **Monday**, your weekly performance is evaluated:\n\n⬆️ **Top 3 in your league** → promoted to the next league\n\n➡️ **Middle pack** → stays in the same league\n\n⬇️ **Bottom 3** → demoted to the league below\n\nYour weekly streak, revision %, and days active all count toward your standing.",
      tip:"Even if you had a bad week, you get a fresh start every Monday. Never give up! 🔄",
      visual:(<div style={{margin:"12px 0"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:36,height:36,borderRadius:8,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📅</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#22c55e"}}>Every Monday at midnight</div><div style={{fontSize:11,color:"#64748b"}}>Promotions & demotions processed</div></div></div>{[{label:"Top 3 this week",action:"⬆️ Promoted",color:"#22c55e"},{label:"Middle of league",action:"➡️ Stays",color:"#fbbf24"},{label:"Bottom 3 this week",action:"⬇️ Demoted",color:"#ff2254"}].map(s=>(<div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:8,background:`${s.color}10`,border:`1px solid ${s.color}22`,marginBottom:5}}><span style={{fontSize:11,color:"#94a3b8"}}>{s.label}</span><span style={{fontSize:11,fontWeight:700,color:s.color}}>{s.action}</span></div>))}</div>)
    },
    {
      icon:"♾️", title:"Nen Leagues — Your Power Level!", color:"#00d4ff",
      content:"Your league is determined by your **total XP earned** in the app.\n\nStart as **Enhancer 💪** and grind your way to **Specialist ♾️** — the rarest Nen type! These are based on **Hunter x Hunter** Nen abilities.",
      tip:"Leagues are hard to climb — that's the point! Specialist requires 40,000 XP. Only true masters get there! 👑",
      visual:(<div style={{display:"flex",flexDirection:"column",gap:4,margin:"8px 0"}}>{NEN_LEAGUES.map((l,i)=>(<div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:`${l.color}12`,border:`1px solid ${l.color}33`,opacity:0.55+i*0.09}}><span style={{fontSize:14}}>{l.icon}</span><span style={{fontSize:11,color:l.color,fontWeight:700,flex:1}}>{l.name}</span><span style={{fontSize:10,color:"#64748b"}}>{l.minXP.toLocaleString()}+ XP</span></div>))}</div>)
    },
    {
      icon:"🤖", title:"AI Hub — Your Smart Tutor", color:"#a855f7",
      content:"The **AI Hub** analyses all your logged errors and gives you personal study advice!\n\nIt finds patterns in your mistakes, explains WHY you keep getting things wrong, and recommends exactly what to study next.",
      tip:"Ask it: 'What is my weakest topic this week?' or 'Why do I keep making calculation errors?' 🤖",
      visual:(<div style={{background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.28)",borderRadius:12,padding:12,margin:"12px 0"}}><div style={{fontSize:11,color:"#94a3b8",marginBottom:5}}>💬 You ask:</div><div style={{fontSize:13,color:"#c4b5fd",fontStyle:"italic",marginBottom:8}}>"What is my weakest chapter this week?"</div><div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>🤖 AI says:</div><div style={{fontSize:12,color:"#e2e8f0"}}>"You've logged 7 errors in Kinematics. Focus on equations of motion — you've missed them 4 times."</div></div>)
    },
    {
      icon:"🔥", title:"Heat Map — Your Study Story!", color:"#f97316",
      content:"The **Heat Map** is like a picture diary of every day you studied!\n\nEach little square = one day. The **brighter and redder** the square, the more mistakes you logged that day. Dark square = you didn't study. Bright red = you were on fire! 🔥\n\nTry to make the whole calendar glow!",
      tip:"Imagine your calendar as a painting — the more red squares you fill in, the more powerful your painting becomes! 🎨",
      visual:(
        <div style={{margin:"12px 0"}}>
          {/* Mini demo calendar */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:6,textAlign:"center" as const,letterSpacing:1}}>YOUR CALENDAR LOOKS LIKE THIS 👇</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {[0,0,2,3,1,3,3, 2,1,3,3,0,2,3, 1,3,2,3,3,1,0, 3,3,3,2,1,3,3, 0,2,3,3,3,2,1].map((n,i)=>{
                const cols=["rgba(255,255,255,0.04)","rgba(255,34,84,0.2)","rgba(255,34,84,0.5)","#ff2254"];
                const labels=["","low","med","🔥"];
                return(
                  <div key={i} style={{aspectRatio:"1",borderRadius:6,background:cols[n],display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {n===3&&<span style={{fontSize:8}}>🔥</span>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Legend explained simply */}
          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap" as const}}>
            {[
              {bg:"rgba(255,255,255,0.04)",label:"😴 No study",c:"#475569"},
              {bg:"rgba(255,34,84,0.2)",label:"📝 A little",c:"#ff8099"},
              {bg:"rgba(255,34,84,0.5)",label:"💪 Good day",c:"#ff2254"},
              {bg:"#ff2254",label:"🔥 Beast mode",c:"#fff"},
            ].map(l=>(
              <div key={l.label} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{width:14,height:14,borderRadius:4,background:l.bg,flexShrink:0}}/>
                <span style={{fontSize:9,color:l.c,fontWeight:600}}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon:"📅", title:"Heat Map — Tap Any Day!", color:"#00d4ff",
      content:"The Heat Map is **interactive** — it's not just for looking!\n\nTap on any **glowing day** to instantly see every mistake you logged that day. You can even click on a mistake to open it and revise it!\n\nAlso use the **← → arrows** to travel back in time through older months.",
      tip:"Tap your busiest day (darkest red) to see which mistakes you logged — then go revise them! 🔍",
      visual:(
        <div style={{margin:"12px 0",display:"flex",flexDirection:"column",gap:8}}>
          {/* Feature cards */}
          {[
            {icon:"👆",label:"Tap a glowing square",desc:"See all mistakes from that day",color:"#f97316"},
            {icon:"📋",label:"Tap any mistake",desc:"Open it and revise it right now",color:"#ff2254"},
            {icon:"◀▶",label:"Use the arrows",desc:"Travel back through past months",color:"#00d4ff"},
            {icon:"📊",label:"Stats at the top",desc:"All time, this year, this month, active days",color:"#a78bfa"},
          ].map(f=>(
            <div key={f.label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:`${f.color}0e`,border:`1px solid ${f.color}25`}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${f.color}18`,border:`1px solid ${f.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{f.icon}</div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:f.color}}>{f.label}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      icon:"🌟", title:"Heat Map — Your Power Score!", color:"#ffd700",
      content:"At the top of the Heat Map, you'll see **4 big numbers** — think of them as your power score!\n\n📚 **All Time** — every mistake you've ever logged\n📆 **This Year** — mistakes logged this year\n🗓 **This Month** — just this month\n🔥 **Active Days** — how many days you actually studied",
      tip:"The goal: make ALL 4 numbers go up every week! Even logging one mistake a day makes your Active Days number grow! 🚀",
      visual:(
        <div style={{margin:"12px 0"}}>
          <div style={{fontSize:10,color:"#64748b",marginBottom:8,textAlign:"center" as const,letterSpacing:1}}>YOUR POWER NUMBERS 💪</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
            {[
              {icon:"📚",label:"All Time",value:"247",sub:"total errors",color:"#00d4ff"},
              {icon:"📆",label:"This Year",value:"89",sub:"this year",color:"#a78bfa"},
              {icon:"🗓",label:"This Month",value:"23",sub:"this month",color:"#ff2254"},
              {icon:"🔥",label:"Active Days",value:"34",sub:"days studied",color:"#f97316"},
            ].map(s=>(
              <div key={s.label} style={{padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:`1px solid ${s.color}25`,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:900,color:s.color,fontFamily:"'Bebas Neue',cursive",lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:9,color:"#64748b",marginTop:1}}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(0,212,255,0.07)",border:"1px solid rgba(0,212,255,0.18)",textAlign:"center" as const}}>
            <span style={{fontSize:11,color:"#00d4ff"}}>🎯 Goal: make all 4 numbers grow every week!</span>
          </div>
        </div>
      )
    },
    {
      icon:"🔥", title:"Streaks — Show Up Every Day", color:"#ffd700",
      content:"Log **at least one error** every day to keep your streak alive.\n\nYour streak is the **#1 factor** in the Consistency Board ranking — the longer your streak, the higher you rank.\n\nMiss a day and your streak resets to zero!",
      tip:"Even on a good day, log one small mistake. Consistency always beats cramming! 🔥",
      visual:(<div style={{textAlign:"center",margin:"12px 0"}}><div style={{display:"flex",justifyContent:"center",gap:6}}>{[true,true,true,true,true,false,false].map((active,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:32,height:32,borderRadius:8,background:active?"linear-gradient(135deg,#ffd700,#f97316)":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{active?"🔥":"○"}</div><div style={{fontSize:8,color:"#475569"}}>{"SMTWTFS"[i]}</div></div>))}</div><div style={{fontSize:11,color:"#ffd700",marginTop:10,fontWeight:600}}>5-day streak — you're on fire! 🔥</div><div style={{fontSize:10,color:"#64748b",marginTop:4}}>7+ days unlocks the 🔥 On Fire badge</div></div>)
    },
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
      sub: "Master your Mistakes. Own your Story.",
      desc: "Turn every mistake into a superpower. Log errors, revise them with spaced repetition, compete privately on the leaderboard, and become the student who never repeats the same mistake twice.",
      visual: (
        <div style={{ display: "flex", justifyContent: "center", gap: 20, margin: "24px 0" }}>
          {["📝", "🔁", "🏆"].map((e, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: `rgba(0,212,255,${0.1 + i * 0.05})`,
                border: "1px solid rgba(0,212,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                animation: `floatUp${i} 2s ease-in-out ${i * 0.3}s infinite alternate`,
              }}>{e}</div>
              <span style={{ fontSize: 11, color: "#64748b" }}>{["Log it", "Revise it", "Rank up"][i]}</span>
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
      sub: "Every error is a lesson waiting to happen",
      desc: "Whenever you get something wrong — in class, homework, or mock tests — tap '+ Add Error'. Add the subject, chapter, mistake type, and the correct answer. The more detail, the smarter your revision schedule.",
      visual: (
        <div style={{ background: "rgba(255,34,84,0.08)", border: "1px solid rgba(255,34,84,0.25)", borderRadius: 16, padding: 16, margin: "20px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" as const }}>
            {["Physics", "Math", "Chemistry"].map((s, i) => (
              <div key={s} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${Object.values(SUBJECT_COLORS)[i]}18`, color: Object.values(SUBJECT_COLORS)[i], border: `1px solid ${Object.values(SUBJECT_COLORS)[i]}44` }}>{s}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 5 }}>📚 Chapter: Kinematics</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>❌ Type: Conceptual — Forgot v² = u² + 2as</div>
          <div style={{ fontSize: 12, color: "#22c55e" }}>✅ Fix: Always list what's given first</div>
        </div>
      ),
      color: "#ff2254",
    },
    {
      icon: "🔁",
      iconGlow: "#00d4ff",
      title: "Revise at the",
      titleHighlight: "Right Time",
      sub: "Science-backed spaced repetition",
      desc: "The app automatically schedules each mistake for review at the optimal time — Day 1, Day 3, Day 7, then Day 30. This is Spaced Repetition — the most powerful study technique science has discovered.",
      visual: (
        <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" as const }}>
          {[{ d: "Day 1", c: "#ff2254", p: 100 }, { d: "Day 3", c: "#ffd700", p: 75 }, { d: "Day 7", c: "#f97316", p: 50 }, { d: "Day 30", c: "#22c55e", p: 25 }].map(s => (
            <div key={s.d} style={{ flex: 1, minWidth: 60, padding: "10px 8px", borderRadius: 12, background: `${s.c}12`, border: `1px solid ${s.c}33`, textAlign: "center" as const }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{s.d}</div>
              <div style={{ height: 40, display: "flex", alignItems: "flex-end", justifyContent: "center", margin: "6px 0" }}>
                <div style={{ width: 16, height: `${s.p}%`, background: `linear-gradient(to top,${s.c},${s.c}66)`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 9, color: "#64748b" }}>revise</div>
            </div>
          ))}
        </div>
      ),
      color: "#00d4ff",
    },
    {
      icon: "🏆",
      iconGlow: "#ffd700",
      title: "Two Private",
      titleHighlight: "Leaderboards",
      sub: "Compete on consistency AND growth",
      desc: "The Rank tab has two boards — 🏆 Consistency (ranked by streak) and 📈 Growth (ranked by revision %). Your error count is always hidden — nobody sees how many mistakes you made, only your effort.",
      visual: (
        <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>🏆 Consistency Board</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Ranked by daily streak — show up every day</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", marginBottom: 2 }}>📈 Growth Board</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Ranked by revision % — actually go back and learn</div>
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", textAlign: "center" as const }}>
            <span style={{ fontSize: 11, color: "#00d4ff" }}>🔒 Error count hidden from everyone</span>
          </div>
        </div>
      ),
      color: "#ffd700",
    },
    {
      icon: "🔥",
      iconGlow: "#f97316",
      title: "Your Heat Map",
      titleHighlight: "Calendar!",
      sub: "See your whole study journey at a glance",
      desc: "The Heat tab shows a calendar where every day you studied lights up red! The more you studied, the brighter it glows. Tap any glowing day to see exactly which mistakes you logged that day.",
      visual: (
        <div style={{ margin: "16px 0" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textAlign: "center" as const }}>IMAGINE THIS IS YOUR CALENDAR 👇</div>
          {/* Demo mini calendar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 12 }}>
            {[0,1,2,3,2,3,3, 1,0,3,3,2,3,3, 3,2,3,1,3,3,0, 2,3,3,3,2,1,3].map((n,i) => {
              const bgs = ["rgba(255,255,255,0.04)","rgba(255,34,84,0.2)","rgba(255,34,84,0.5)","#ff2254"];
              return (
                <div key={i} style={{ aspectRatio:"1", borderRadius:7, background:bgs[n], display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                  {n === 3 && <span style={{ fontSize:9 }}>🔥</span>}
                  {n === 0 && <span style={{ fontSize:8, color:"#334155" }}>·</span>}
                </div>
              );
            })}
          </div>
          {/* Simple legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" as const }}>
            {[
              { bg: "rgba(255,255,255,0.04)", label: "😴 Rest day" },
              { bg: "rgba(255,34,84,0.25)", label: "📝 Studied" },
              { bg: "#ff2254", label: "🔥 On fire!" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg }} />
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{l.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", textAlign: "center" as const }}>
            <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>👆 Tap any red square → see what you studied!</span>
          </div>
        </div>
      ),
      color: "#f97316",
    },
    {
      icon: "📅",
      iconGlow: "#22c55e",
      title: "Monday",
      titleHighlight: "Promotions",
      sub: "Every week is a fresh battle",
      desc: "Every Monday your weekly performance is judged. Top 3 in your league get PROMOTED to the next Nen type. Bottom 3 get demoted. Middle stays. Your streak and revision rate decide everything.",
      visual: (
        <div style={{ margin: "16px 0" }}>
          {[
            { label: "Top 3 this week", action: "⬆️ PROMOTED", color: "#22c55e" },
            { label: "Middle of league", action: "➡️ STAYS", color: "#fbbf24" },
            { label: "Bottom 3 this week", action: "⬇️ DEMOTED", color: "#ff2254" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25`, marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.action}</span>
            </div>
          ))}
          <div style={{ textAlign: "center" as const, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>Resets every Monday — always a chance to climb 🔄</span>
          </div>
        </div>
      ),
      color: "#22c55e",
    },
    {
      icon: "♾️",
      iconGlow: "#00d4ff",
      title: "Nen Leagues —",
      titleHighlight: "Your Power!",
      sub: "Based on Hunter x Hunter Nen types",
      desc: "Your league is determined by total XP earned. Start as Enhancer 💪 and grind to Specialist ♾️. Leagues are intentionally hard to climb — Specialist requires 40,000 XP. Only legends get there.",
      visual: (
        <div style={{ margin: "8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
          {NEN_LEAGUES.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 8, background: `${l.color}12`, border: `1px solid ${l.color}33`, opacity: 0.5 + i * 0.1 }}>
              <span style={{ fontSize: 14 }}>{l.icon}</span>
              <span style={{ fontSize: 11, color: l.color, fontWeight: 700, flex: 1 }}>{l.name}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>{l.minXP.toLocaleString()}+ XP</span>
            </div>
          ))}
        </div>
      ),
      color: "#00d4ff",
    },
    {
      icon: "🚀",
      iconGlow: "#22c55e",
      title: "You're",
      titleHighlight: "Ready!",
      sub: "Your journey starts now",
      desc: "Log mistakes daily to build your streak 🔥. Revise them to climb the Growth Board 📈. Show up every day to dominate the Consistency Board 🏆. Become the student who never repeats mistakes.",
      visual: (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <div style={{ fontSize: 60, marginBottom: 16, animation: "spinOnce 1s ease-out" }}>🚀</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" as const }}>
            {["Log daily 📝", "Revise smart 🔁", "Rank up 🏆", "Monday promo 📅", "Stay private 🔒"].map(t => (
              <div key={t} style={{ padding: "6px 12px", borderRadius: 20, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", fontSize: 11, color: "#22c55e", fontWeight: 600 }}>{t}</div>
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

// ─── IMAGE UPLOAD HELPER ──────────────────────────────────────────────────────
function imageToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function PhotoUploadBox({ label, value, onChange }: { label: string; value: string|null; onChange: (v: string|null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width:"100%", minHeight:80, borderRadius:10,
          border:`2px dashed ${value ? "#22c55e" : "rgba(255,255,255,0.12)"}`,
          background: value ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative", overflow:"hidden", transition:"all 0.2s",
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" style={{ maxHeight:120, maxWidth:"100%", objectFit:"contain", borderRadius:8 }} />
            <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{ position:"absolute", top:6, right:6, background:"rgba(255,34,84,0.85)", border:"none", borderRadius:"50%", width:22, height:22, color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize:24, marginBottom:4 }}>📷</span>
            <span style={{ fontSize:11, color:"#475569" }}>Tap to upload photo</span>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          const b64 = await imageToBase64(f); onChange(b64);
        }} />
      </div>
    </div>
  );
}

function ErrorForm({ onSubmit, onClose }: any) {
  const [form, setForm] = useState({
    subject: "Physics" as ErrorEntry["subject"],
    chapter: "",
    questionType: "Numerical" as ErrorEntry["questionType"],
    mistakeType: "Conceptual" as ErrorEntry["mistakeType"],
    difficulty: "Medium" as ErrorEntry["difficulty"],
    questionText: "",
    solution: "",
    lesson: "",
    whyMistake: "",
    formula: "",
    questionImageUrl: null as string|null,
    answerImageUrl: null as string|null,
  });
  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:600,maxHeight:"94vh",overflow:"auto",scrollbarWidth:"none" as any }}>
        <GlassCard hover={false} style={{ padding:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,color:"#00d4ff",fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>+ NEW ERROR ENTRY</h2>
            <button onClick={onClose} style={{ background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {/* Subject + Chapter */}
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
            {/* Type selects */}
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
            {/* Question text */}
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>📋 THE QUESTION (write it out)</label>
              <textarea style={{ ...INP_STYLE,height:72,resize:"vertical" } as any} placeholder="Write the question here so you can remember what it was..." value={form.questionText} onChange={set("questionText")} />
            </div>
            {/* Photo uploads */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <PhotoUploadBox label="📷 QUESTION PHOTO (optional)" value={form.questionImageUrl} onChange={v => setForm(p => ({ ...p, questionImageUrl: v }))} />
              <PhotoUploadBox label="📷 ANSWER PHOTO (optional)" value={form.answerImageUrl} onChange={v => setForm(p => ({ ...p, answerImageUrl: v }))} />
            </div>
            {/* Why + Solution */}
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>❓ WHY DID I MAKE THIS MISTAKE?</label>
              <textarea style={{ ...INP_STYLE,height:60,resize:"vertical" } as any} placeholder="Be brutally honest..." value={form.whyMistake} onChange={set("whyMistake")} />
            </div>
            <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>✅ CORRECT SOLUTION / CONCEPT</label>
              <textarea style={{ ...INP_STYLE,height:72,resize:"vertical" } as any} placeholder="Write the correct approach..." value={form.solution} onChange={set("solution")} />
            </div>
            {/* Formula + Lesson */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>🔢 FORMULA / KEY POINT</label>
                <input style={INP_STYLE} placeholder="e.g. F = ma" value={form.formula} onChange={set("formula")} />
              </div>
              <div><label style={{ fontSize:11,color:"#64748b",display:"block",marginBottom:4 }}>💡 LESSON LEARNED</label>
                <input style={INP_STYLE} placeholder="What to remember next time?" value={form.lesson} onChange={set("lesson")} />
              </div>
            </div>
            <button
              onClick={() => { onSubmit({ ...form, subject: form.subject||"Physics", chapter: form.chapter.trim()||"Untitled", date: new Date().toISOString().split("T")[0] }); onClose(); }}
              style={{ padding:"13px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ff2254,#ff6b35)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1 }}>
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

// ─── ERROR DETAIL MODAL ───────────────────────────────────────────────────────

function ImageGallery({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx(i => Math.min(i+1, images.length-1));
      if (e.key === "ArrowLeft") setIdx(i => Math.max(i-1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }} onClick={onClose}>
      {/* Close */}
      <button onClick={onClose} style={{ position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",fontSize:24,cursor:"pointer",borderRadius:50,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",zIndex:501 }}>✕</button>
      {/* Counter */}
      <div style={{ position:"absolute",top:24,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,0.5)",fontSize:13 }}>{idx+1} / {images.length}</div>
      {/* Image */}
      <img src={images[idx]} alt="" onClick={e=>e.stopPropagation()} style={{ maxWidth:"92vw",maxHeight:"80vh",objectFit:"contain",borderRadius:12,boxShadow:"0 20px 80px rgba(0,0,0,0.8)" }} />
      {/* Navigation */}
      {images.length > 1 && (
        <div style={{ display:"flex",gap:16,marginTop:24 }} onClick={e=>e.stopPropagation()}>
          <button onClick={() => setIdx(i=>Math.max(i-1,0))} disabled={idx===0} style={{ padding:"10px 24px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:idx===0?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.1)",color:idx===0?"#334155":"#fff",cursor:idx===0?"not-allowed":"pointer",fontSize:14,fontWeight:700 }}>← Prev</button>
          <button onClick={() => setIdx(i=>Math.min(i+1,images.length-1))} disabled={idx===images.length-1} style={{ padding:"10px 24px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:idx===images.length-1?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.1)",color:idx===images.length-1?"#334155":"#fff",cursor:idx===images.length-1?"not-allowed":"pointer",fontSize:14,fontWeight:700 }}>Next →</button>
        </div>
      )}
      {/* Dots */}
      {images.length > 1 && (
        <div style={{ display:"flex",gap:8,marginTop:16 }} onClick={e=>e.stopPropagation()}>
          {images.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?24:8,height:8,borderRadius:4,background:i===idx?"#00d4ff":"rgba(255,255,255,0.2)",cursor:"pointer",transition:"all 0.2s" }} />)}
        </div>
      )}
    </div>
  );
}

function ErrorDetailModal({ err, onClose, onDelete }: { err: ErrorEntry; onClose: () => void; onDelete?: () => void }) {
  const [gallery, setGallery] = useState<{images:string[];start:number}|null>(null);
  return (
    <>
    {gallery && <ImageGallery images={gallery.images} startIndex={gallery.start} onClose={() => setGallery(null)} />}
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",scrollbarWidth:"none" as any }} onClick={e=>e.stopPropagation()}>
        <GlassCard hover={false} style={{ padding:24, borderLeft:`4px solid ${MASTERY_COLORS[err.masteryStage??"red"]}` }}>
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,gap:10 }}>
            <div>
              <div style={{ display:"flex",gap:6,marginBottom:8,flexWrap:"wrap" as const }}>
                <span style={{ padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44` }}>{err.subject}</span>
                <span style={{ padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44` }}>{err.mistakeType}</span>
                <span style={{ padding:"3px 10px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.06)",color:"#64748b" }}>{err.difficulty}</span>
                <span style={{ padding:"3px 10px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.06)",color:"#64748b" }}>{err.questionType}</span>
              </div>
              <div style={{ fontSize:20,fontWeight:800,color:"#e2e8f0" }}>{err.chapter}</div>
              <div style={{ fontSize:11,color:"#475569",marginTop:2 }}>{err.date}</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",fontSize:16,cursor:"pointer",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
          </div>

          {/* Mastery */}
          <div style={{ marginBottom:16 }}>
            <MasteryBar level={err.masteryLevel??0} stage={err.masteryStage??"red"} />
          </div>
          {err.nextReviewDate && <div style={{ marginBottom:16 }}><RevisionBadge nextDate={err.nextReviewDate} /></div>}

          {/* Question text */}
          {(err as any).questionText && (
            <div style={{ marginBottom:14,padding:"12px 14px",background:"rgba(0,212,255,0.06)",borderRadius:12,border:"1px solid rgba(0,212,255,0.15)" }}>
              <div style={{ fontSize:10,color:"#00d4ff",fontWeight:700,letterSpacing:1,marginBottom:6 }}>📋 THE QUESTION</div>
              <div style={{ fontSize:13,color:"#e2e8f0",lineHeight:1.6 }}>{(err as any).questionText}</div>
            </div>
          )}

          {/* Question + Answer photos — tap to open gallery */}
          {((err as any).questionImageUrl || (err as any).answerImageUrl) && (() => {
            const imgs = [(err as any).questionImageUrl,(err as any).answerImageUrl].filter(Boolean) as string[];
            return (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10,color:"#a855f7",fontWeight:700,letterSpacing:1,marginBottom:8 }}>📷 PHOTOS — Tap to open full view</div>
                <div style={{ display:"grid",gridTemplateColumns:imgs.length>1?"1fr 1fr":"1fr",gap:10 }}>
                  {(err as any).questionImageUrl && (
                    <div onClick={() => setGallery({ images:imgs, start:0 })} style={{ cursor:"pointer",borderRadius:12,overflow:"hidden",border:"1px solid rgba(168,85,247,0.25)",background:"rgba(0,0,0,0.3)",transition:"all 0.2s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(168,85,247,0.6)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(168,85,247,0.25)")}>
                      <img src={(err as any).questionImageUrl} alt="Question" style={{ width:"100%",height:140,objectFit:"cover" }} />
                      <div style={{ padding:"6px 10px",fontSize:10,color:"#a855f7",fontWeight:700 }}>📋 QUESTION · tap to zoom</div>
                    </div>
                  )}
                  {(err as any).answerImageUrl && (
                    <div onClick={() => setGallery({ images:imgs, start:(err as any).questionImageUrl?1:0 })} style={{ cursor:"pointer",borderRadius:12,overflow:"hidden",border:"1px solid rgba(168,85,247,0.25)",background:"rgba(0,0,0,0.3)",transition:"all 0.2s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(168,85,247,0.6)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(168,85,247,0.25)")}>
                      <img src={(err as any).answerImageUrl} alt="Answer" style={{ width:"100%",height:140,objectFit:"cover" }} />
                      <div style={{ padding:"6px 10px",fontSize:10,color:"#a855f7",fontWeight:700 }}>✅ ANSWER · tap to zoom</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Why mistake */}
          {err.whyMistake && (
            <div style={{ marginBottom:12,padding:"12px 14px",background:"rgba(255,34,84,0.07)",borderRadius:12,border:"1px solid rgba(255,34,84,0.18)" }}>
              <div style={{ fontSize:10,color:"#ff2254",fontWeight:700,letterSpacing:1,marginBottom:6 }}>❓ WHY I MADE THIS MISTAKE</div>
              <div style={{ fontSize:13,color:"#e2e8f0",lineHeight:1.6 }}>{err.whyMistake}</div>
            </div>
          )}

          {/* Solution */}
          {err.solution && (
            <div style={{ marginBottom:12,padding:"12px 14px",background:"rgba(34,197,94,0.07)",borderRadius:12,border:"1px solid rgba(34,197,94,0.18)" }}>
              <div style={{ fontSize:10,color:"#22c55e",fontWeight:700,letterSpacing:1,marginBottom:6 }}>✅ CORRECT SOLUTION</div>
              <div style={{ fontSize:13,color:"#e2e8f0",lineHeight:1.6 }}>{err.solution}</div>
            </div>
          )}

          {/* Formula */}
          {err.formula && (
            <div style={{ marginBottom:12,padding:"10px 14px",background:"rgba(0,212,255,0.06)",borderRadius:10,border:"1px solid rgba(0,212,255,0.15)",fontFamily:"monospace" }}>
              <div style={{ fontSize:10,color:"#00d4ff",fontWeight:700,letterSpacing:1,marginBottom:4 }}>🔢 FORMULA</div>
              <div style={{ fontSize:14,color:"#00d4ff" }}>∫ {err.formula}</div>
            </div>
          )}

          {/* Lesson */}
          {err.lesson && (
            <div style={{ marginBottom:16,padding:"10px 14px",background:"rgba(255,215,0,0.07)",borderRadius:10,border:"1px solid rgba(255,215,0,0.2)" }}>
              <div style={{ fontSize:10,color:"#ffd700",fontWeight:700,letterSpacing:1,marginBottom:4 }}>💡 LESSON LEARNED</div>
              <div style={{ fontSize:13,color:"#ffd700",lineHeight:1.5 }}>{err.lesson}</div>
            </div>
          )}

          {/* Review history */}
          {(err.reviewHistory?.length ?? 0) > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10,color:"#475569",fontWeight:700,letterSpacing:1,marginBottom:8 }}>📅 REVIEW HISTORY ({err.reviewHistory?.length} times)</div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" as const }}>
                {err.reviewHistory?.slice(-8).map((d,i) => <span key={i} style={{ padding:"2px 8px",borderRadius:6,background:"rgba(0,212,255,0.08)",color:"#00d4ff",fontSize:10,border:"1px solid rgba(0,212,255,0.2)" }}>{d}</span>)}
              </div>
            </div>
          )}

          {/* Delete */}
          {onDelete && (
            <button onClick={() => { onDelete(); onClose(); }} style={{ width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.08)",color:"#ff2254",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>🗑 Delete this error</button>
          )}
        </GlassCard>
      </div>
    </div>
    </>
  );
}

// ─── ERROR BOOK ───────────────────────────────────────────────────────────────

function ErrorBook({ userId, onEntryAdded, onXP, xpData, streak, todayCount }: { userId:string; onEntryAdded:(n:number)=>void; onXP?:(xp:number)=>void; xpData?:any; streak?:number; todayCount?:number }) {
  const [errors,setErrors]=useState<ErrorEntry[]>([]),[showForm,setShowForm]=useState(false);
  const [fs,setFs]=useState("All"),[fm,setFm]=useState("All"),[search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [viewMode,setViewMode]=useState<"today"|"all">("today");
  const [selectedError,setSelectedError]=useState<ErrorEntry|null>(null);
  const { toasts, add: addToast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(()=>{getErrors(userId).then(d=>{setErrors(d);setLoading(false);});},[userId]);

  const handleAdd=async(form:any)=>{
    const {ref,newCount}=await addError(userId,form);
    const newErr:ErrorEntry={id:ref.id,...form,masteryLevel:0,masteryStage:"red",nextReviewDate:new Date(Date.now()+86400000).toISOString().split("T")[0],reviewHistory:[],revisionInterval:1,isArchived:false};
    setErrors(p=>[newErr,...p]);
    onEntryAdded(newCount);
    await awardXP(userId, XP_REWARDS.addError);
    if (onXP) onXP(XP_REWARDS.addError);
    addToast(`Error logged! +${XP_REWARDS.addError} XP ⚡`,"xp");
    const allErrors=[newErr,...errors];
    const newBadges=await checkAndAwardBadges(userId,allErrors);
    if(newBadges.length>0) addToast(`🏅 New badge: ${BADGES.find(b=>b.id===newBadges[0])?.name}!`,"xp");
  };

  const handleDel=async(id:string)=>{ await deleteError(id); setErrors(p=>p.filter(e=>e.id!==id)); };

  // Today's errors vs all
  const todayErrors = errors.filter(e => e.date === todayStr);
  const sourceErrors = viewMode === "today" ? todayErrors : errors;

  const filtered=sourceErrors.filter((e:ErrorEntry)=>{
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "⚡" : "🌙";
  const pct = todayCount ? Math.min((todayCount / 3) * 100, 100) : 0;
  const todayErrs = errors.filter(e => e.date === todayStr);
  const weekErrs = errors.filter(e => (new Date().getTime()-new Date(e.date).getTime())/86400000 <= 7).length;

  return (
    <div style={{ paddingBottom:40 }}>
      <ToastContainer toasts={toasts}/>
      {showForm&&<ErrorForm onSubmit={handleAdd} onClose={()=>setShowForm(false)}/>}
      {selectedError && <ErrorDetailModal err={selectedError} onClose={()=>setSelectedError(null)} onDelete={selectedError.id ? ()=>handleDel(selectedError.id!) : undefined} />}

      {/* ─── BEAUTIFUL HOME DASHBOARD ─── */}
      <div style={{ marginBottom:24, borderRadius:20, overflow:"hidden", background:"linear-gradient(135deg,rgba(255,34,84,0.12),rgba(0,212,255,0.08))", border:"1px solid rgba(255,255,255,0.08)", padding:20 }}>
        {/* Greeting */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11,color:"#475569",fontWeight:700,letterSpacing:1 }}>{greetEmoji} {greeting.toUpperCase()}</div>
            <div style={{ fontSize:20,fontWeight:900,color:"#e2e8f0",marginTop:2 }}>Ready to grind? 💪</div>
          </div>
          {xpData && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11,color:"#a78bfa",fontWeight:700 }}>⚡ Level {xpData.level}</div>
              <div style={{ fontSize:20,fontWeight:900,color:"#a78bfa",fontFamily:"'Bebas Neue',cursive",letterSpacing:2 }}>{xpData.totalXP} XP</div>
            </div>
          )}
        </div>

        {/* Daily goal progress */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <span style={{ fontSize:12,color:"#94a3b8",fontWeight:600 }}>Daily Goal: {todayCount || 0}/3 errors logged</span>
            <span style={{ fontSize:12,color: pct >= 100 ? "#22c55e" : "#ff2254",fontWeight:700 }}>{pct >= 100 ? "✅ DONE!" : `${Math.round(pct)}%`}</span>
          </div>
          <div style={{ height:8,borderRadius:4,background:"rgba(255,255,255,0.06)" }}>
            <div style={{ height:"100%",borderRadius:4,width:`${pct}%`,background:pct>=100?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#ff2254,#ff6b35)",transition:"width 0.5s ease",boxShadow:pct>=100?"0 0 12px rgba(34,197,94,0.5)":"0 0 12px rgba(255,34,84,0.4)" }} />
          </div>
        </div>

        {/* Quick stats mini row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
          {[
            { icon:"📝", val:todayErrs.length, label:"Today" },
            { icon:"📅", val:weekErrs, label:"This Week" },
            { icon:"🔥", val:streak||0, label:"Streak" },
            { icon:"🟢", val:errors.filter(e=>e.masteryStage==="green").length, label:"Mastered" },
          ].map(s => (
            <div key={s.label} style={{ padding:"10px 8px",borderRadius:12,background:"rgba(255,255,255,0.05)",textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:18,fontWeight:900,color:"#e2e8f0",fontFamily:"'Bebas Neue',cursive",lineHeight:1.2 }}>{s.val}</div>
              <div style={{ fontSize:9,color:"#475569",marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button onClick={()=>setShowForm(true)} style={{ width:"100%",marginTop:14,padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ff2254,#ff6b35)",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:900,cursor:"pointer",letterSpacing:1,boxShadow:"0 4px 20px rgba(255,34,84,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          <span style={{ fontSize:20 }}>+</span> LOG A MISTAKE NOW
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20 }}>
        {[
          { label:"Total Errors",value:errors.length,icon:"📝",color:"#00d4ff" },
          { label:"Today",value:todayErrors.length,icon:"📅",color:"#ff2254" },
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

      {/* Controls */}
      <div style={{ display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center" }}>
        <input style={{ flex:1,minWidth:140,...INP_STYLE }} placeholder="🔍 Search errors..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={()=>setShowForm(true)} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const }}>+ Add Error</button>
      </div>

      {/* Today / All toggle */}
      <div style={{ display:"flex",gap:6,marginBottom:14,background:"rgba(255,255,255,0.03)",padding:4,borderRadius:12,border:"1px solid rgba(255,255,255,0.07)" }}>
        {[{id:"today",label:`📅 Today (${todayErrors.length})`},{id:"all",label:`📚 All Errors (${errors.length})`}].map(v=>(
          <button key={v.id} onClick={()=>setViewMode(v.id as any)} style={{ flex:1,padding:"8px",borderRadius:9,border:"none",background:viewMode===v.id?"rgba(0,212,255,0.15)":"transparent",color:viewMode===v.id?"#00d4ff":"#475569",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s" }}>{v.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const }}>
        {["All","Physics","Chemistry","Math","Other"].map(s=><button key={s} style={CHIP(fs===s,"#00d4ff")} onClick={()=>setFs(s)}>{s}</button>)}
        <span style={{ borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px" }}/>
        {["All","Conceptual","Calculation","Silly mistake","Time pressure"].map(m=><button key={m} style={CHIP(fm===m,"#ff2254")} onClick={()=>setFm(m)}>{m}</button>)}
      </div>

      {loading?<div style={{ textAlign:"center",padding:40,color:"#475569" }}>Loading...</div>:(
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {filtered.length===0&&(
            <div style={{ textAlign:"center",padding:40,color:"#475569" }}>
              {viewMode==="today"?"No errors logged today. Start by tapping + Add Error! 🎯":"No errors found. Clean slate! 🎯"}
            </div>
          )}
          {filtered.map((err:ErrorEntry)=>(
            <div
              key={err.id}
              onClick={()=>setSelectedError(err)}
              style={{
                padding:16, borderRadius:16,
                background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)",
                border:`1px solid rgba(255,255,255,0.08)`,
                borderLeft:`4px solid ${MASTERY_COLORS[err.masteryStage??"red"]}`,
                cursor:"pointer", transition:"all 0.2s",
                boxShadow:"0 2px 12px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-2px)")}
              onMouseLeave={e=>(e.currentTarget.style.transform="none")}
            >
              <div style={{ display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap" as const }}>
                <div style={{ flex:1,minWidth:200 }}>
                  <div style={{ display:"flex",gap:8,marginBottom:6,flexWrap:"wrap" as const }}>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44` }}>{err.subject}</span>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44` }}>{err.mistakeType}</span>
                    <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.04)",color:"#64748b" }}>{err.difficulty}</span>
                  </div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:3 }}>{err.chapter}</div>
                  {(err as any).questionText && <div style={{ fontSize:12,color:"#64748b",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>📋 {(err as any).questionText}</div>}
                  <div style={{ fontSize:11,color:"#94a3b8",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>{err.solution}</div>
                  <div style={{ maxWidth:200 }}>
                    <MasteryBar level={err.masteryLevel??0} stage={err.masteryStage??"red"} showLabel={false}/>
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0 }}>
                  <div style={{ fontSize:11,color:"#475569" }}>{err.date}</div>
                  {err.nextReviewDate&&<RevisionBadge nextDate={err.nextReviewDate}/>}
                  {((err as any).questionImageUrl||(err as any).answerImageUrl) && <span style={{ fontSize:10,color:"#a855f7",background:"rgba(168,85,247,0.12)",border:"1px solid rgba(168,85,247,0.25)",padding:"2px 8px",borderRadius:6 }}>📷 Has photos</span>}
                  <span style={{ fontSize:10,color:"#475569" }}>Tap to view →</span>
                </div>
              </div>
            </div>
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

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{count}</>;
}

// ─── MINI PROGRESS BAR ───────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function isUserInactive(l: any): boolean {
  if (!l.lastActive) return (l.streak ?? 0) === 0 && (l.totalErrors ?? 0) === 0;
  const diffDays = (Date.now() - new Date(l.lastActive).getTime()) / 86400000;
  return diffDays >= 3;
}

function getStreakColor(s: number) { return s === 0 ? "#64748b" : s < 7 ? "#f97316" : "#ffd700"; }
function getRevColor(r: number)    { return r === 0 ? "#ff2254" : r <= 2 ? "#fbbf24" : "#22c55e"; }

// Compute "days active" from totalErrors as a rough proxy (capped estimate)
function getDaysActive(l: any): number {
  // Each day a student might log 1-3 errors. rough = errors / 1.5
  return Math.min(l.streak ?? 0, Math.round((l.totalErrors ?? 0) / 1.5));
}

// Revision completion % = repeatedMistakes / max(totalErrors,1) * 100
function getRevisionPct(l: any): number {
  const errors = l.totalErrors ?? 0;
  const repeats = l.repeatedMistakes ?? 0;
  if (errors === 0) return 0;
  return Math.min(100, Math.round((repeats / errors) * 100));
}

// Subjects covered — stored as a comma-joined string or array in leaderboard entry
function getSubjects(l: any): string[] {
  if (Array.isArray(l.subjects)) return l.subjects.slice(0, 4);
  if (typeof l.subjects === "string" && l.subjects) return l.subjects.split(",").slice(0, 4);
  // fallback: guess from subjectBreakdown keys if present
  if (l.subjectBreakdown && typeof l.subjectBreakdown === "object") return Object.keys(l.subjectBreakdown).slice(0, 4);
  return [];
}

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  Physics: "#00d4ff", Math: "#ff2254", Chemistry: "#22c55e", Other: "#f97316",
  Biology: "#a78bfa", English: "#fbbf24", History: "#fb923c",
};

// ─── LEADERBOARD CARD (shared between both boards) ────────────────────────────
function LBCard({ l, rank, isMe, profile, boardType, maxVal }: any) {
  const RANK_COLORS = ["#ffd700","#c0c0c0","#cd7f32"];
  const MEDALS = ["🥇","🥈","🥉"];
  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank-1] : (isMe ? "#a78bfa" : "#475569");
  const glowColor = isTop3 ? RANK_COLORS[rank-1] : "transparent";
  const uid = l.userId ?? l.id;
  const name = profile?.displayName || l.displayName || "Warrior";
  const avatarKey = profile?.avatar || "av_luffy";
  const photoURL = profile?.photoURL || null;
  const inactive = isUserInactive(l);
  const onFire = (l.streak ?? 0) >= 7;

  // Board-specific primary value
  const streak = l.streak ?? 0;
  const revPct = getRevisionPct(l);
  const daysActive = getDaysActive(l);
  const subjects = getSubjects(l);

  const primaryVal   = boardType === "consistency" ? streak      : revPct;
  const primaryLabel = boardType === "consistency" ? "day streak" : "% revised";
  const primaryColor = boardType === "consistency" ? getStreakColor(streak) : getRevColor(l.repeatedMistakes ?? 0);

  return (
    <div style={{
      position: "relative",
      padding: isTop3 ? "16px 14px" : "11px 14px",
      borderRadius: isTop3 ? 18 : 13,
      display: "flex", alignItems: "center", gap: 12,
      background: isMe
        ? "linear-gradient(135deg,rgba(123,97,255,0.2),rgba(0,212,255,0.1))"
        : isTop3 ? `linear-gradient(135deg,${rankColor}12,${rankColor}04)` : "rgba(255,255,255,0.03)",
      border: isMe ? "2px solid rgba(167,139,250,0.7)"
              : isTop3 ? `2px solid ${rankColor}` : "1px solid rgba(255,255,255,0.06)",
      boxShadow: isMe ? "0 0 24px rgba(123,97,255,0.3),0 0 48px rgba(0,212,255,0.1)"
               : isTop3 ? `0 0 18px ${glowColor}55` : "none",
      opacity: inactive ? 0.72 : 1,
      transition: "all 0.3s ease",
      animation: isTop3 ? `shimmerBorder${rank-1} 2.5s ease-in-out infinite alternate` : "none",
    }}>

      {/* Shimmer sweep on top3 */}
      {isTop3 && (
        <div style={{ position:"absolute", inset:0, borderRadius:18, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(120deg,transparent 30%,${rankColor}0e 50%,transparent 70%)`, animation:`shimmerSlide 3s ease-in-out ${(rank-1)*0.5}s infinite` }} />
        </div>
      )}

      {/* Crown for #1 */}
      {rank === 1 && (
        <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", fontSize:20, animation:"crownFloat 1.5s ease-in-out infinite alternate", zIndex:10, pointerEvents:"none" }}>👑</div>
      )}

      {/* Rank */}
      <div style={{ minWidth: isTop3 ? 44 : 36, textAlign:"center", flexShrink:0 }}>
        {isTop3
          ? <div style={{ fontSize:28, textShadow:`0 0 16px ${rankColor}` }}>{MEDALS[rank-1]}<div style={{ fontSize:10, color:rankColor, fontWeight:700 }}>#{rank}</div></div>
          : <div style={{ fontSize:15, fontWeight:800, color:rankColor, fontFamily:"'Bebas Neue',cursive", textShadow: isMe ? "0 0 10px rgba(167,139,250,0.5)" : "none" }}>#{rank}</div>
        }
      </div>

      {/* Avatar */}
      <div style={{
        flexShrink:0, borderRadius:"50%", overflow:"hidden",
        width: isTop3 ? 52 : 42, height: isTop3 ? 52 : 42,
        border: `${isTop3 ? 3 : 2}px solid ${isMe ? "rgba(167,139,250,0.7)" : isTop3 ? rankColor : "rgba(255,255,255,0.1)"}`,
        boxShadow: isTop3 ? `0 0 14px ${glowColor}88` : isMe ? "0 0 10px rgba(167,139,250,0.4)" : "none",
        position:"relative",
      }}>
        <AvatarDisplay avatar={avatarKey} photoURL={photoURL} displayName={name} size={isTop3 ? 52 : 42} />
        {inactive && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>💀</div>}
      </div>

      {/* Main info */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Name row */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" as const, marginBottom:3 }}>
          <span style={{
            fontSize: isTop3 ? 15 : 13, fontWeight:700,
            color: isMe ? "#c4b5fd" : "#e2e8f0",
            textShadow: isMe ? "0 0 10px rgba(167,139,250,0.5)" : "none",
            maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const,
          }}>{name}{isMe ? " (You)" : ""}</span>
          {isTop3 && <span style={{ fontSize:8, padding:"2px 6px", borderRadius:7, background:`${rankColor}22`, color:rankColor, fontWeight:800, border:`1px solid ${rankColor}44` }}>TOP {rank}</span>}
          {inactive && <span style={{ fontSize:8, padding:"2px 5px", borderRadius:6, background:"rgba(100,116,139,0.2)", color:"#64748b", fontWeight:700 }}>💀 Inactive</span>}
          {onFire && !inactive && <span style={{ fontSize:8, padding:"2px 5px", borderRadius:6, background:"rgba(251,146,60,0.18)", color:"#fb923c", fontWeight:700 }}>🔥 On Fire</span>}
        </div>

        {/* Private stats row — NO error count shown */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const, alignItems:"center", marginBottom:4 }}>
          <span style={{ fontSize:11, color:getStreakColor(streak), fontWeight:600 }}>🔥 <AnimatedCounter target={streak} />d streak</span>
          <span style={{ fontSize:11, color:"#64748b" }}>📅 <AnimatedCounter target={daysActive} /> days active</span>
          <span style={{ fontSize:11, color:getRevColor(l.repeatedMistakes ?? 0), fontWeight:600 }}>♻️ <AnimatedCounter target={revPct} />% revised</span>
        </div>

        {/* Subjects covered */}
        {subjects.length > 0 && (
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" as const, marginBottom:4 }}>
            {subjects.map((s:string) => (
              <span key={s} style={{ fontSize:8, padding:"1px 6px", borderRadius:5, background:`${SUBJECT_BADGE_COLORS[s] ?? "#64748b"}18`, color:SUBJECT_BADGE_COLORS[s] ?? "#94a3b8", border:`1px solid ${SUBJECT_BADGE_COLORS[s] ?? "#64748b"}33`, fontWeight:600 }}>{s}</span>
            ))}
          </div>
        )}

        {/* Progress bar toward primary metric */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <MiniBar value={primaryVal} max={maxVal} color={primaryColor} />
          <span style={{ fontSize:9, color:primaryColor, fontWeight:700, flexShrink:0 }}><AnimatedCounter target={primaryVal} /> {primaryLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ─── CONSISTENCY BOARD ────────────────────────────────────────────────────────
function ConsistencyBoard({ leaders, profiles, currentUserId, loading, activeLeague }: any) {
  const inLeague = leaders.filter((l:any) => getNenLeague(l.totalXP ?? 0).id === activeLeague);
  // Sort: streak DESC, inactive penalty, then daysActive
  const sorted = [...inLeague].sort((a, b) => {
    const aInactive = isUserInactive(a), bInactive = isUserInactive(b);
    if (aInactive !== bInactive) return aInactive ? 1 : -1;
    const sa = a.streak ?? 0, sb = b.streak ?? 0;
    if (sa !== sb) return sb - sa;
    return getDaysActive(b) - getDaysActive(a);
  });
  const maxStreak = Math.max(1, ...sorted.map((l:any) => l.streak ?? 0));
  const myRank = sorted.findIndex((l:any) => (l.userId ?? l.id) === currentUserId) + 1;

  if (loading) return <div style={{ textAlign:"center", padding:50, color:"#475569" }}>⏳ Loading warriors...</div>;
  if (sorted.length === 0) return <div style={{ textAlign:"center", padding:50, color:"#475569", fontSize:13 }}>No warriors in this league yet.</div>;

  return (
    <div>
      {/* My rank pill */}
      {myRank > 0 && (
        <div style={{ marginBottom:14, padding:"8px 14px", borderRadius:10, background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.25)", display:"inline-flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12 }}>🔥</span>
          <span style={{ fontSize:12, color:"#fb923c", fontWeight:700 }}>Your consistency rank: <span style={{ color:"#ffd700" }}>#{myRank}</span></span>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {sorted.map((l:any, idx:number) => {
          const uid = l.userId ?? l.id;
          return <LBCard key={uid} l={l} rank={idx+1} isMe={uid===currentUserId} profile={profiles[uid]} boardType="consistency" maxVal={maxStreak} />;
        })}
      </div>
      {sorted.length > 5 && (
        <div style={{ marginTop:10, fontSize:11, color:"#ff2254", fontWeight:700 }}>⬇ DEMOTION ZONE (Bottom 3)</div>
      )}
    </div>
  );
}

// ─── GROWTH BOARD ────────────────────────────────────────────────────────────
function GrowthBoard({ leaders, profiles, currentUserId, loading, activeLeague }: any) {
  const inLeague = leaders.filter((l:any) => getNenLeague(l.totalXP ?? 0).id === activeLeague);
  // Sort: revisionPct DESC, then daysActive, then streak
  const sorted = [...inLeague].sort((a, b) => {
    const aInactive = isUserInactive(a), bInactive = isUserInactive(b);
    if (aInactive !== bInactive) return aInactive ? 1 : -1;
    const pa = getRevisionPct(a), pb = getRevisionPct(b);
    if (pa !== pb) return pb - pa;
    return getDaysActive(b) - getDaysActive(a);
  });
  const maxPct = 100;
  const myRank = sorted.findIndex((l:any) => (l.userId ?? l.id) === currentUserId) + 1;

  if (loading) return <div style={{ textAlign:"center", padding:50, color:"#475569" }}>⏳ Loading warriors...</div>;
  if (sorted.length === 0) return <div style={{ textAlign:"center", padding:50, color:"#475569", fontSize:13 }}>No warriors in this league yet.</div>;

  return (
    <div>
      {myRank > 0 && (
        <div style={{ marginBottom:14, padding:"8px 14px", borderRadius:10, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", display:"inline-flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12 }}>📈</span>
          <span style={{ fontSize:12, color:"#22c55e", fontWeight:700 }}>Your growth rank: <span style={{ color:"#ffd700" }}>#{myRank}</span></span>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {sorted.map((l:any, idx:number) => {
          const uid = l.userId ?? l.id;
          return <LBCard key={uid} l={l} rank={idx+1} isMe={uid===currentUserId} profile={profiles[uid]} boardType="growth" maxVal={maxPct} />;
        })}
      </div>
      {sorted.length > 5 && (
        <div style={{ marginTop:10, fontSize:11, color:"#ff2254", fontWeight:700 }}>⬇ DEMOTION ZONE (Bottom 3)</div>
      )}
    </div>
  );
}

// ─── MAIN LEADERBOARD ─────────────────────────────────────────────────────────
function Leaderboard({ currentUserId }: { currentUserId: string }) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState("enhancer");
  const [activeBoard, setActiveBoard] = useState<"consistency"|"growth">("consistency");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getLeaderboard().then(async data => {
      setLeaders(data);
      const pm: Record<string, any> = {};
      await Promise.all(data.map(async (l: any) => {
        try {
          const snap = await getDoc(doc(db, "userProfiles", l.userId ?? l.id));
          if (snap.exists()) pm[l.userId ?? l.id] = snap.data();
        } catch {}
      }));
      setProfiles(pm);
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    });
  }, []);

  const myEntry = leaders.find(l => (l.userId ?? l.id) === currentUserId);
  const myNen = myEntry ? getNenLeague(myEntry.totalXP ?? 0) : NEN_LEAGUES[0];
  const nextNen = NEN_LEAGUES[NEN_LEAGUES.findIndex(l => l.id === myNen.id) + 1];
  const activeLg = NEN_LEAGUES.find(l => l.id === activeLeague) ?? NEN_LEAGUES[0];

  return (
    <div style={{ paddingBottom:40, opacity:visible?1:0, transition:"opacity 0.6s ease" }}>
      <style>{`
        @keyframes crownFloat { from{transform:translateX(-50%) translateY(0) rotate(-5deg)} to{transform:translateX(-50%) translateY(-6px) rotate(5deg)} }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes shimmerBorder0 { 0%{box-shadow:0 0 20px rgba(255,215,0,0.35)} 100%{box-shadow:0 0 36px rgba(255,215,0,0.65),0 0 60px rgba(255,215,0,0.25)} }
        @keyframes shimmerBorder1 { 0%{box-shadow:0 0 14px rgba(192,192,192,0.25)} 100%{box-shadow:0 0 28px rgba(192,192,192,0.5)} }
        @keyframes shimmerBorder2 { 0%{box-shadow:0 0 14px rgba(205,127,50,0.25)} 100%{box-shadow:0 0 28px rgba(205,127,50,0.5)} }
        @keyframes glowGreen { 0%,100%{text-shadow:0 0 8px #22c55e44} 50%{text-shadow:0 0 18px #22c55e,0 0 36px #22c55e55} }
      `}</style>

      {/* My Nen banner */}
      {myEntry && (
        <div style={{ padding:"12px 16px", borderRadius:14, marginBottom:18, background:`${myNen.color}12`, border:`1px solid ${myNen.color}30`, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" as const }}>
          <span style={{ fontSize:32 }}>{myNen.icon}</span>
          <div style={{ flex:1, minWidth:120 }}>
            <div style={{ fontSize:15, fontWeight:800, color:myNen.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>YOU ARE {myNen.name.toUpperCase()} TYPE</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2, fontStyle:"italic" }}>"{myNen.quote}"</div>
          </div>
          {nextNen && <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontSize:9, color:"#64748b" }}>next:</div><div style={{ fontSize:16 }}>{nextNen.icon}</div><div style={{ fontSize:9, color:nextNen.color, fontWeight:700 }}>{nextNen.name}</div></div>}
        </div>
      )}

      {/* Privacy notice */}
      <div style={{ marginBottom:16, padding:"8px 14px", borderRadius:10, background:"rgba(0,212,255,0.07)", border:"1px solid rgba(0,212,255,0.18)", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:14 }}>🔒</span>
        <span style={{ fontSize:11, color:"#94a3b8" }}>Private board — error counts are <span style={{ color:"#00d4ff", fontWeight:700 }}>never shown</span>. Only streak, days active, and revision % are visible.</span>
      </div>

      {/* League selector */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, color:"#64748b", letterSpacing:1, marginBottom:8 }}>⚡ NEN LEAGUE</div>
        <div style={{ display:"flex", gap:6, overflowX:"auto" as const, paddingBottom:4 }}>
          {NEN_LEAGUES.map(league => {
            const count = leaders.filter(l => getNenLeague(l.totalXP ?? 0).id === league.id).length;
            const isActive = activeLeague === league.id;
            return (
              <button key={league.id} onClick={() => setActiveLeague(league.id)} style={{ flexShrink:0, padding:"7px 12px", borderRadius:10, border:`1px solid ${isActive ? league.color : "rgba(255,255,255,0.08)"}`, background: isActive ? `${league.color}18` : "rgba(255,255,255,0.03)", cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:62, transition:"all 0.2s" }}>
                <span style={{ fontSize:18 }}>{league.icon}</span>
                <span style={{ fontSize:9, fontWeight:700, color: isActive ? league.color : "#475569" }}>{league.name}</span>
                <span style={{ fontSize:8, color:"#334155" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Board toggle */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {([
          { id:"consistency", icon:"🏆", label:"Consistency Board", sub:"ranked by daily streak", color:"#f97316", glow:"rgba(249,115,22,0.4)" },
          { id:"growth",      icon:"📈", label:"Growth Board",      sub:"ranked by revision %",   color:"#22c55e", glow:"rgba(34,197,94,0.4)" },
        ] as const).map(board => {
          const isActive = activeBoard === board.id;
          return (
            <button key={board.id} onClick={() => setActiveBoard(board.id)} style={{
              flex:1, padding:"14px 12px", borderRadius:14, border:`2px solid ${isActive ? board.color : "rgba(255,255,255,0.08)"}`,
              background: isActive ? `${board.color}15` : "rgba(255,255,255,0.03)",
              boxShadow: isActive ? `0 0 20px ${board.glow}` : "none",
              cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s", textAlign:"center" as const,
            }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{board.icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color: isActive ? board.color : "#64748b", letterSpacing:0.5 }}>{board.label}</div>
              <div style={{ fontSize:10, color: isActive ? `${board.color}cc` : "#334155", marginTop:2 }}>{board.sub}</div>
            </button>
          );
        })}
      </div>

      {/* League info strip */}
      <div style={{ padding:"12px 14px", borderRadius:12, marginBottom:16, background:`linear-gradient(135deg,${activeLg.color}12,transparent)`, border:`1px solid ${activeLg.color}28`, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" as const }}>
        <span style={{ fontSize:24 }}>{activeLg.icon}</span>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:14, fontWeight:800, color:activeLg.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>{activeLg.name.toUpperCase()} LEAGUE</span>
          <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" as const }}>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"rgba(34,197,94,0.15)", color:"#22c55e", fontWeight:700 }}>⬆ Top 3 promote</span>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"rgba(255,34,84,0.15)", color:"#ff2254", fontWeight:700 }}>⬇ Bottom 3 demote</span>
          </div>
        </div>
        <div style={{ textAlign:"right", fontSize:10, color:"#64748b" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#00d4ff", fontFamily:"'Bebas Neue',cursive" }}>{leaders.filter(l => getNenLeague(l.totalXP ?? 0).id === activeLeague).length}</div>
          warriors
        </div>
      </div>

      {/* Active board */}
      {activeBoard === "consistency"
        ? <ConsistencyBoard leaders={leaders} profiles={profiles} currentUserId={currentUserId} loading={loading} activeLeague={activeLeague} />
        : <GrowthBoard      leaders={leaders} profiles={profiles} currentUserId={currentUserId} loading={loading} activeLeague={activeLeague} />
      }
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

// ─── BEAUTIFUL MONTH HEAT CALENDAR ───────────────────────────────────────────

function InlineHeatMap({ errors, onDayClick }: { errors: ErrorEntry[]; onDayClick: (date: string) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const countByDay: Record<string, number> = {};
  errors.forEach(e => { if (e.date) countByDay[e.date] = (countByDay[e.date] || 0) + 1; });

  const todayStr = today.toISOString().split("T")[0];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const totalAllTime = errors.length;
  const totalThisMonth = errors.filter(e => e.date?.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`)).length;
  const totalThisYear = errors.filter(e => e.date?.startsWith(String(viewYear))).length;
  const activeDays = Object.keys(countByDay).length;

  const maxCount = Math.max(1, ...Object.values(countByDay));

  const getColor = (count: number, isToday: boolean) => {
    if (isToday && count === 0) return { bg:"rgba(0,212,255,0.12)", border:"2px solid #00d4ff", text:"#00d4ff" };
    if (count === 0) return { bg:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", text:"#475569" };
    const i = count / maxCount;
    if (i < 0.25) return { bg:"rgba(255,34,84,0.15)", border:"1px solid rgba(255,34,84,0.3)", text:"#ff6b8a" };
    if (i < 0.5)  return { bg:"rgba(255,34,84,0.3)",  border:"1px solid rgba(255,34,84,0.5)", text:"#ff2254" };
    if (i < 0.75) return { bg:"rgba(255,34,84,0.5)",  border:"1px solid rgba(255,34,84,0.7)", text:"#fff" };
    return { bg:"#ff2254", border:"1px solid #ff4070", text:"#fff" };
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };

  // Build calendar grid
  const cells: { day: number; iso: string; count: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrev - firstDay + i + 1;
    const pm = viewMonth === 0 ? 11 : viewMonth - 1;
    const py = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = `${py}-${String(pm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ day:d, iso, count:countByDay[iso]||0, isCurrentMonth:false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ day:d, iso, count:countByDay[iso]||0, isCurrentMonth:true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    const iso = `${ny}-${String(nm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ day:d, iso, count:countByDay[iso]||0, isCurrentMonth:false });
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"All Time", value:totalAllTime, icon:"📚", color:"#00d4ff", sub:"total errors" },
          { label:"This Year", value:totalThisYear, icon:"📆", color:"#a78bfa", sub:`in ${viewYear}` },
          { label:"This Month", value:totalThisMonth, icon:"🗓", color:"#ff2254", sub:MONTHS[viewMonth].toLowerCase() },
          { label:"Active Days", value:activeDays, icon:"🔥", color:"#f97316", sub:"days studied" },
        ].map(s => (
          <div key={s.label} style={{ padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:26, fontWeight:900, color:s.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:2, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{s.label} · {s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div style={{ borderRadius:20, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
        {/* Month navigation header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>
          <button onClick={prevMonth} style={{ width:38,height:38,borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94a3b8",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:3 }}>{MONTHS[viewMonth]}</div>
            <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{viewYear} · {totalThisMonth} error{totalThisMonth!==1?"s":""} this month</div>
          </div>
          <button onClick={nextMonth} style={{ width:38,height:38,borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94a3b8",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"12px 16px 6px" }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#334155", letterSpacing:0.5 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, padding:"4px 16px 16px" }}>
          {cells.map((cell, i) => {
            const isToday = cell.iso === todayStr;
            const style = getColor(cell.count, isToday);
            const clickable = cell.isCurrentMonth && cell.count > 0;
            return (
              <div
                key={i}
                onClick={() => clickable && onDayClick(cell.iso)}
                title={cell.count > 0 ? `${cell.iso}: ${cell.count} error${cell.count!==1?"s":""}` : ""}
                style={{
                  aspectRatio:"1",
                  borderRadius:12,
                  background: cell.isCurrentMonth ? style.bg : "transparent",
                  border: cell.isCurrentMonth ? style.border : "none",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  cursor: clickable ? "pointer" : "default",
                  transition:"all 0.15s",
                  opacity: cell.isCurrentMonth ? 1 : 0.2,
                  position:"relative",
                }}
                onMouseEnter={e => { if (clickable) { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.zIndex = "2"; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.zIndex = "1"; }}
              >
                <span style={{ fontSize:13, fontWeight: isToday ? 900 : cell.count > 0 ? 700 : 400, color: cell.isCurrentMonth ? style.text : "#334155", lineHeight:1 }}>{cell.day}</span>
                {cell.isCurrentMonth && cell.count > 0 && (
                  <span style={{ fontSize:9, color:style.text, opacity:0.8, marginTop:2, fontWeight:700 }}>{cell.count}✗</span>
                )}
                {isToday && <div style={{ position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"#00d4ff" }} />}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.05)", flexWrap:"wrap" as const }}>
          <span style={{ fontSize:11, color:"#334155" }}>Intensity:</span>
          {[
            { label:"None", bg:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", color:"#334155" },
            { label:"Low", bg:"rgba(255,34,84,0.15)", border:"1px solid rgba(255,34,84,0.3)", color:"#ff6b8a" },
            { label:"Med", bg:"rgba(255,34,84,0.35)", border:"1px solid rgba(255,34,84,0.5)", color:"#ff2254" },
            { label:"High", bg:"#ff2254", border:"1px solid #ff4070", color:"#fff" },
          ].map(l => (
            <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ width:16,height:16,borderRadius:5,background:l.bg,border:l.border }} />
              <span style={{ fontSize:10,color:"#475569" }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize:11, color:"#475569", marginLeft:4 }}>· Tap a day to see errors</span>
        </div>
      </div>

      {/* Today's highlight */}
      {countByDay[todayStr] > 0 && (
        <div onClick={() => onDayClick(todayStr)} style={{ marginTop:16,padding:"14px 18px",borderRadius:16,background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s" }}>
          <span style={{ fontSize:24 }}>📅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#00d4ff" }}>Today's Errors</div>
            <div style={{ fontSize:11,color:"#475569" }}>{countByDay[todayStr]} mistake{countByDay[todayStr]!==1?"s":""} logged today · tap to review</div>
          </div>
          <span style={{ fontSize:18,color:"#00d4ff" }}>→</span>
        </div>
      )}
    </div>
  );
}

// ─── HEAT CALENDAR TAB LOADER ─────────────────────────────────────────────────

function DayErrorsModal({ date, errors, onClose, onSelectError }: { date:string; errors:ErrorEntry[]; onClose:()=>void; onSelectError:(e:ErrorEntry)=>void }) {
  const dayErrors = errors.filter(e => e.date === date);
  const fmt = new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ width:"100%",maxWidth:520,maxHeight:"88vh",overflowY:"auto",scrollbarWidth:"none" as any }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:"rgba(10,14,26,0.96)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:24,backdropFilter:"blur(24px)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11,color:"#475569",fontWeight:700,letterSpacing:1,marginBottom:4 }}>📅 ERRORS ON</div>
              <div style={{ fontSize:17,fontWeight:800,color:"#e2e8f0" }}>{fmt}</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",fontSize:16,cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          </div>
          {dayErrors.length === 0 ? (
            <div style={{ textAlign:"center",padding:32,color:"#475569" }}>No errors logged this day 🎯</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {dayErrors.map(err => (
                <div key={err.id} onClick={() => { onSelectError(err); }} style={{ padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.08)`,borderLeft:`4px solid ${MASTERY_COLORS[err.masteryStage??"red"]}`,cursor:"pointer",transition:"all 0.2s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.08)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                >
                  <div style={{ display:"flex",gap:6,marginBottom:6,flexWrap:"wrap" as const }}>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:10,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44` }}>{err.subject}</span>
                    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:10,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44` }}>{err.mistakeType}</span>
                    <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.04)",color:"#64748b" }}>{err.difficulty}</span>
                  </div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:2 }}>{err.chapter}</div>
                  {(err as any).questionText && <div style={{ fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>📋 {(err as any).questionText}</div>}
                  <div style={{ fontSize:10,color:"#475569",marginTop:4 }}>Tap to view details →</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeatCalendarLoader({ userId }: { userId: string }) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [selectedError, setSelectedError] = useState<ErrorEntry|null>(null);

  useEffect(() => {
    getErrors(userId).then(e => { setErrors(e); setLoading(false); });
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:"#475569" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🔥</div>
      <div style={{ fontSize:14 }}>Loading heat map...</div>
    </div>
  );

  return (
    <>
      {selectedDate && !selectedError && (
        <DayErrorsModal
          date={selectedDate}
          errors={errors}
          onClose={() => setSelectedDate(null)}
          onSelectError={err => { setSelectedError(err); }}
        />
      )}
      {selectedError && (
        <ErrorDetailModal
          err={selectedError}
          onClose={() => setSelectedError(null)}
        />
      )}
      <InlineHeatMap errors={errors} onDayClick={(date: string) => setSelectedDate(date)} />
    </>
  );
}

// ─── NAVIGATION CONFIG ────────────────────────────────────────────────────────
// Changes: Heat moved to PRIMARY_TABS icon collection, Watch moved to SECONDARY_TABS

const PRIMARY_TABS = [
  { id:"errors",      label:"Learn",  icon:"📝", color:"#ff2254", glow:"rgba(255,34,84,0.5)" },
  { id:"revision",    label:"Review", icon:"🔁", color:"#00d4ff", glow:"rgba(0,212,255,0.5)" },
  { id:"leaderboard", label:"Rank",   icon:"🏆", color:"#ffd700", glow:"rgba(255,215,0,0.5)" },
  { id:"heatmap",     label:"Heat",   icon:"🔥", color:"#f97316", glow:"rgba(249,115,22,0.5)" },
];

const SECONDARY_TABS = [
  { id:"collection",  label:"Watch",  icon:"🎌", color:"#a855f7", glow:"rgba(168,85,247,0.5)" },
  { id:"ai",          label:"AI Hub", icon:"🤖", color:"#a855f7", glow:"rgba(168,85,247,0.5)" },
];

// ─── RESPONSIVE NAV ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function useIsTablet() {
  const [tablet, setTablet] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 && window.innerWidth < 1100 : false);
  useEffect(() => {
    const fn = () => setTablet(window.innerWidth >= 768 && window.innerWidth < 1100);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return tablet;
}

// Side nav for desktop/tablet
function SideNav({ active, setActive }: { active:string; setActive:(t:string)=>void }) {
  const allTabs = [...PRIMARY_TABS, ...SECONDARY_TABS];
  const isTablet = useIsTablet();
  const collapsed = isTablet; // tablets get icon-only side nav

  return (
    <nav style={{
      position:"fixed", left:0, top:0, bottom:0, zIndex:101,
      width: collapsed ? 68 : 200,
      background:"rgba(3,5,12,0.97)", backdropFilter:"blur(28px)",
      borderRight:"1px solid rgba(255,255,255,0.07)",
      display:"flex", flexDirection:"column",
      padding:"0 8px",
      transition:"width 0.25s ease",
      overflow:"hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 0 16px" : "20px 8px 16px",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        marginBottom:8,
        display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "flex-start",
        gap:10,
      }}>
        <span style={{ fontSize:22 }}>⚡</span>
        {!collapsed && (
          <span style={{
            fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:3,
            background:"linear-gradient(135deg,#00d4ff,#ff2254)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            whiteSpace:"nowrap" as const,
          }}>ERRORVERSE</span>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4, overflowY:"auto" as const }}>
        {allTabs.map(t => {
          const isActive = active === t.id;
          return (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              display:"flex", alignItems:"center",
              gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "12px 8px" : "11px 14px",
              borderRadius:12, border:"none",
              background: isActive ? `${t.color}18` : "transparent",
              outline: isActive ? `1px solid ${t.color}40` : "1px solid transparent",
              cursor:"pointer", fontFamily:"inherit",
              transition:"all 0.2s",
              position:"relative" as const,
              width:"100%",
            }}>
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                  width:3, height:28, borderRadius:"0 3px 3px 0",
                  background:t.color,
                  boxShadow:`0 0 12px ${t.glow}`,
                }} />
              )}
              <span style={{
                fontSize:20, lineHeight:1,
                filter: isActive ? `drop-shadow(0 0 8px ${t.glow})` : "none",
                transition:"filter 0.2s",
                flexShrink:0,
              }}>{t.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize:13, fontWeight: isActive ? 700 : 400,
                  color: isActive ? t.color : "#64748b",
                  letterSpacing:0.3, whiteSpace:"nowrap" as const,
                  transition:"color 0.15s",
                }}>{t.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom version tag */}
      {!collapsed && (
        <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8 }}>
          <div style={{ fontSize:10, color:"#1e293b", letterSpacing:1 }}>ERRORVERSE v2.0</div>
          <div style={{ fontSize:9, color:"#0f172a", marginTop:2 }}>Master your Mistakes.</div>
        </div>
      )}
    </nav>
  );
}

// Bottom nav for mobile (unchanged behavior, improved tap targets)
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
                  padding:"12px 20px", borderRadius:14, border:"none",
                  background: isActive ? `${t.color}18` : "rgba(255,255,255,0.04)",
                  outline: isActive ? `1px solid ${t.color}44` : "1px solid rgba(255,255,255,0.06)",
                  cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                }}>
                  <span style={{ fontSize:26, lineHeight:1, filter: isActive ? `drop-shadow(0 0 10px ${t.color})` : "none", transition:"filter 0.2s" }}>{t.icon}</span>
                  <span style={{ fontSize:11, fontWeight: isActive ? 800 : 500, color: isActive ? t.color : "#64748b", letterSpacing:0.3 }}>{t.label}</span>
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
              position:"relative", padding:"6px 2px 10px",
              transition:"all 0.15s",
              WebkitTapHighlightColor:"transparent",
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
          position:"relative", padding:"6px 2px 10px",
          transition:"all 0.15s",
          WebkitTapHighlightColor:"transparent",
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

// ─── RESPONSIVE NAV WRAPPER ───────────────────────────────────────────────────
function ResponsiveNav({ active, setActive }: { active:string; setActive:(t:string)=>void }) {
  const isMobile = useIsMobile();
  if (isMobile) return <BottomNav active={active} setActive={setActive} />;
  return <SideNav active={active} setActive={setActive} />;
}

// ─── MAIN CONTENT AREA (responsive margin for side nav) ──────────────────────
function MainContentArea({ activeTab, pt, user, displayName, userAvatar, userPhoto, xpData, streak, todayCount, quoteIdx, setShowCal, setShowInfo, setShowXPPanel, setShowBadges, setShowProfile, handleEntryAdded, handleXPGained, QUOTES }: any) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const sideWidth = isMobile ? 0 : isTablet ? 68 : 200;
  const bottomPad = isMobile ? 80 : 24;

  return (
    <div style={{
      position:"relative", zIndex:1,
      marginLeft: sideWidth,
      minHeight:"100vh",
      transition:"margin-left 0.25s ease",
    }}>
      <div style={{ maxWidth:880, margin:"0 auto", padding:"0 16px", paddingBottom: bottomPad }}>

        {/* TOP HEADER */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", marginBottom:16, gap:10, flexWrap:"wrap" as const }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:4, background:"linear-gradient(135deg,#00d4ff,#ff2254)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ERRORVERSE</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" as const }}>
            <button onClick={()=>setShowCal(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:20, background:streak>0?"rgba(255,215,0,0.12)":"rgba(255,255,255,0.05)", border:`1px solid ${streak>0?"rgba(255,215,0,0.35)":"rgba(255,255,255,0.08)"}`, cursor:"pointer", fontFamily:"inherit" }}>
              <span style={{ fontSize:13 }}>🔥</span>
              <span style={{ fontSize:12, color:streak>0?"#ffd700":"#475569", fontWeight:700 }}>{streak}d</span>
            </button>
            <button onClick={() => setShowInfo(true)} title="How to use ErrorVerse" style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:20, background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.3)", color:"#fff", fontSize:14, fontWeight:900, cursor:"pointer", fontFamily:"serif" }}>ℹ</button>
            {xpData && (
              <div style={{ display:"flex", alignItems:"center", borderRadius:12, background:"rgba(123,97,255,0.12)", border:"1px solid rgba(123,97,255,0.3)", overflow:"hidden" }}>
                <button onClick={() => setShowXPPanel(true)} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 8px", border:"none", background:"transparent", fontSize:11, color:"#a78bfa", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  <span>⚡</span><span>{xpData.totalXP} · Lv{xpData.level}</span>
                </button>
                <button onClick={() => setShowBadges(true)} style={{ padding:"5px 8px", border:"none", borderLeft:"1px solid rgba(123,97,255,0.3)", background:"transparent", fontSize:14, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center" }}>🏅</button>
              </div>
            )}
            <button onClick={() => setShowProfile(true)} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"3px 10px 3px 3px", cursor:"pointer" }}>
              <AvatarDisplay avatar={userAvatar} photoURL={userPhoto} displayName={displayName} size={28} />
              <span style={{ fontSize:12, color:"#94a3b8", fontWeight:600, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{displayName.split(" ")[0] || "You"}</span>
            </button>
          </div>
        </header>

        {/* Quote */}
        <div style={{ marginBottom:14, minHeight:22 }}>
          <span style={{ fontSize:13, color:"#ffffff", fontWeight:700, fontStyle:"italic", letterSpacing:0.3, textShadow:"0 0 20px rgba(0,212,255,0.3)" }}>"{QUOTES[quoteIdx]}"</span>
        </div>

        {/* Banners */}
        {activeTab==="achievements" && xpData && <LevelBanner xpData={xpData}/>}
        {(activeTab==="errors" || activeTab==="collection") && <StreakBanner todayCount={todayCount} streak={streak}/>}

        {/* Page title */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:28, fontFamily:"'Bebas Neue',cursive", letterSpacing:3, color:"#e2e8f0", margin:0 }}>
            {pt.title.split(" ").map((w:string,i:number,arr:string[])=>
              i===arr.length-1
                ? <span key={i} style={{ color:pt.color }}> {w}</span>
                : <span key={i}>{w} </span>
            )}
          </h1>
        </div>

        {/* Tab content */}
        {activeTab==="errors"       && <ErrorBook userId={user.uid} onEntryAdded={handleEntryAdded} onXP={handleXPGained} xpData={xpData} streak={streak} todayCount={todayCount}/>}
        {activeTab==="revision"     && <SpacedRevision userId={user.uid} onXP={handleXPGained}/>}
        {activeTab==="achievements" && <BadgesPanel earned={xpData?.badges??[]}/>}
        {activeTab==="collection"   && <AnimeCollection userId={user.uid} onEntryAdded={handleEntryAdded}/>}
        {activeTab==="leaderboard"  && <Leaderboard currentUserId={user.uid}/>}
        {activeTab==="ai"           && <AITabLoader userId={user.uid}/>}
        {activeTab==="heatmap"      && <HeatCalendarLoader userId={user.uid}/>}
      </div>
    </div>
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
  const [showBadges, setShowBadges] = useState(false);
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
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 20% 20%, #0d0520 0%, #050810 40%, #020510 70%, #060318 100%)", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(ellipse at 10% 10%, rgba(123,97,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(0,212,255,0.04) 0%, transparent 50%)" }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050810}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        input::placeholder,textarea::placeholder{color:#334155}
        select option{background:#0d1117}
        @keyframes slideInToast{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes popIn{from{transform:translateX(-50%) scale(0.5);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        html{scroll-behavior:smooth;}
        @media(max-width:480px){button{min-height:36px;}}
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

      {showBadges && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)",zIndex:200,display:"flex",flexDirection:"column",padding:16,overflowY:"auto" }} onClick={() => setShowBadges(false)}>
          <div style={{ maxWidth:600,width:"100%",margin:"0 auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h2 style={{ margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:26,letterSpacing:3,color:"#ffd700" }}>🏅 BADGES</h2>
              <button onClick={() => setShowBadges(false)} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",fontSize:18,cursor:"pointer",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>
            <BadgesPanel earned={xpData?.badges??[]} />
          </div>
        </div>
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

      {/* Responsive navigation */}
      <ResponsiveNav active={activeTab} setActive={setActiveTab} />

      {/* Main content — shifts right on desktop/tablet to make room for side nav */}
      <MainContentArea activeTab={activeTab} pt={pt} user={user} displayName={displayName} userAvatar={userAvatar} userPhoto={userPhoto} xpData={xpData} streak={streak} todayCount={todayCount} quoteIdx={quoteIdx} setShowCal={setShowCal} setShowInfo={setShowInfo} setShowXPPanel={setShowXPPanel} setShowBadges={setShowBadges} setShowProfile={setShowProfile} handleEntryAdded={handleEntryAdded} handleXPGained={handleXPGained} QUOTES={QUOTES} />
    </div>
  );
}