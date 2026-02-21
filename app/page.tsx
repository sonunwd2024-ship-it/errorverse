"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { signUp, signIn, logOut, onAuth } from "../lib/auth";
import {
  addError, getErrors, deleteError,
  addCollectionEntry, getCollection, deleteCollectionEntry,
  getStreak, getTodayEntryCount, updateLeaderboard, getLeaderboard,
  getDailyActivityForMonth,
} from "../lib/db";

// ─── ANIME POSTER DATABASE ────────────────────────────────────────────────────
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
  "vagabond":            { posters: ["https://cdn.myanimelist.net/images/manga/2/192959.jpg"], color:"#451a03", accent:"#fed7aa" },
  "reverend insanity":   { posters: ["https://cdn.myanimelist.net/images/manga/3/222995.jpg"], color:"#14532d", accent:"#86efac" },
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

const QUOTES = ["Mistakes are the portals of discovery. — James Joyce","An error doesn't become a mistake until you refuse to correct it.","Every expert was once a beginner. — Helen Hayes","The only real mistake is the one from which we learn nothing. — Henry Ford","Pain is temporary. Glory is forever."];
const MISTAKE_COLORS: Record<string,string> = { Conceptual:"#00d4ff", Calculation:"#ff2254", "Silly mistake":"#ffd700", "Time pressure":"#a855f7" };
const SUBJECT_COLORS: Record<string,string> = { Physics:"#00d4ff", Math:"#ff2254", Chemistry:"#22c55e", Other:"#f97316" };
const STATUS_COLORS: Record<string,string> = { Completed:"#22c55e", Watching:"#00d4ff", Reading:"#ffd700" };

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const pts = Array.from({length:55},()=>({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.3, dx:(Math.random()-.5)*.3, dy:(Math.random()-.5)*.3, col:Math.random()>.5?"#00d4ff":"#ff2254", a:Math.random()*.5+.1 }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.col; ctx.globalAlpha=p.a; ctx.fill(); p.x+=p.dx; p.y+=p.dy; if(p.x<0||p.x>W)p.dx*=-1; if(p.y<0||p.y>H)p.dy*=-1; });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){ const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y); if(d<100){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle="#00d4ff"; ctx.globalAlpha=(1-d/100)*.07; ctx.lineWidth=.5; ctx.stroke(); } }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{ W=c.width=window.innerWidth; H=c.height=window.innerHeight; };
    window.addEventListener("resize",resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
}

