"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { signUp, signIn, logOut, onAuth } from "../lib/auth";
import {
  addError, getErrors, deleteError,
  addCollectionEntry, getCollection, deleteCollectionEntry,
  recordActivityDate, getStreak,
} from "../lib/db";

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let W = (canvas.width = window.innerWidth), H = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 60 }, () => ({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3, dx: (Math.random()-0.5)*0.3, dy: (Math.random()-0.5)*0.3, color: Math.random()>0.5?"#00d4ff":"#ff2254", alpha: Math.random()*0.5+0.1 }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha; ctx.fill(); p.x+=p.dx; p.y+=p.dy; if(p.x<0||p.x>W)p.dx*=-1; if(p.y<0||p.y>H)p.dy*=-1; });
      for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++) { const d=Math.hypot(particles[i].x-particles[j].x,particles[i].y-particles[j].y); if(d<100){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle="#00d4ff";ctx.globalAlpha=(1-d/100)*0.08;ctx.lineWidth=0.5;ctx.stroke();} }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; };
    window.addEventListener("resize",resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none" }} />;
}

const QUOTES = ["Mistakes are the portals of discovery. — James Joyce","An error doesn't become a mistake until you refuse to correct it.","Every expert was once a beginner. — Helen Hayes","The only real mistake is the one from which we learn nothing. — Henry Ford","Pain is temporary. Glory is forever."];
const MISTAKE_COLORS: Record<string,string> = { Conceptual:"#00d4ff", Calculation:"#ff2254", "Silly mistake":"#ffd700", "Time pressure":"#a855f7" };
const SUBJECT_COLORS: Record<string,string> = { Physics:"#00d4ff", Math:"#ff2254", Chemistry:"#22c55e", Other:"#f97316" };
const STATUS_COLORS: Record<string,string> = { Completed:"#22c55e", Watching:"#00d4ff", Reading:"#ffd700", Planned:"#a855f7", Dropped:"#ff2254", "On Hold":"#f97316" };
const GENRES = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Mystery","Romance","Sci-Fi","Slice of Life","Sports","Thriller","Supernatural","Mecha","Isekai","Psychological"];

function PieChart({ data }: { data: { label:string; value:number; color:string }[] }) {
  const total = data.reduce((s,d)=>s+d.value,0); let cum=0;
  const slices = data.map(d => { const s=cum, e=cum+d.value/total; cum=e; const sa=s*2*Math.PI-Math.PI/2, ea=e*2*Math.PI-Math.PI/2; const x1=50+40*Math.cos(sa),y1=50+40*Math.sin(sa),x2=50+40*Math.cos(ea),y2=50+40*Math.sin(ea); return {...d,d:`M50,50 L${x1},${y1} A40,40 0 ${d.value/total>0.5?1:0},1 ${x2},${y2} Z`}; });
  return <svg viewBox="0 0 100 100" style={{width:160,height:160}}>{slices.map((s,i)=><path key={i} d={s.d} fill={s.color} opacity={0.85} stroke="#0a0e1a" strokeWidth={0.5}><title>{s.label}: {s.value}</title></path>)}</svg>;
}

function BarChart({ data }: { data: { label:string; value:number; color:string }[] }) {
  const max = Math.max(...data.map(d=>d.value),1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>{data.map((d,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:10,color:"#94a3b8"}}>{d.value}</div><div style={{width:32,height:`${(d.value/max)*80}px`,background:`linear-gradient(to top,${d.color},${d.color}88)`,borderRadius:"4px 4px 0 0",minHeight:4}}/><div style={{fontSize:9,color:"#64748b",writingMode:"vertical-rl" as const,transform:"rotate(180deg)"}}>{d.label}</div></div>)}</div>;
}