// ─── SLIDING POSTER ───────────────────────────────────────────────────────────
function SlidingPoster({posters,color,accent}:{posters:string[];color:string;accent:string}) {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ if(posters.length<=1) return; const t=setInterval(()=>setIdx(i=>(i+1)%posters.length),3000); return()=>clearInterval(t); },[posters.length]);
  return (
    <div style={{position:"relative",height:150,overflow:"hidden",borderRadius:"16px 16px 0 0"}}>
      {posters.map((src,i)=>(
        <img key={src} src={src} alt="" crossOrigin="anonymous"
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",opacity:i===idx?1:0,transition:"opacity 0.8s ease"}}
          onError={e=>{(e.target as HTMLImageElement).style.opacity="0";}} />
      ))}
      <div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,${color}33 0%,rgba(10,14,26,0.92) 100%)`}} />
      {posters.length>1 && (
        <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:2}}>
          {posters.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?16:6,height:6,borderRadius:3,background:i===idx?accent:"rgba(255,255,255,0.35)",cursor:"pointer",transition:"all 0.3s"}} />)}
        </div>
      )}
    </div>
  );
}

// ─── GLASS CARD ───────────────────────────────────────────────────────────────
function GlassCard({children,style={},onClick,hover=true}:any) {
  const [hov,setHov]=useState(false);
  return <div onClick={onClick} onMouseEnter={()=>hover&&setHov(true)} onMouseLeave={()=>hover&&setHov(false)} style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(12px)",border:`1px solid ${hov?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:20,transition:"all 0.3s ease",transform:hov?"translateY(-2px)":"none",boxShadow:hov?"0 8px 32px rgba(0,212,255,0.15)":"0 4px 16px rgba(0,0,0,0.3)",cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────
function PieChart({data}:{data:{label:string;value:number;color:string}[]}) {
  const total=data.reduce((s,d)=>s+d.value,0); let cum=0;
  const slices=data.map(d=>{ const s=cum,e=cum+d.value/total; cum=e; const sa=s*2*Math.PI-Math.PI/2,ea=e*2*Math.PI-Math.PI/2; const x1=50+40*Math.cos(sa),y1=50+40*Math.sin(sa),x2=50+40*Math.cos(ea),y2=50+40*Math.sin(ea); return{...d,d:`M50,50 L${x1},${y1} A40,40 0 ${d.value/total>.5?1:0},1 ${x2},${y2} Z`}; });
  return <svg viewBox="0 0 100 100" style={{width:160,height:160}}>{slices.map((s,i)=><path key={i} d={s.d} fill={s.color} opacity={.85} stroke="#0a0e1a" strokeWidth={.5}><title>{s.label}: {s.value}</title></path>)}</svg>;
}
function BarChart({data}:{data:{label:string;value:number;color:string}[]}) {
  const max=Math.max(...data.map(d=>d.value),1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>{data.map((d,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:10,color:"#94a3b8"}}>{d.value}</div><div style={{width:32,height:`${(d.value/max)*80}px`,background:`linear-gradient(to top,${d.color},${d.color}88)`,borderRadius:"4px 4px 0 0",minHeight:4}} /><div style={{fontSize:9,color:"#64748b",writingMode:"vertical-rl" as const,transform:"rotate(180deg)"}}>{d.label}</div></div>)}</div>;
}

// ─── STREAK CALENDAR ──────────────────────────────────────────────────────────
function StreakCalendar({userId,streak,onClose}:{userId:string;streak:number;onClose:()=>void}) {
  const today=new Date();
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [vd,setVd]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [active,setActive]=useState<Set<string>>(new Set());
  useEffect(()=>{ getDailyActivityForMonth(userId,vd.getFullYear(),vd.getMonth()).then(d=>setActive(new Set(d))); },[userId,vd]);
  const y=vd.getFullYear(),m=vd.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const todayStr=today.toISOString().split("T")[0];
  const days:any[]=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <GlassCard hover={false} style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{margin:0,fontSize:22,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#ffd700"}}>🔥 STREAK CALENDAR</h2>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{textAlign:"center",marginBottom:20,padding:16,background:"rgba(255,215,0,0.08)",borderRadius:12,border:"1px solid rgba(255,215,0,0.2)"}}>
            <div style={{fontSize:56,fontFamily:"'Bebas Neue',cursive",color:"#ffd700",lineHeight:1}}>{streak}</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>day streak</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:6}}>Add 3+ entries daily to keep it alive 🔥</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button onClick={()=>setVd(new Date(y,m-1,1))} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18}}>‹</button>
            <span style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{MONTHS[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1,1))} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"#475569",fontWeight:700,padding:"4px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {days.map((day,i)=>{
              if(!day) return <div key={i}/>;
              const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isToday=ds===todayStr,isActive=active.has(ds),isPast=new Date(ds)<today&&!isToday;
              return <div key={i} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontSize:12,fontWeight:isToday?800:500,background:isActive?"linear-gradient(135deg,#ffd700,#f97316)":isToday?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.03)",border:isToday?"2px solid #00d4ff":"1px solid rgba(255,255,255,0.05)",color:isActive?"#000":isToday?"#00d4ff":isPast?"#334155":"#94a3b8"}}>
                {day}{isActive&&<div style={{fontSize:8,marginTop:1}}>✓</div>}
              </div>;
            })}
          </div>
          <div style={{display:"flex",gap:16,marginTop:16,justifyContent:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:3,background:"linear-gradient(135deg,#ffd700,#f97316)"}}/><span style={{fontSize:11,color:"#64748b"}}>3+ entries</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:3,border:"2px solid #00d4ff"}}/><span style={{fontSize:11,color:"#64748b"}}>Today</span></div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── STREAK BANNER ────────────────────────────────────────────────────────────