function GlassCard({ children, style={}, onClick, hover=true }: any) {
  const [hovered,setHovered] = useState(false);
  return <div onClick={onClick} onMouseEnter={()=>hover&&setHovered(true)} onMouseLeave={()=>hover&&setHovered(false)} style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(12px)",border:`1px solid ${hovered?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:20,transition:"all 0.3s ease",transform:hovered?"translateY(-2px)":"none",boxShadow:hovered?"0 8px 32px rgba(0,212,255,0.15)":"0 4px 16px rgba(0,0,0,0.3)",cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}

function AuthScreen({ onLogin }: { onLogin:(u:any)=>void }) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const inputStyle = {width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e2e8f0",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      let user; if(mode==="signup"){if(!name.trim()){setError("Please enter your name.");setLoading(false);return;} user=await signUp(email,password,name);}else{user=await signIn(email,password);} onLogin(user);
    } catch(e:any) { setError(e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"?"Incorrect password.":e.code==="auth/email-already-in-use"?"Email already in use.":e.code==="auth/weak-password"?"Min 6 characters.":e.code==="auth/invalid-email"?"Invalid email.":"Something went wrong."); }
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>⚡</div>
          <h1 style={{fontSize:36,fontFamily:"'Bebas Neue',cursive",letterSpacing:4,background:"linear-gradient(135deg,#00d4ff,#ff2254)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>ERRORVERSE</h1>
          <p style={{color:"#64748b",fontSize:13,marginTop:6}}>Master your mistakes. Own your story.</p>
        </div>
        <GlassCard hover={false} style={{padding:32}}>
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?"rgba(255,255,255,0.08)":"transparent",color:mode===m?"#00d4ff":"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:600,borderBottom:mode===m?"2px solid #00d4ff":"2px solid transparent",transition:"all 0.2s"}}>{m==="login"?"Sign In":"Create Account"}</button>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {mode==="signup"&&<input style={inputStyle} placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)}/>}
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
            {error&&<div style={{fontSize:12,color:"#ff2254",padding:"8px 12px",background:"rgba(255,34,84,0.1)",borderRadius:8,border:"1px solid rgba(255,34,84,0.2)"}}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:loading?"rgba(0,212,255,0.3)":"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:1,boxShadow:"0 0 20px rgba(0,212,255,0.3)"}}>
              {loading?"...":mode==="login"?"ENTER THE VERSE":"BEGIN JOURNEY"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ErrorForm({ onSubmit, onClose }: any) {
  const [form,setForm]=useState({subject:"Physics",chapter:"",questionType:"Numerical",mistakeType:"Conceptual",solution:"",lesson:""});
  const inputStyle = {width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  const set = (k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.value}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}>
        <GlassCard hover={false} style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{margin:0,fontSize:20,color:"#00d4ff",fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>+ NEW ERROR ENTRY</h2>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>SUBJECT</label><select style={{...inputStyle,cursor:"pointer"}} value={form.subject} onChange={set("subject")}>{["Physics","Chemistry","Math","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>CHAPTER</label><input style={inputStyle} placeholder="e.g. Kinematics" value={form.chapter} onChange={set("chapter")}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>QUESTION TYPE</label><select style={{...inputStyle,cursor:"pointer"}} value={form.questionType} onChange={set("questionType")}>{["Numerical","Theory","Proof","MCQ"].map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>MISTAKE TYPE</label><select style={{...inputStyle,cursor:"pointer"}} value={form.mistakeType} onChange={set("mistakeType")}>{["Conceptual","Calculation","Silly mistake","Time pressure"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>CORRECT SOLUTION</label><textarea style={{...inputStyle,height:80,resize:"vertical"}} placeholder="Write the correct approach..." value={form.solution} onChange={set("solution")}/></div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>LESSON LEARNED 💡</label><textarea style={{...inputStyle,height:60,resize:"vertical"}} placeholder="What will you remember next time?" value={form.lesson} onChange={set("lesson")}/></div>
            <button onClick={()=>{onSubmit({...form,date:new Date().toISOString().split("T")[0]});onClose();}} style={{padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ff2254,#ff6b35)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1}}>RECORD MISTAKE</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ErrorBook({ userId, onActivityAdded }: { userId:string; onActivityAdded:()=>void }) {
  const [errors,setErrors]=useState<any[]>([]),[showForm,setShowForm]=useState(false),[filterSubject,setFilterSubject]=useState("All"),[filterMistake,setFilterMistake]=useState("All"),[search,setSearch]=useState(""),[loading,setLoading]=useState(true);
  useEffect(()=>{getErrors(userId).then(data=>{setErrors(data);setLoading(false);});},[userId]);
  const handleAdd = async (form:any) => { const ref=await addError(userId,form); const updated=[{id:ref.id,...form},...errors]; setErrors(updated); await recordActivityDate(userId,updated.length); onActivityAdded(); };
  const handleDelete = async (id:string) => { await deleteError(id); setErrors(p=>p.filter(e=>e.id!==id)); };
  const filtered = errors.filter((e:any)=>{if(filterSubject!=="All"&&e.subject!==filterSubject)return false;if(filterMistake!=="All"&&e.mistakeType!==filterMistake)return false;if(search&&!e.chapter?.toLowerCase().includes(search.toLowerCase())&&!e.subject?.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  const mistakeCounts = errors.reduce((acc:any,e:any)=>{acc[e.mistakeType]=(acc[e.mistakeType]||0)+1;return acc;},{});
  const subjectCounts = errors.reduce((acc:any,e:any)=>{acc[e.subject]=(acc[e.subject]||0)+1;return acc;},{});
  const mostRepeated = Object.entries(mistakeCounts).sort((a:any,b:any)=>b[1]-a[1])[0] as [string,number]|undefined;
  const pieData = Object.entries(mistakeCounts).map(([k,v])=>({label:k,value:v as number,color:MISTAKE_COLORS[k]||"#888"}));
  const barData = Object.entries(subjectCounts).map(([k,v])=>({label:k,value:v as number,color:SUBJECT_COLORS[k]||"#888"}));
  const chip = (active:boolean,color:string)=>({padding:"5px 12px",borderRadius:20,border:`1px solid ${active?color:"rgba(255,255,255,0.1)"}`,background:active?`${color}22`:"transparent",color:active?color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"});
  const thisWeek = errors.filter((e:any)=>(new Date().getTime()-new Date(e.date).getTime())/(1000*60*60*24)<=7).length;
  return (
    <div style={{paddingBottom:40}}>
      {showForm&&<ErrorForm onSubmit={handleAdd} onClose={()=>setShowForm(false)}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[{label:"Total Errors",value:errors.length,icon:"📝",color:"#00d4ff"},{label:"This Week",value:thisWeek,icon:"📅",color:"#ff2254"},{label:"Resolved",value:errors.filter((e:any)=>e.resolved===true).length,icon:"✅",color:"#22c55e"}].map(s=>(
          <GlassCard key={s.label} style={{padding:16,textAlign:"center"}}><div style={{fontSize:24}}>{s.icon}</div><div style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>{s.value}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{s.label}</div></GlassCard>
        ))}
      </div>
      {mostRepeated&&<div style={{padding:"12px 16px",borderRadius:10,marginBottom:16,background:"rgba(255,34,84,0.1)",border:"1px solid rgba(255,34,84,0.3)",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>⚠️</span><span style={{fontSize:13,color:"#ff8099"}}>Most repeated: <strong style={{color:"#ff2254"}}>{mostRepeated[0]}</strong> ({mostRepeated[1]} times)</span></div>}
      {pieData.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <GlassCard style={{padding:20}}><h3 style={{margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1}}>MISTAKE BREAKDOWN</h3><div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" as const}}><PieChart data={pieData}/><div style={{display:"flex",flexDirection:"column",gap:8}}>{pieData.map(d=><div key={d.label} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:d.color}}/><span style={{fontSize:12,color:"#94a3b8"}}>{d.label}</span><span style={{fontSize:12,color:d.color,fontWeight:700}}>{d.value}</span></div>)}</div></div></GlassCard>
        <GlassCard style={{padding:20}}><h3 style={{margin:"0 0 16px",fontSize:13,color:"#64748b",letterSpacing:1}}>SUBJECT DISTRIBUTION</h3><BarChart data={barData}/></GlassCard>
      </div>}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input style={{flex:1,minWidth:160,padding:"9px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit"}} placeholder="🔍 Search errors..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button onClick={()=>setShowForm(true)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00d4ff,#0066ff)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Error</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as const}}>
        {["All","Physics","Chemistry","Math","Other"].map(s=><button key={s} style={chip(filterSubject===s,"#00d4ff")} onClick={()=>setFilterSubject(s)}>{s}</button>)}
        <span style={{borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px"}}/>
        {["All","Conceptual","Calculation","Silly mistake","Time pressure"].map(m=><button key={m} style={chip(filterMistake===m,"#ff2254")} onClick={()=>setFilterMistake(m)}>{m}</button>)}
      </div>
      {loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}>Loading your errors...</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569"}}>No errors found. Clean slate! 🎯</div>}
          {filtered.map((error:any)=>(
            <GlassCard key={error.id} style={{padding:16}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap" as const}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap" as const}}>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:11,background:`${SUBJECT_COLORS[error.subject]}22`,color:SUBJECT_COLORS[error.subject],border:`1px solid ${SUBJECT_COLORS[error.subject]}44`}}>{error.subject}</span>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:11,background:`${MISTAKE_COLORS[error.mistakeType]}22`,color:MISTAKE_COLORS[error.mistakeType],border:`1px solid ${MISTAKE_COLORS[error.mistakeType]}44`}}>{error.mistakeType}</span>
                  </div>
                  <div style={{fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{error.chapter}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>{error.solution}</div>
                  {error.lesson&&<div style={{fontSize:12,color:"#ffd700",borderLeft:"2px solid #ffd70044",paddingLeft:8}}>💡 {error.lesson}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                  <div style={{fontSize:11,color:"#475569"}}>{error.date}</div>
                  <button onClick={()=>handleDelete(error.id)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.1)",color:"#ff2254",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function AnimeForm({ onSubmit, onClose }: any) {
  const [form,setForm]=useState({title:"",type:"Anime",status:"Watching",rating:7,episodesWatched:0,totalEpisodes:0,genres:[] as string[],notes:"",favorite:false});
  const inputStyle = {width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  const set = (k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.value}));
  const toggleGenre = (g:string)=>setForm(p=>({...p,genres:p.genres.includes(g)?p.genres.filter(x=>x!==g):[...p.genres,g]}));
  const progress = form.totalEpisodes>0?Math.min(100,Math.round((form.episodesWatched/form.totalEpisodes)*100)):0;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:600,maxHeight:"92vh",overflow:"auto"}}>
        <GlassCard hover={false} style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{margin:0,fontSize:20,color:"#a855f7",fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>+ ADD TO COLLECTION</h2>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>TITLE *</label><input style={inputStyle} placeholder="e.g. Attack on Titan" value={form.title} onChange={set("title")}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>TYPE</label><select style={{...inputStyle,cursor:"pointer"}} value={form.type} onChange={set("type")}>{["Anime","Manga","Manhwa","Manhua","Novel"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>STATUS</label><select style={{...inputStyle,cursor:"pointer"}} value={form.status} onChange={set("status")}>{["Watching","Reading","Planned","Completed","On Hold","Dropped"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>{form.type==="Anime"?"EPISODES WATCHED":"CHAPTERS READ"}</label><input style={inputStyle} type="number" min={0} value={form.episodesWatched} onChange={e=>setForm(p=>({...p,episodesWatched:parseInt(e.target.value)||0}))}/></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>{form.type==="Anime"?"TOTAL EPISODES":"TOTAL CHAPTERS"}</label><input style={inputStyle} type="number" min={0} value={form.totalEpisodes} onChange={e=>setForm(p=>({...p,totalEpisodes:parseInt(e.target.value)||0}))}/></div>
            </div>
            {form.totalEpisodes>0&&<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:"#64748b"}}>PROGRESS</span><span style={{fontSize:11,color:"#a855f7",fontWeight:700}}>{progress}%</span></div><div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#a855f7,#00d4ff)",borderRadius:3}}/></div></div>}
            <div>
              <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:8}}>RATING: <span style={{color:"#ffd700",fontWeight:700}}>{form.rating}/10</span></label>
              <div style={{display:"flex",gap:4}}>{Array.from({length:10},(_,i)=><button key={i} onClick={()=>setForm(p=>({...p,rating:i+1}))} style={{flex:1,height:32,borderRadius:4,border:"none",cursor:"pointer",background:i<form.rating?"linear-gradient(135deg,#ffd700,#ff6b35)":"rgba(255,255,255,0.05)",color:i<form.rating?"#fff":"#475569",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>{i+1}</button>)}</div>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:8}}>GENRES</label>
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:6}}>{GENRES.map(g=><button key={g} onClick={()=>toggleGenre(g)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${form.genres.includes(g)?"#a855f7":"rgba(255,255,255,0.1)"}`,background:form.genres.includes(g)?"rgba(168,85,247,0.2)":"transparent",color:form.genres.includes(g)?"#a855f7":"#64748b",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{g}</button>)}</div>
            </div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:4}}>NOTES</label><textarea style={{...inputStyle,height:60,resize:"vertical"}} placeholder="Your thoughts..." value={form.notes} onChange={set("notes")}/></div>
            <button onClick={()=>setForm(p=>({...p,favorite:!p.favorite}))} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${form.favorite?"#ffd700":"rgba(255,255,255,0.1)"}`,background:form.favorite?"rgba(255,215,0,0.15)":"transparent",color:form.favorite?"#ffd700":"#64748b",fontFamily:"inherit",fontSize:13,cursor:"pointer",transition:"all 0.2s",width:"fit-content"}}>
              {form.favorite?"⭐ Favorited":"☆ Add to Favorites"}
            </button>
            <button onClick={()=>{if(!form.title.trim()){alert("Please enter a title!");return;}onSubmit({...form,date:new Date().toISOString().split("T")[0]});onClose();}} style={{padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#a855f7,#ff2254)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1}}>ADD TO COLLECTION</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function AnimeCollection({ userId, onActivityAdded }: { userId:string; onActivityAdded:()=>void }) {
  const [collection,setCollection]=useState<any[]>([]),[filterType,setFilterType]=useState("All"),[filterStatus,setFilterStatus]=useState("All"),[search,setSearch]=useState(""),[showForm,setShowForm]=useState(false),[loading,setLoading]=useState(true);
  useEffect(()=>{getCollection(userId).then(data=>{setCollection(data);setLoading(false);});},[userId]);
  const handleAdd = async (entry:any) => { const ref=await addCollectionEntry(userId,entry); const updated=[{id:ref.id,...entry},...collection]; setCollection(updated); await recordActivityDate(userId,updated.length); onActivityAdded(); };
  const handleDelete = async (id:string) => { await deleteCollectionEntry(id); setCollection(p=>p.filter(e=>e.id!==id)); };
  const filtered = collection.filter(a=>{if(filterType!=="All"&&a.type!==filterType)return false;if(filterStatus!=="All"&&a.status!==filterStatus)return false;if(search&&!a.title?.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  const chip = (active:boolean,color:string)=>({padding:"5px 12px",borderRadius:20,border:`1px solid ${active?color:"rgba(255,255,255,0.1)"}`,background:active?`${color}22`:"transparent",color:active?color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"});
  const AVATARS=["⚔️","📖","🌙","🗡️","🐉","🔮","🌸","⚡","🎭","🌊","🦊","🏯","🌺","🎋","🦋"];
  const BGS=["linear-gradient(135deg,#0d1b2a,#1a2744)","linear-gradient(135deg,#1a0a2e,#2d1454)","linear-gradient(135deg,#0a1a0d,#0d2e14)","linear-gradient(135deg,#2a0a0a,#3d1414)","linear-gradient(135deg,#1a1a0a,#2e2d14)","linear-gradient(135deg,#0a0a2a,#141444)"];
  return (
    <div style={{paddingBottom:40}}>
      {showForm&&<AnimeForm onSubmit={handleAdd} onClose={()=>setShowForm(false)}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
        {[{label:"Total",value:collection.length,icon:"📚",color:"#a855f7"},{label:"Watching",value:collection.filter(a=>a.status==="Watching"||a.status==="Reading").length,icon:"👁️",color:"#00d4ff"},{label:"Completed",value:collection.filter(a=>a.status==="Completed").length,icon:"✅",color:"#22c55e"},{label:"Planned",value:collection.filter(a=>a.status==="Planned").length,icon:"📋",color:"#ffd700"},{label:"Favorites",value:collection.filter(a=>a.favorite).length,icon:"⭐",color:"#f97316"}].map(s=>(
          <GlassCard key={s.label} style={{padding:14,textAlign:"center"}}><div style={{fontSize:20}}>{s.icon}</div><div style={{fontSize:24,fontWeight:800,color:s.color,fontFamily:"'Bebas Neue',cursive",letterSpacing:2}}>{s.value}</div><div style={{fontSize:11,color:"#64748b"}}>{s.label}</div></GlassCard>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input style={{flex:1,minWidth:160,padding:"9px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit"}} placeholder="🔍 Search collection..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button onClick={()=>setShowForm(true)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#a855f7,#ff2254)",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" as const}}>
        {["All","Anime","Manga","Manhwa","Manhua","Novel"].map(t=><button key={t} style={chip(filterType===t,"#00d4ff")} onClick={()=>setFilterType(t)}>{t}</button>)}
        <span style={{borderLeft:"1px solid rgba(255,255,255,0.1)",margin:"0 4px"}}/>
        {["All","Watching","Reading","Planned","Completed","On Hold","Dropped"].map(s=><button key={s} style={chip(filterStatus===s,"#a855f7")} onClick={()=>setFilterStatus(s)}>{s}</button>)}
      </div>
      {loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}>Loading your collection...</div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569",gridColumn:"1/-1"}}>No entries found. Add your first! 🎌</div>}
          {filtered.map((item,idx)=>{
            const progress=item.totalEpisodes>0?Math.min(100,Math.round((item.episodesWatched/item.totalEpisodes)*100)):0;
            const sc=STATUS_COLORS[item.status]||"#888";
            return (
              <GlassCard key={item.id} style={{padding:0,overflow:"hidden"}}>
                <div style={{height:90,background:BGS[idx%BGS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,position:"relative" as const}}>
                  <span style={{filter:"drop-shadow(0 0 16px rgba(255,255,255,0.4))"}}>{AVATARS[idx%AVATARS.length]}</span>
                  <span style={{position:"absolute",top:8,left:8,padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:`${sc}22`,color:sc,border:`1px solid ${sc}44`}}>{item.status}</span>
                  {item.favorite&&<span style={{position:"absolute",top:8,right:8,fontSize:16}}>⭐</span>}
                </div>
                <div style={{padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",flex:1,marginRight:8}}>{item.title}</div>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(0,212,255,0.1)",color:"#00d4ff",border:"1px solid rgba(0,212,255,0.2)",whiteSpace:"nowrap" as const}}>{item.type}</span>
                  </div>
                  {item.genres&&item.genres.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginBottom:10}}>{item.genres.slice(0,3).map((g:string)=><span key={g} style={{padding:"2px 7px",borderRadius:10,fontSize:10,background:"rgba(168,85,247,0.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,0.25)"}}>{g}</span>)}{item.genres.length>3&&<span style={{fontSize:10,color:"#475569"}}>+{item.genres.length-3}</span>}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",gap:1}}>{Array.from({length:10},(_,i)=><span key={i} style={{fontSize:11,color:i<item.rating?"#ffd700":"#1e293b"}}>★</span>)}</div>
                    <span style={{fontSize:12,fontWeight:700,color:"#ffd700"}}>{item.rating}/10</span>
                  </div>
                  {item.totalEpisodes>0&&<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#64748b"}}>{item.type==="Anime"?"EP":"CH"} {item.episodesWatched}/{item.totalEpisodes}</span><span style={{fontSize:10,fontWeight:700,color:progress===100?"#22c55e":"#a855f7"}}>{progress}%</span></div><div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:progress===100?"linear-gradient(90deg,#22c55e,#00d4ff)":"linear-gradient(90deg,#a855f7,#00d4ff)",borderRadius:2}}/></div></div>}
                  {item.notes&&<div style={{fontSize:11,color:"#64748b",borderLeft:"2px solid rgba(168,85,247,0.3)",paddingLeft:8,marginBottom:10,fontStyle:"italic"}}>{item.notes.length>60?item.notes.slice(0,60)+"...":item.notes}</div>}
                  <button onClick={()=>handleDelete(item.id)} style={{width:"100%",padding:"7px",borderRadius:6,border:"1px solid rgba(255,34,84,0.3)",background:"rgba(255,34,84,0.08)",color:"#ff2254",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑 Remove</button>
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
  const [user,setUser]=useState<any>(null),[authLoading,setAuthLoading]=useState(true),[activeTab,setActiveTab]=useState("errors"),[quoteIdx,setQuoteIdx]=useState(0),[streak,setStreak]=useState(0);
  const refreshStreak = async (uid:string) => { const s=await getStreak(uid); setStreak(s); };
  useEffect(()=>{const unsub=onAuth(async u=>{setUser(u);setAuthLoading(false);if(u){const s=await getStreak(u.uid);setStreak(s);}});return()=>unsub();},[]);
  useEffect(()=>{const t=setInterval(()=>setQuoteIdx(i=>(i+1)%QUOTES.length),5000);return()=>clearInterval(t);},[]);
  if(authLoading)return <div style={{minHeight:"100vh",background:"#050810",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:48}}>⚡</div></div>;
  if(!user)return(
    <div style={{minHeight:"100vh",background:"#050810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap'); *{margin:0;padding:0;box-sizing:border-box} input::placeholder,textarea::placeholder{color:#334155} select option{background:#0d1117}`}</style>
      <Particles/><div style={{position:"relative",zIndex:1}}><AuthScreen onLogin={setUser}/></div>
    </div>
  );
  const TABS=[{id:"errors",label:"Error Book",icon:"📝"},{id:"collection",label:"Collection",icon:"🎌"}];
  return(
    <div style={{minHeight:"100vh",background:"#050810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap'); *{margin:0;padding:0;box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#050810} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px} input::placeholder,textarea::placeholder{color:#334155} select option{background:#0d1117}`}</style>
      <Particles/>
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 16px"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>⚡</span>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:4,background:"linear-gradient(135deg,#00d4ff,#ff2254)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ERRORVERSE</span>
          </div>
          <div style={{flex:1,margin:"0 24px",overflow:"hidden"}}><span style={{fontSize:11,color:"#475569",whiteSpace:"nowrap" as const,fontStyle:"italic"}}>"{QUOTES[quoteIdx]}"</span></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:streak>0?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${streak>0?"rgba(255,215,0,0.3)":"rgba(255,255,255,0.08)"}`}}>
                <span style={{fontSize:14}}>{streak>0?"🔥":"💤"}</span>
                <span style={{fontSize:12,color:streak>0?"#ffd700":"#475569",fontWeight:700}}>{streak}d streak</span>
              </div>
              <span style={{fontSize:9,color:"#334155",marginTop:2}}>add 3 entries/day</span>
            </div>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#ff2254)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>
              {(user.displayName||user.email||"?")[0].toUpperCase()}
            </div>
            <button onClick={()=>logOut()} style={{background:"none",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Logout</button>
          </div>
        </header>
        <div style={{display:"flex",gap:4,marginBottom:24,padding:"4px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",width:"fit-content"}}>
          {TABS.map(tab=><button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",background:activeTab===tab.id?"rgba(255,255,255,0.08)":"transparent",color:activeTab===tab.id?"#e2e8f0":"#64748b",fontFamily:"inherit",fontSize:13,fontWeight:activeTab===tab.id?600:400,transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}><span>{tab.icon}</span><span>{tab.label}</span></button>)}
        </div>
        <div style={{marginBottom:20}}>
          {activeTab==="errors"&&<h1 style={{fontSize:32,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#e2e8f0"}}>DAILY <span style={{color:"#ff2254"}}>ERROR</span> BOOK</h1>}
          {activeTab==="collection"&&<h1 style={{fontSize:32,fontFamily:"'Bebas Neue',cursive",letterSpacing:3,color:"#e2e8f0"}}>ANIME <span style={{color:"#a855f7"}}>COLLECTION</span></h1>}
        </div>
        {activeTab==="errors"&&<ErrorBook userId={user.uid} onActivityAdded={()=>refreshStreak(user.uid)}/>}
        {activeTab==="collection"&&<AnimeCollection userId={user.uid} onActivityAdded={()=>refreshStreak(user.uid)}/>}
      </div>
    </div>
  );
}