function StreakBanner({todayCount,streak}:{todayCount:number;streak:number}) {
  const needed=Math.max(0,3-todayCount),pct=Math.min(100,(todayCount/3)*100),q=todayCount>=3;
  return (
    <GlassCard hover={false} style={{padding:16,marginBottom:20,background:q?"rgba(34,197,94,0.08)":"rgba(255,215,0,0.06)",border:`1px solid ${q?"rgba(34,197,94,0.3)":"rgba(255,215,0,0.2)"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{q?"🔥":"⏳"}</span>
          <span style={{fontSize:13,fontWeight:600,color:q?"#22c55e":"#ffd700"}}>{q?`Streak active! ${streak} day${streak!==1?"s":""}`:`Add ${needed} more entr${needed===1?"y":"ies"} to activate streak!`}</span>
        </div>
        <span style={{fontSize:12,color:"#64748b"}}>{todayCount}/3 today</span>
      </div>
      <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:q?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#ffd700,#f97316)",borderRadius:3,transition:"width 0.5s ease"}} />
      </div>
    </GlassCard>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({onLogin}:{onLogin:(u:any)=>void}) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const inp:any={width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e2e8f0",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const handle=async()=>{
    setError("");setLoading(true);
    try{
      if(mode==="signup"&&!name.trim()){setError("Enter your name.");setLoading(false);return;}
      const u=mode==="signup"?await signUp(email,password,name):await signIn(email,password);
      if(u)onLogin(u);
    }catch(e:any){
      setError(e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"?"Incorrect password.":e.code==="auth/email-already-in-use"?"Email already in use.":e.code==="auth/weak-password"?"Password must be 6+ chars.":"Something went wrong.");
    }
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:48,marginBottom:8}}>⚡</div><h1 style={{fontSize:36,fontFamily:"'Bebas Neue',cursive",letterSpacing:4,background:"linear-gradient(135deg,#00d4ff,#ff2254)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>ERRORVERSE</h1><p style={{color:"#64748b",fontSize:13,marginTop:6}}>Master your mistakes. Own your story.</p></div>
        <GlassCard hover={false} style={{padding:32}}>
          <div style={{display:"flex",gap:8,marginBottom:24}}>{["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?"rgba(255,255,255,0.08)":"transparent",color:mode===m?"#00d4ff":"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:600,borderBottom:mode===m?"2px solid #00d4ff":"2px solid transparent",transition:"all 0.2s"}}>{m==="login"?"Sign In":"Create Account"}</button>)}</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {mode==="signup"&&<input style={inp} placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />}
            <input style={inp} placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input style={inp} placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
            {error&&<div style={{fontSize:12,color:"#ff2254",padding:"8px 12px",background:"rgba(255,34,84,0.1)",borderRadius:8}}>{error}</div>}
            <button onClick={handle} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:loading?"rgba(0,212,255,0.3)":"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:1}}>{loading?"...":mode==="login"?"ENTER THE VERSE":"BEGIN JOURNEY"}</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── ERROR FORM ───────────────────────────────────────────────────────────────
function ErrorForm({onSubmit,onClose}:any) {
  const [form,setForm]=useState({subject:"Physics",chapter:"",questionType:"Numerical",mistakeType:"Conceptual",solution:"",lesson:""});
  const inp:any={width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const set=(k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.value}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}>
        <GlassCard hover={false} style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{margin:0,fontSize:20,color:"#00d4ff",fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>+ NEW ERROR ENTRY</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>SUBJECT</label><select style={{...inp,cursor:"pointer"}} value={form.subject} onChange={set("subject")}>{["Physics","Chemistry","Math","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>CHAPTER</label><input style={inp} placeholder="e.g. Kinematics" value={form.chapter} onChange={set("chapter")} /></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>QUESTION TYPE</label><select style={{...inp,cursor:"pointer"}} value={form.questionType} onChange={set("questionType")}>{["Numerical","Theory","Proof","MCQ"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>MISTAKE TYPE</label><select style={{...inp,cursor:"pointer"}} value={form.mistakeType} onChange={set("mistakeType")}>{["Conceptual","Calculation","Silly mistake","Time pressure"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>CORRECT SOLUTION</label><textarea style={{...inp,height:80,resize:"vertical"}} placeholder="Write the correct approach..." value={form.solution} onChange={set("solution")} /></div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>LESSON LEARNED 💡</label><textarea style={{...inp,height:60,resize:"vertical"}} placeholder="What will you remember next time?" value={form.lesson} onChange={set("lesson")} /></div>
            <button onClick={()=>{onSubmit({...form,date:new Date().toISOString().split("T")[0]});onClose();}} style={{padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ff2254,#ff6b35)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1}}>RECORD MISTAKE</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── COLLECTION FORM (proper form, no more prompt!) ───────────────────────────
function CollectionForm({onSubmit,onClose}:any) {
  const [form,setForm]=useState({title:"",type:"Anime",status:"Watching",rating:8,genre:"Action",notes:"",powerLevel:5000});
  const inp:any={width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const set=(k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.type==="number"?Number(e.target.value):e.target.value}));
  const match=findAnimePoster(form.title);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto"}}>
        <GlassCard hover={false} style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{margin:0,fontSize:20,color:"#a855f7",fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>🎌 ADD TO COLLECTION</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button></div>
          {/* Poster preview */}
          {match&&(
            <div style={{marginBottom:16,borderRadius:10,overflow:"hidden",height:80,position:"relative" as const}}>
              <img src={match.posters[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.7),transparent)",display:"flex",alignItems:"center",padding:"0 16px"}}>
                <span style={{color:match.accent,fontWeight:700,fontSize:13}}>✦ Poster matched!</span>
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>TITLE *</label><input style={inp} placeholder="e.g. Naruto, One Piece, Berserk..." value={form.title} onChange={set("title")} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>TYPE</label><select style={{...inp,cursor:"pointer"}} value={form.type} onChange={set("type")}>{["Anime","Manga","Manhwa","Novel"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>STATUS</label><select style={{...inp,cursor:"pointer"}} value={form.status} onChange={set("status")}>{["Watching","Reading","Completed","On Hold","Dropped"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>GENRE</label><select style={{...inp,cursor:"pointer"}} value={form.genre} onChange={set("genre")}>{["Action","Adventure","Fantasy","Romance","Horror","Psychological","Isekai","Slice of Life","Sports","Sci-Fi","Mystery","Shonen","Seinen","Shoujo"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>RATING (1-10)</label><input style={inp} type="number" min={1} max={10} value={form.rating} onChange={set("rating")} /></div>
            </div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>POWER LEVEL ⚡</label><input style={inp} type="number" min={0} max={9999} value={form.powerLevel} onChange={set("powerLevel")} /><div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:`${(form.powerLevel/9999)*100}%`,background:"linear-gradient(90deg,#a855f7,#00d4ff)",borderRadius:2,transition:"width 0.3s"}}/></div></div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>NOTES</label><textarea style={{...inp,height:60,resize:"vertical"}} placeholder="Your thoughts..." value={form.notes} onChange={set("notes")} /></div>
            <button disabled={!form.title.trim()} onClick={()=>{onSubmit({title:form.title.trim(),type:form.type,status:form.status,rating:form.rating,tags:[form.genre],notes:form.notes,powerLevel:form.powerLevel});onClose();}} style={{padding:"12px",borderRadius:10,border:"none",background:form.title.trim()?"linear-gradient(135deg,#ff2254,#a855f7)":"rgba(255,255,255,0.1)",color:form.title.trim()?"#fff":"#475569",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:form.title.trim()?"pointer":"not-allowed",letterSpacing:1}}>ADD TO COLLECTION</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function Leaderboard() {
  const [leaders,setLeaders]=useState<any[]>([]),[loading,setLoading]=useState(true);
  useEffect(()=>{getLeaderboard().then(d=>{setLeaders(d);setLoading(false);});},[]);
  const MEDALS=["🥇","🥈","🥉"],rc=["#ffd700","#c0c0c0","#cd7f32"];
  return (
    <div style={{paddingBottom:40}}>
      <div style={{padding:"12px 16px",borderRadius:10,marginBottom:20,background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)"}}><span style={{fontSize:13,color:"#94a3b8"}}>🏆 Ranked by <strong style={{color:"#00d4ff"}}>fewest repeated mistakes</strong></span></div>
      {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}>Loading...</div>:leaders.length===0?<div style={{textAlign:"center",padding:60}}><div style={{fontSize:48,marginBottom:12}}>🏆</div><div style={{fontSize:16,color:"#64748b"}}>No one yet! Add 3+ entries to appear.</div></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {leaders.map((l:any)=>(
            <GlassCard key={l.id} style={{padding:16,border:l.rank<=3?`1px solid ${rc[l.rank-1]}44`:undefined}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:l.rank<=3?28:14,minWidth:40,textAlign:"center",color:l.rank<=3?rc[l.rank-1]:"#475569",fontWeight:800,fontFamily:"'Bebas Neue',cursive"}}>{l.rank<=3?MEDALS[l.rank-1]:`#${l.rank}`}</div>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#ff2254)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0}}>{(l.displayName||"?")[0].toUpperCase()}</div>
                <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{l.displayName}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{l.totalErrors} errors • 🔥 {l.streak} day streak</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:l.repeatedMistakes===0?"#22c55e":"#ff2254",fontFamily:"'Bebas Neue',cursive"}}>{l.repeatedMistakes}</div><div style={{fontSize:10,color:"#64748b"}}>repeated</div></div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ERROR BOOK ───────────────────────────────────────────────────────────────
function ErrorBook({userId,onUpdate}:{userId:string;onUpdate:()=>void}) {
  const [errors,setErrors]=useState<any[]>([]),[showForm,setShowForm]=useState(false),[fs,setFs]=useState("All"),[fm,setFm]=useState("All"),[search,setSearch]=useState(""),[loading,setLoading]=useState(true);
  useEffect(()=>{getErrors(userId).then(d=>{setErrors(d);setLoading(false);});},[userId]);
  const handleAdd=async(form:any)=>{ const ref=await addError(userId,form); setErrors(p=>[{id:ref.id,...form},...p]); onUpdate(); };
  const handleDel=async(id:string)=>{ await deleteError(id); setErrors(p=>p.filter(e=>e.id!==id)); };
  const filtered=errors.filter((e:any)=>{ if(fs!=="All"&&e.subject!==fs)return false; if(fm!=="All"&&e.mistakeType!==fm)return false; if(search&&!e.chapter?.toLowerCase().includes(search.toLowerCase())&&!e.subject?.toLowerCase().includes(search.toLowerCase()))return false; return true; });
  const mc=errors.reduce((a:any,e:any)=>{a[e.mistakeType]=(a[e.mistakeType]||0)+1;return a;},{});
  const sc=errors.reduce((a:any,e:any)=>{a[e.subject]=(a[e.subject]||0)+1;return a;},{});
  const mr=Object.entries(mc).sort((a:any,b:any)=>b[1]-a[1])[0] as [string,number]|undefined;
  const pieData=Object.entries(mc).map(([k,v])=>({label:k,value:v as number,color:MISTAKE_COLORS[k]||"#888"}));
  const barData=Object.entries(sc).map(([k,v])=>({label:k,value:v as number,color:SUBJECT_COLORS[k]||"#888"}));
  const chip=(a:boolean,c:string)=>({padding:"5px 12px",borderRadius:20,border:`1px solid ${a?c:"rgba(255,255,255,0.1)"}`,background:a?`${c}22`:"transparent",color:a?c:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"});
  const tw=errors.filter((e:any)=>(new Date().getTime()-new Date(e.date).getTime())/86400000<=7).length;
  return (
    <div style={{paddingBottom:40}}>
      {showForm&&<ErrorForm onSubmit={handleAdd} onClose={()=>setShowForm(false)} />}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[{label:"Total Errors",value:errors.length,icon:"📝",color:"#00d4ff"},{label:"This Week",value:tw,icon:"📅",color:"#ff2254"},{label:"Resolved",value:Math.floor(errors.length*.6),icon:"✅",color:"#22c55e"}].map(s=>(
          <GlassCard key={s.label} style={{padding:16,textAlign:"center"}}><div style={{fontSize:24}}>{s.icon}</div><div style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>{s.value}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{s.label}</div></GlassCard>
        ))}
      </div>
      {mr&&<div style={{padding:"12px 16px",borderRadius:10,marginBottom:16,background:"rgba(255,34,84,0.1)",border:"1px solid rgba(255,34,84,0.3)",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>⚠️</span><span style={{fontSize:13,color:"#ff8099"}}>Most repeated: <strong style={{color:"#ff2254"}}>{mr[0]}</strong> ({mr[1]} times)</span></div>}
      {pieData.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <GlassCard style={{padding:20}}><h3 style={{margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1}}>MISTAKE BREAKDOWN</h3><div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" as const}}><PieChart data={pieData}/><div style={{display:"flex",flexDirection:"column",gap:8}}>{pieData.map(d=><div key={d.label} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:d.color}}/><span style={{fontSize:12,color:"#94a3b8"}}>{d.label}</span><span style={{fontSize:12,color:d.color,fontWeight:700}}>{d.value}</span></div>)}</div></div></GlassCard>
          <GlassCard style={{padding:20}}><h3 style={{margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1}}>SUBJECT DISTRIBUTION</h3><BarChart data={barData}/></GlassCard>
        </div>
      )}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input style={{flex:1,minWidth:160,padding:"9px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit"}} placeholder="🔍 Search errors..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={()=>setShowForm(true)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Error</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const}}>
        {["All","Physics","Chemistry","Math","Other"].map(s=><button key={s} style={chip(fs===s,"#00d4ff")} onClick={()=>setFs(s)}>{s}</button>)}
        <span style={{borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px"}}/>
        {["All","Conceptual","Calculation","Silly mistake","Time pressure"].map(m=><button key={m} style={chip(fm===m,"#ff2254")} onClick={()=>setFm(m)}>{m}</button>)}
      </div>
      {loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}>Loading...</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569"}}>No errors found. Clean slate! 🎯</div>}
          {filtered.map((err:any)=>(
            <GlassCard key={err.id} style={{padding:16}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap" as const}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap" as const}}>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:11,background:`${SUBJECT_COLORS[err.subject]||"#888"}22`,color:SUBJECT_COLORS[err.subject]||"#888",border:`1px solid ${SUBJECT_COLORS[err.subject]||"#888"}44`}}>{err.subject}</span>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:11,background:`${MISTAKE_COLORS[err.mistakeType]||"#888"}22`,color:MISTAKE_COLORS[err.mistakeType]||"#888",border:`1px solid ${MISTAKE_COLORS[err.mistakeType]||"#888"}44`}}>{err.mistakeType}</span>
                  </div>
                  <div style={{fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{err.chapter}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>{err.solution}</div>
                  {err.lesson&&<div style={{fontSize:12,color:"#ffd700",borderLeft:"2px solid #ffd70044",paddingLeft:8}}>💡 {err.lesson}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                  <div style={{fontSize:11,color:"#475569"}}>{err.date}</div>
                  <button onClick={()=>handleDel(err.id)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.1)",color:"#ff2254",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
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
function AnimeCollection({userId,onUpdate}:{userId:string;onUpdate:()=>void}) {
  const [col,setCol]=useState<any[]>([]),[showForm,setShowForm]=useState(false),[ft,setFt]=useState("All"),[fst,setFst]=useState("All"),[loading,setLoading]=useState(true);
  useEffect(()=>{getCollection(userId).then(d=>{setCol(d);setLoading(false);});},[userId]);
  const handleAdd=async(entry:any)=>{ const ref=await addCollectionEntry(userId,entry); setCol(p=>[{id:ref.id,...entry},...p]); onUpdate(); };
  const handleDel=async(id:string)=>{ await deleteCollectionEntry(id); setCol(p=>p.filter(e=>e.id!==id)); };
  const filtered=col.filter(a=>{ if(ft!=="All"&&a.type!==ft)return false; if(fst!=="All"&&a.status!==fst)return false; return true; });
  const chip=(a:boolean,c:string)=>({padding:"5px 12px",borderRadius:20,border:`1px solid ${a?c:"rgba(255,255,255,0.1)"}`,background:a?`${c}22`:"transparent",color:a?c:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"});
  return (
    <div style={{paddingBottom:40}}>
      {showForm&&<CollectionForm onSubmit={handleAdd} onClose={()=>setShowForm(false)} />}
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
        {[{label:"Total",value:col.length,icon:"📚",color:"#a855f7"},{label:"Anime",value:col.filter(a=>a.type==="Anime").length,icon:"📺",color:"#00d4ff"},{label:"Manga/Other",value:col.filter(a=>a.type!=="Anime").length,icon:"📖",color:"#ff2254"},{label:"Completed",value:col.filter(a=>a.status==="Completed").length,icon:"✅",color:"#22c55e"}].map(s=>(
          <GlassCard key={s.label} style={{padding:16,textAlign:"center"}}><div style={{fontSize:22}}>{s.icon}</div><div style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>{s.value}</div><div style={{fontSize:11,color:"#64748b"}}>{s.label}</div></GlassCard>
        ))}
      </div>
      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const,alignItems:"center"}}>
        {["All","Anime","Manga","Manhwa","Novel"].map(t=><button key={t} style={chip(ft===t,"#00d4ff")} onClick={()=>setFt(t)}>{t}</button>)}
        <span style={{borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px"}}/>
        {["All","Watching","Reading","Completed","On Hold","Dropped"].map(s=><button key={s} style={chip(fst===s,"#ff2254")} onClick={()=>setFst(s)}>{s}</button>)}
        <button onClick={()=>setShowForm(true)} style={{marginLeft:"auto",padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#ff2254,#a855f7)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
      </div>
      {/* Cards */}
      {loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}>Loading...</div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569",gridColumn:"1/-1"}}>No entries yet! Click "+ Add Entry" 🎌</div>}
          {filtered.map((item,idx)=>{
            const match=findAnimePoster(item.title||"");
            const fb=DEFAULT_THEMES[idx%DEFAULT_THEMES.length];
            const accent=match?match.accent:fb.accent;
            // Safe fallbacks for old entries that might not have all fields
            const rating=item.rating??8;
            const powerLevel=item.powerLevel??5000;
            const tags=item.tags||[item.genre].filter(Boolean)||["Action"];
            const status=item.status||"Watching";
            const sc=STATUS_COLORS[status]||"#94a3b8";
            return (
              <GlassCard key={item.id} style={{padding:0,overflow:"hidden",border:"none"}}>
                {/* Poster banner */}
                <div style={{position:"relative" as const}}>
                  {match?(
                    <SlidingPoster posters={match.posters} color={match.color} accent={match.accent}/>
                  ):(
                    <div style={{height:150,background:fb.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative" as const,overflow:"hidden",borderRadius:"16px 16px 0 0"}}>
                      <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.02) 10px,rgba(255,255,255,0.02) 11px)"}}/>
                      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${accent}55,transparent)`}}/>
                      <span style={{fontSize:52,filter:`drop-shadow(0 0 20px ${accent})`,position:"relative",zIndex:1}}>{fb.emoji}</span>
                    </div>
                  )}
                  {/* Badges */}
                  <span style={{position:"absolute",top:10,right:10,padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:`${sc}33`,color:sc,border:`1px solid ${sc}55`,backdropFilter:"blur(4px)"}}>{status}</span>
                  <span style={{position:"absolute",bottom:10,left:10,padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:"rgba(0,0,0,0.65)",color:"#94a3b8",backdropFilter:"blur(4px)"}}>{item.type||"Anime"}</span>
                  {match&&<span style={{position:"absolute",bottom:10,right:10,padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:`${accent}33`,color:accent,backdropFilter:"blur(4px)"}}>✦ MATCHED</span>}
                </div>
                {/* Body */}
                <div style={{padding:16,background:"rgba(10,14,26,0.97)"}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>{item.title}</div>
                  {/* Tags */}
                  <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginBottom:10}}>
                    {tags.map((tag:string)=><span key={tag} style={{padding:"2px 8px",borderRadius:12,fontSize:10,background:`${accent}18`,color:accent,border:`1px solid ${accent}33`}}>{tag}</span>)}
                  </div>
                  {/* Rating stars */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",gap:2}}>{Array.from({length:10},(_,i)=><span key={i} style={{fontSize:11,color:i<rating?"#ffd700":"#334155"}}>★</span>)}</div>
                    <span style={{fontSize:12,fontWeight:700,color:"#ffd700"}}>{rating}/10</span>
                  </div>
                  {/* Power level */}
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:10,color:"#64748b"}}>⚡ POWER LEVEL</span><span style={{fontSize:11,fontWeight:700,color:accent}}>{powerLevel.toLocaleString()}</span></div>
                    <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(powerLevel/9999)*100}%`,background:`linear-gradient(90deg,${accent},#ff6b35)`,borderRadius:3,transition:"width 0.5s"}}/></div>
                  </div>
                  {/* Notes */}
                  {item.notes&&<div style={{fontSize:11,color:"#64748b",borderLeft:`2px solid ${accent}44`,paddingLeft:8,marginBottom:10,fontStyle:"italic"}}>{item.notes}</div>}
                  {/* Delete */}
                  <button onClick={()=>handleDel(item.id)} style={{width:"100%",padding:"7px",borderRadius:8,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.08)",color:"#ff2254",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>🗑 Remove</button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState<any>(null),[authLoading,setAuthLoading]=useState(true);
  const [activeTab,setActiveTab]=useState("errors"),[quoteIdx,setQuoteIdx]=useState(0);
  const [streak,setStreak]=useState(0),[todayCount,setTodayCount]=useState(0);
  const [showCal,setShowCal]=useState(false);

  const refreshStats=async(uid:string,name:string)=>{
    const [s,t]=await Promise.all([getStreak(uid),getTodayEntryCount(uid)]);
    setStreak(s); setTodayCount(t);
    try{
      const errors=await getErrors(uid);
      const mc:Record<string,number>={};
      errors.forEach((e:any)=>{mc[e.mistakeType]=(mc[e.mistakeType]||0)+1;});
      const repeated=Object.values(mc).filter(v=>v>1).reduce((a,b)=>a+b,0);
      await updateLeaderboard(uid,name,errors.length,repeated,s);
    }catch{}
  };

  useEffect(()=>{
    const unsub=onAuth(async u=>{ setUser(u); setAuthLoading(false); if(u) refreshStats(u.uid,u.displayName||u.email||"Anonymous"); });
    return()=>unsub();
  },[]);
  useEffect(()=>{const i=setInterval(()=>setQuoteIdx(q=>(q+1)%QUOTES.length),5000);return()=>clearInterval(i);},[]);

  if(authLoading) return <div style={{minHeight:"100vh",background:"#050810",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:48}}>⚡</div></div>;
  if(!user) return (
    <div style={{minHeight:"100vh",background:"#050810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}input::placeholder,textarea::placeholder{color:#334155}select option{background:#0d1117}`}</style>
      <Particles/><div style={{position:"relative",zIndex:1}}><AuthScreen onLogin={setUser}/></div>
    </div>
  );

  const TABS=[{id:"errors",label:"Error Book",icon:"📝"},{id:"collection",label:"Collection",icon:"🎌"},{id:"leaderboard",label:"Leaderboard",icon:"🏆"}];

  return (
    <div style={{minHeight:"100vh",background:"#050810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050810}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}input::placeholder,textarea::placeholder{color:#334155}select option{background:#0d1117}`}</style>
      <Particles/>
      {showCal&&<StreakCalendar userId={user.uid} streak={streak} onClose={()=>setShowCal(false)}/>}
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 16px"}}>
        {/* Header */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>⚡</span><span style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:4,background:"linear-gradient(135deg,#00d4ff,#ff2254)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ERRORVERSE</span></div>
          <div style={{flex:1,margin:"0 20px",overflow:"hidden"}}><span style={{fontSize:11,color:"#475569",whiteSpace:"nowrap" as const,fontStyle:"italic"}}>"{QUOTES[quoteIdx]}"</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Clickable streak → opens calendar */}
            <button onClick={()=>setShowCal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:streak>0?"rgba(255,215,0,0.12)":"rgba(255,255,255,0.05)",border:`1px solid ${streak>0?"rgba(255,215,0,0.35)":"rgba(255,255,255,0.08)"}`,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
              <span style={{fontSize:14}}>🔥</span><span style={{fontSize:12,color:streak>0?"#ffd700":"#475569",fontWeight:700}}>{streak}d streak</span>
            </button>
            {/* Today counter */}
            <div style={{padding:"5px 10px",borderRadius:12,background:todayCount>=3?"rgba(34,197,94,0.12)":"rgba(0,212,255,0.08)",border:`1px solid ${todayCount>=3?"rgba(34,197,94,0.3)":"rgba(0,212,255,0.2)"}`,fontSize:11,color:todayCount>=3?"#22c55e":"#00d4ff",fontWeight:700}}>{todayCount}/3 ✓</div>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#ff2254)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{(user.displayName||user.email||"?")[0].toUpperCase()}</div>
            <button onClick={()=>logOut()} style={{background:"none",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Logout</button>
          </div>
        </header>

        {/* Streak banner */}
        {(activeTab==="errors"||activeTab==="collection")&&<StreakBanner todayCount={todayCount} streak={streak}/>}

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:24,padding:"4px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",width:"fit-content"}}>
          {TABS.map(tab=><button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",background:activeTab===tab.id?"rgba(255,255,255,0.08)":"transparent",color:activeTab===tab.id?"#e2e8f0":"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:activeTab===tab.id?600:400,transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}><span>{tab.icon}</span><span>{tab.label}</span></button>)}
        </div>

        {/* Page title */}
        <div style={{marginBottom:20}}>
          {activeTab==="errors"&&<h1 style={{fontSize:32,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#e2e8f0"}}>DAILY <span style={{color:"#ff2254"}}>ERROR</span> BOOK</h1>}
          {activeTab==="collection"&&<h1 style={{fontSize:32,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#e2e8f0"}}>ANIME <span style={{color:"#a855f7"}}>COLLECTION</span></h1>}
          {activeTab==="leaderboard"&&<h1 style={{fontSize:32,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#e2e8f0"}}>🏆 <span style={{color:"#ffd700"}}>LEADERBOARD</span></h1>}
        </div>

        {activeTab==="errors"&&<ErrorBook userId={user.uid} onUpdate={()=>refreshStats(user.uid,user.displayName||user.email||"Anonymous")}/>}
        {activeTab==="collection"&&<AnimeCollection userId={user.uid} onUpdate={()=>refreshStats(user.uid,user.displayName||user.email||"Anonymous")}/>}
        {activeTab==="leaderboard"&&<Leaderboard/>}
      </div>
    </div>
  );
}