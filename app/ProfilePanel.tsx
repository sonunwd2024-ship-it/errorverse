"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  user: any;
  xpData: any;
  streak: number;
  todayCount: number;
  onClose: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: Partial<ProfileData>) => void;
  LEVELS: readonly any[];
  BADGES: readonly any[];
  XP_REWARDS: any;
}

interface ProfileData {
  displayName: string;
  avatar: string; // url or emoji-avatar id
  photoURL: string | null;
  bio: string;
  theme: string;
}

interface Account {
  uid: string;
  displayName: string;
  email: string;
  avatar: string;
  photoURL: string | null;
}

// ─── AVATAR PRESETS ───────────────────────────────────────────────────────────

const AVATAR_PRESETS = [
  { id:"av1",  emoji:"🐉", bg:"linear-gradient(135deg,#7f1d1d,#dc2626)", label:"Dragon" },
  { id:"av2",  emoji:"⚡", bg:"linear-gradient(135deg,#1e1b4b,#7c3aed)", label:"Thunder" },
  { id:"av3",  emoji:"🦊", bg:"linear-gradient(135deg,#7c2d12,#ea580c)", label:"Fox" },
  { id:"av4",  emoji:"🌙", bg:"linear-gradient(135deg,#0c1445,#1e40af)", label:"Moon" },
  { id:"av5",  emoji:"🔥", bg:"linear-gradient(135deg,#78350f,#f97316)", label:"Blaze" },
  { id:"av6",  emoji:"💀", bg:"linear-gradient(135deg,#0a0a0a,#374151)", label:"Phantom" },
  { id:"av7",  emoji:"🌸", bg:"linear-gradient(135deg,#4a044e,#a21caf)", label:"Sakura" },
  { id:"av8",  emoji:"🗡️", bg:"linear-gradient(135deg,#1a1a2e,#16213e)", label:"Blade" },
  { id:"av9",  emoji:"🧠", bg:"linear-gradient(135deg,#064e3b,#059669)", label:"Genius" },
  { id:"av10", emoji:"👁️", bg:"linear-gradient(135deg,#1e3a5f,#0891b2)", label:"Watcher" },
  { id:"av11", emoji:"🎯", bg:"linear-gradient(135deg,#7f1d1d,#b91c1c)", label:"Sniper" },
  { id:"av12", emoji:"🏆", bg:"linear-gradient(135deg,#713f12,#d97706)", label:"Champion" },
  { id:"av13", emoji:"🌊", bg:"linear-gradient(135deg,#0c1445,#0e7490)", label:"Tide" },
  { id:"av14", emoji:"💎", bg:"linear-gradient(135deg,#1e1b4b,#4f46e5)", label:"Diamond" },
  { id:"av15", emoji:"🦋", bg:"linear-gradient(135deg,#500724,#e11d48)", label:"Butterfly" },
  { id:"av16", emoji:"🐺", bg:"linear-gradient(135deg,#1c1917,#44403c)", label:"Wolf" },
];

// ─── ACHIEVEMENT TIERS (Duolingo-style) ──────────────────────────────────────

const ACHIEVEMENT_LEAGUES = [
  { id:"bronze",   name:"Bronze",   icon:"🥉", color:"#cd7f32", minXP:0 },
  { id:"silver",   name:"Silver",   icon:"🥈", color:"#c0c0c0", minXP:200 },
  { id:"gold",     name:"Gold",     icon:"🥇", color:"#ffd700", minXP:500 },
  { id:"sapphire", name:"Sapphire", icon:"💎", color:"#0ea5e9", minXP:1000 },
  { id:"ruby",     name:"Ruby",     icon:"💎", color:"#e11d48", minXP:1800 },
  { id:"diamond",  name:"Diamond",  icon:"💠", color:"#a78bfa", minXP:3000 },
  { id:"obsidian", name:"Obsidian", icon:"🖤", color:"#1f2937", minXP:5000 },
  { id:"legendary",name:"Legendary",icon:"👑", color:"#fbbf24", minXP:10000 },
];

const DUOLINGO_CHALLENGES = [
  { id:"c1", name:"Daily Grinder",    icon:"💪", desc:"Log errors 3 days in a row",       xp:50,  progress:2, goal:3 },
  { id:"c2", name:"Chapter Cleaner",  icon:"🧹", desc:"Master all errors in one chapter",  xp:100, progress:1, goal:5 },
  { id:"c3", name:"Speed Logger",     icon:"⚡", desc:"Log 5 errors within an hour",       xp:75,  progress:3, goal:5 },
  { id:"c4", name:"Review Warrior",   icon:"⚔️", desc:"Complete 10 revision sessions",     xp:120, progress:7, goal:10 },
  { id:"c5", name:"Perfect Day",      icon:"🌟", desc:"Log 3+ entries for 7 days",         xp:200, progress:4, goal:7 },
  { id:"c6", name:"Subject Master",   icon:"📚", desc:"Master 5 errors in every subject",  xp:150, progress:2, goal:3 },
];

const DAILY_QUESTS = [
  { id:"q1", name:"Morning Warrior",  icon:"☀️", desc:"Log an error before noon",           xp:20,  done:true },
  { id:"q2", name:"Triple Threat",    icon:"🎯", desc:"Log 3 errors today",                 xp:30,  done:false },
  { id:"q3", name:"Revision Run",     icon:"🔁", desc:"Review 2 errors",                    xp:25,  done:false },
  { id:"q4", name:"Reflect & Learn",  icon:"💭", desc:"Fill in 'Why I made this mistake'",  xp:15,  done:true },
];

const STREAK_REWARDS = [
  { days:3,   reward:"🔥 Flame Badge",     xp:50 },
  { days:7,   reward:"⚡ Week Warrior",    xp:100 },
  { days:14,  reward:"💪 Fortnight King",  xp:200 },
  { days:30,  reward:"🏆 Monthly Legend",  xp:500 },
  { days:100, reward:"👑 Century God",     xp:2000 },
];

// ─── HELPER ───────────────────────────────────────────────────────────────────

function AvatarDisplay({ avatar, photoURL, displayName, size=40, style={} }: any) {
  const preset = AVATAR_PRESETS.find(a => a.id === avatar);
  if (photoURL) {
    return <img src={photoURL} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, ...style }} />;
  }
  if (preset) {
    return (
      <div style={{ width:size, height:size, borderRadius:"50%", background:preset.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.45, flexShrink:0, ...style }}>
        {preset.emoji}
      </div>
    );
  }
  // Default letter avatar
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#00d4ff,#ff2254)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:800, color:"#fff", flexShrink:0, ...style }}>
      {(displayName||"?")[0].toUpperCase()}
    </div>
  );
}

// ─── MAIN PROFILE PANEL ───────────────────────────────────────────────────────

export function ProfilePanel({ user, xpData, streak, todayCount, onClose, onLogout, onUpdateProfile, LEVELS, BADGES, XP_REWARDS }: ProfilePanelProps) {
  const [view, setView] = useState<"main"|"edit"|"avatar"|"accounts"|"achievements"|"challenges"|"quests"|"streakRewards"|"security"|"privacy"|"notifications">("main");
  const [editName, setEditName] = useState(user.displayName || user.email?.split("@")[0] || "Warrior");
  const [editBio, setEditBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("av1");
  const [photoURL, setPhotoURL] = useState<string|null>(user.photoURL || null);
  const [accounts, setAccounts] = useState<Account[]>([{ uid: user.uid, displayName: user.displayName || "You", email: user.email || "", avatar: "av1", photoURL: user.photoURL || null }]);
  const [activeAccount, setActiveAccount] = useState(user.uid);
  const [notifications, setNotifications] = useState({ streakReminder:true, revisionDue:true, weeklyReport:false, badgeEarned:true });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentLevel = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1)) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1) + 1);
  const progress = nextLevel
    ? ((xpData?.totalXP ?? 0 - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  const currentLeague = [...ACHIEVEMENT_LEAGUES].reverse().find(l => (xpData?.totalXP ?? 0) >= l.minXP) ?? ACHIEVEMENT_LEAGUES[0];
  const nextLeague = ACHIEVEMENT_LEAGUES[ACHIEVEMENT_LEAGUES.indexOf(currentLeague) + 1];
  const leagueProgress = nextLeague
    ? (((xpData?.totalXP ?? 0) - currentLeague.minXP) / (nextLeague.minXP - currentLeague.minXP)) * 100
    : 100;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoURL(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onUpdateProfile({ displayName: editName, avatar: selectedAvatar, photoURL, bio: editBio });
    setSaving(false);
    setView("main");
  };

  const INP: React.CSSProperties = { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e2e8f0", fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  const BackBtn = () => (
    <button onClick={() => setView("main")} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", padding:0, marginRight:8 }}>←</button>
  );

  // ── MAIN VIEW ─────────────────────────────────────────────────────────────
  if (view === "main") return (
    <Overlay onClose={onClose}>
      <div style={{ width:"100%", maxWidth:400, maxHeight:"92vh", overflowY:"auto", scrollbarWidth:"none" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>PROFILE</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer" }}>✕</button>
        </div>

        {/* Avatar + Name */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:12 }}>
            <AvatarDisplay avatar={selectedAvatar} photoURL={photoURL} displayName={editName} size={88} />
            {/* League ring */}
            <div style={{ position:"absolute", inset:-3, borderRadius:"50%", border:`3px solid ${currentLeague.color}`, pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:"50%", background:"#1a1f2e", border:"2px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{currentLevel.icon}</div>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"#e2e8f0", marginBottom:2 }}>{editName}</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>{user.email}</div>
          {/* League badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 14px", borderRadius:20, background:`${currentLeague.color}18`, border:`1px solid ${currentLeague.color}44` }}>
            <span style={{ fontSize:14 }}>{currentLeague.icon}</span>
            <span style={{ fontSize:12, color:currentLeague.color, fontWeight:700 }}>{currentLeague.name} League</span>
          </div>
        </div>

        {/* XP + Level mini bar */}
        <Glass style={{ padding:16, marginBottom:12, background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,212,255,0.05))", border:"1px solid rgba(124,58,237,0.2)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>{currentLevel.icon} {currentLevel.name}</span>
            <span style={{ fontSize:12, color:"#64748b" }}>Lv.{xpData?.level ?? 1}</span>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
            <div style={{ height:"100%", width:`${Math.min(progress,100)}%`, background:"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:3 }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#475569" }}>
            <span>⚡ {xpData?.totalXP ?? 0} XP</span>
            <span>{nextLevel ? `${nextLevel.minXP} XP → ${nextLevel.name}` : "MAX ✓"}</span>
          </div>
        </Glass>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          {[
            { label:"Streak", value:`${streak}🔥`, color:"#ffd700" },
            { label:"Today",  value:`${todayCount}/3`, color:todayCount>=3?"#22c55e":"#00d4ff" },
            { label:"Badges", value:`${(xpData?.badges??[]).length}🏅`, color:"#a855f7" },
          ].map(s => (
            <Glass key={s.label} style={{ padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{s.label}</div>
            </Glass>
          ))}
        </div>

        {/* Menu items */}
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          <MenuSection title="ACCOUNT" />
          <MenuItem icon="✏️" label="Edit Profile" sub="Name, bio, avatar" onClick={() => setView("edit")} />
          <MenuItem icon="🖼️" label="Choose Avatar" sub={`${AVATAR_PRESETS.length} presets + custom photo`} onClick={() => setView("avatar")} />
          <MenuItem icon="🔐" label="Security" sub="Password & 2FA" onClick={() => setView("security")} />

          <MenuSection title="PROGRESSION" />
          <MenuItem icon="🏆" label="Achievements" sub={`${(xpData?.badges??[]).length} earned`} onClick={() => setView("achievements")} badge={(xpData?.badges??[]).length} />
          <MenuItem icon="⚔️" label="Challenges" sub="Weekly missions" onClick={() => setView("challenges")} badge="3" />
          <MenuItem icon="📜" label="Daily Quests" sub={`${DAILY_QUESTS.filter(q=>q.done).length}/${DAILY_QUESTS.length} done`} onClick={() => setView("quests")} />
          <MenuItem icon="🔥" label="Streak Rewards" sub="Milestone bonuses" onClick={() => setView("streakRewards")} />

          <MenuSection title="SETTINGS" />
          <MenuItem icon="🔔" label="Notifications" sub="Reminders & alerts" onClick={() => setView("notifications")} />
          <MenuItem icon="🛡️" label="Privacy" sub="Data & visibility" onClick={() => setView("privacy")} />

          <MenuSection title="" />
          <button onClick={onLogout} style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"left" }}>
            🚪 Log Out
          </button>
          <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#334155" }}>ErrorVerse v2.0 · Made with ⚡</div>
        </div>
      </div>
    </Overlay>
  );

  // ── EDIT PROFILE ──────────────────────────────────────────────────────────
  if (view === "edit") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>EDIT PROFILE</span>
        </div>

        {/* Avatar preview + change */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ position:"relative", display:"inline-block", cursor:"pointer" }} onClick={() => setView("avatar")}>
            <AvatarDisplay avatar={selectedAvatar} photoURL={photoURL} displayName={editName} size={80} />
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="1")} onMouseLeave={e=>(e.currentTarget.style.opacity="0")}>
              <span style={{ color:"#fff", fontSize:12 }}>Edit</span>
            </div>
          </div>
          <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"center" }}>
            <button onClick={() => setView("avatar")} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(0,212,255,0.3)", background:"rgba(0,212,255,0.08)", color:"#00d4ff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🖼️ Change Avatar</button>
            <button onClick={() => fileRef.current?.click()} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(168,85,247,0.3)", background:"rgba(168,85,247,0.08)", color:"#a855f7", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>📷 Upload Photo</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload} />
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>DISPLAY NAME</label>
            <input style={INP} value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Your warrior name..." />
          </div>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>BIO</label>
            <textarea style={{ ...INP, height:72, resize:"none" } as any} value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Tell the verse who you are..." />
          </div>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>EMAIL</label>
            <input style={{ ...INP, opacity:0.5, cursor:"not-allowed" }} value={user.email || ""} disabled />
          </div>
          <button onClick={handleSave} style={{ padding:"13px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:"pointer", letterSpacing:1 }}>
            {saving ? "SAVING..." : "SAVE CHANGES ✓"}
          </button>
        </div>
      </Panel>
    </Overlay>
  );

  // ── AVATAR PICKER ─────────────────────────────────────────────────────────
  if (view === "avatar") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>CHOOSE AVATAR</span>
        </div>

        {/* Photo upload option */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:10, letterSpacing:1 }}>📷 UPLOAD PHOTO</div>
          <div onClick={() => fileRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"20px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(0,212,255,0.4)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.12)";}}>
            {photoURL ? (
              <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center" }}>
                <img src={photoURL} style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover" }} />
                <div>
                  <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600 }}>Photo uploaded ✓</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>Click to change</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                <div style={{ fontSize:13, color:"#94a3b8" }}>Upload from gallery</div>
                <div style={{ fontSize:11, color:"#475569" }}>JPG, PNG, GIF up to 5MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { handlePhotoUpload(e); setPhotoURL(null); /* will be set by handler */ }} />
          {photoURL && <button onClick={() => setPhotoURL(null)} style={{ marginTop:8, width:"100%", padding:"8px", borderRadius:8, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗑 Remove Photo</button>}
        </div>

        {/* Preset avatars */}
        <div style={{ fontSize:11, color:"#64748b", marginBottom:12, letterSpacing:1 }}>🎭 CHOOSE PRESET</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {AVATAR_PRESETS.map(av => (
            <div key={av.id} onClick={() => { setSelectedAvatar(av.id); setPhotoURL(null); }} style={{ cursor:"pointer", textAlign:"center" }}>
              <div style={{ width:"100%", aspectRatio:"1", borderRadius:14, background:av.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:`2px solid ${selectedAvatar===av.id&&!photoURL?"#00d4ff":"transparent"}`, boxShadow:selectedAvatar===av.id&&!photoURL?"0 0 16px rgba(0,212,255,0.4)":"none", transition:"all 0.2s" }}>
                {av.emoji}
              </div>
              <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>{av.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setView("edit")} style={{ width:"100%", marginTop:20, padding:"12px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:"pointer" }}>
          CONFIRM ✓
        </button>
      </Panel>
    </Overlay>
  );

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  if (view === "achievements") {
    const earnedSet = new Set(xpData?.badges ?? []);
    return (
      <Overlay onClose={onClose}>
        <Panel wide>
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            <BackBtn />
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>ACHIEVEMENTS</span>
          </div>

          {/* League progress */}
          <Glass style={{ padding:16, marginBottom:20, background:`linear-gradient(135deg,${currentLeague.color}18,transparent)`, border:`1px solid ${currentLeague.color}33` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <span style={{ fontSize:40 }}>{currentLeague.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800, color:currentLeague.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>{currentLeague.name} League</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{xpData?.totalXP ?? 0} XP {nextLeague ? `· ${nextLeague.minXP - (xpData?.totalXP??0)} to ${nextLeague.name}` : "· MAX!"}</div>
              </div>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(leagueProgress,100)}%`, background:`linear-gradient(90deg,${currentLeague.color},${nextLeague?.color??currentLeague.color})`, borderRadius:4, transition:"width 1s" }} />
            </div>
            {/* All leagues */}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:10 }}>
              {ACHIEVEMENT_LEAGUES.map(lg => {
                const unlocked = (xpData?.totalXP ?? 0) >= lg.minXP;
                return (
                  <div key={lg.id} style={{ textAlign:"center", opacity:unlocked?1:0.35 }}>
                    <div style={{ fontSize:16 }}>{lg.icon}</div>
                    <div style={{ fontSize:8, color:unlocked?lg.color:"#475569", marginTop:2 }}>{lg.name}</div>
                  </div>
                );
              })}
            </div>
          </Glass>

          {/* Badges grid */}
          <div style={{ fontSize:11, color:"#64748b", marginBottom:12, letterSpacing:1 }}>🏅 BADGES ({(xpData?.badges??[]).length}/{BADGES.length})</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {BADGES.map((b:any) => {
              const unlocked = earnedSet.has(b.id);
              return (
                <div key={b.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, background:unlocked?"rgba(255,215,0,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${unlocked?"rgba(255,215,0,0.2)":"rgba(255,255,255,0.05)"}`, opacity:unlocked?1:0.5, filter:unlocked?"none":"grayscale(1)" }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{b.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{b.desc}</div>
                    {unlocked && <div style={{ fontSize:10, color:"#ffd700", marginTop:3 }}>✓ Earned</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </Overlay>
    );
  }

  // ── CHALLENGES ────────────────────────────────────────────────────────────
  if (view === "challenges") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>WEEKLY CHALLENGES</span>
        </div>
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.25)", marginBottom:16, fontSize:12, color:"#c4b5fd" }}>
          ⏳ Resets in <strong>3 days 14 hours</strong> · Complete all for bonus 300 XP!
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {DUOLINGO_CHALLENGES.map(c => {
            const done = c.progress >= c.goal;
            const pct = Math.min(100, (c.progress/c.goal)*100);
            return (
              <Glass key={c.id} style={{ padding:16, border:`1px solid ${done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}`, background:done?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <span style={{ fontSize:28 }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>{c.name}</span>
                      <span style={{ fontSize:11, color:"#ffd700", fontWeight:700 }}>+{c.xp} XP</span>
                    </div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{c.desc}</div>
                  </div>
                  {done && <span style={{ fontSize:20 }}>✅</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:done?"#22c55e":"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:11, color:"#64748b", flexShrink:0 }}>{c.progress}/{c.goal}</span>
                </div>
              </Glass>
            );
          })}
        </div>
      </Panel>
    </Overlay>
  );

  // ── DAILY QUESTS ──────────────────────────────────────────────────────────
  if (view === "quests") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>DAILY QUESTS</span>
        </div>
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.2)", marginBottom:16, fontSize:12, color:"#fcd34d" }}>
          ☀️ Resets at midnight · {DAILY_QUESTS.filter(q=>q.done).length}/{DAILY_QUESTS.length} completed today
        </div>
        {/* XP bar for today */}
        <Glass style={{ padding:14, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:6 }}>
            <span>Daily XP</span>
            <span style={{ color:"#ffd700", fontWeight:700 }}>{DAILY_QUESTS.filter(q=>q.done).reduce((a,q)=>a+q.xp,0)} / {DAILY_QUESTS.reduce((a,q)=>a+q.xp,0)} XP</span>
          </div>
          <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(DAILY_QUESTS.filter(q=>q.done).reduce((a,q)=>a+q.xp,0)/DAILY_QUESTS.reduce((a,q)=>a+q.xp,0))*100}%`, background:"linear-gradient(90deg,#fbbf24,#f97316)", borderRadius:4 }} />
          </div>
        </Glass>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {DAILY_QUESTS.map(q => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:q.done?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${q.done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}` }}>
              <span style={{ fontSize:26 }}>{q.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:q.done?"#22c55e":"#e2e8f0" }}>{q.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{q.desc}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, color:"#ffd700", fontWeight:700 }}>+{q.xp} XP</div>
                {q.done ? <div style={{ fontSize:12 }}>✅</div> : <div style={{ fontSize:12, color:"#334155" }}>○</div>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Overlay>
  );

  // ── STREAK REWARDS ────────────────────────────────────────────────────────
  if (view === "streakRewards") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>STREAK REWARDS</span>
        </div>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:56, fontFamily:"'Bebas Neue',cursive", color:"#ffd700", lineHeight:1 }}>{streak}</div>
          <div style={{ fontSize:13, color:"#94a3b8" }}>day streak 🔥</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {STREAK_REWARDS.map(r => {
            const reached = streak >= r.days;
            const next = !reached && STREAK_REWARDS.find(x => !( streak >= x.days)) === r;
            return (
              <div key={r.days} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:reached?"rgba(255,215,0,0.06)":next?"rgba(0,212,255,0.04)":"rgba(255,255,255,0.02)", border:`1px solid ${reached?"rgba(255,215,0,0.3)":next?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.05)"}` }}>
                <div style={{ width:48, height:48, borderRadius:12, background:reached?"rgba(255,215,0,0.15)":next?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                  {reached?"✅":next?"🎯":"🔒"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:reached?"#ffd700":next?"#00d4ff":"#475569" }}>{r.reward}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{r.days} day streak {!reached&&`· ${r.days-streak} to go`}</div>
                </div>
                <div style={{ fontSize:13, color:"#ffd700", fontWeight:700 }}>+{r.xp} XP</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Overlay>
  );

  // ── SECURITY ──────────────────────────────────────────────────────────────
  if (view === "security") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>SECURITY</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { icon:"🔑", label:"Change Password", sub:"Update your account password", action:"Change →" },
            { icon:"📧", label:"Verify Email", sub:user.emailVerified?"Email verified ✓":"Email not verified", action:user.emailVerified?"Done":"Verify" },
            { icon:"🔒", label:"Two-Factor Auth", sub:"Extra layer of security", action:"Enable" },
            { icon:"📱", label:"Active Sessions", sub:"Manage logged-in devices", action:"View →" },
            { icon:"🗑️", label:"Delete Account", sub:"Permanently remove all data", action:"Delete", danger:true },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:`1px solid ${(item as any).danger?"rgba(255,34,84,0.2)":"rgba(255,255,255,0.06)"}`, cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:(item as any).danger?"#ff2254":"#e2e8f0" }}>{item.label}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{item.sub}</div>
              </div>
              <span style={{ fontSize:12, color:(item as any).danger?"#ff2254":"#64748b" }}>{item.action}</span>
            </div>
          ))}
        </div>
      </Panel>
    </Overlay>
  );

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  if (view === "notifications") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>NOTIFICATIONS</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => {
            const labels: Record<string, {icon:string;label:string;sub:string}> = {
              streakReminder: { icon:"🔥", label:"Streak Reminder", sub:"Daily reminder to keep streak alive" },
              revisionDue:    { icon:"📅", label:"Revision Due",    sub:"When errors are due for review" },
              weeklyReport:   { icon:"📊", label:"Weekly Report",   sub:"Summary of your weekly progress" },
              badgeEarned:    { icon:"🏅", label:"Badge Earned",    sub:"When you unlock a new badge" },
            };
            const lbl = labels[key];
            return (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize:22 }}>{lbl.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{lbl.label}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{lbl.sub}</div>
                </div>
                <div onClick={() => setNotifications(n => ({...n, [key]:!n[key]}))} style={{ width:44, height:24, borderRadius:12, background:val?"linear-gradient(90deg,#00d4ff,#7c3aed)":"rgba(255,255,255,0.1)", cursor:"pointer", transition:"all 0.3s", position:"relative", flexShrink:0 }}>
                  <div style={{ position:"absolute", top:2, left:val?20:2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Overlay>
  );

  // ── PRIVACY ───────────────────────────────────────────────────────────────
  if (view === "privacy") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>PRIVACY</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"👁️", label:"Leaderboard Visibility", sub:"Show your name on leaderboard" },
            { icon:"📊", label:"Share Analytics", sub:"Allow community insights" },
            { icon:"💾", label:"Export My Data", sub:"Download all your error entries" },
            { icon:"🧹", label:"Clear All Data", sub:"Remove all errors and stats" },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{item.label}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{item.sub}</div>
              </div>
              <span style={{ fontSize:12, color:"#64748b" }}>→</span>
            </div>
          ))}
        </div>
      </Panel>
    </Overlay>
  );

  return null;
}

// ─── XP TAP PANEL (mini, opens from header) ───────────────────────────────────

export function XPTapPanel({ xpData, streak, onClose, LEVELS, BADGES }: any) {
  const currentLevel = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1)) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1) + 1);
  const progress = nextLevel
    ? (((xpData?.totalXP ?? 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;
  const earnedSet = new Set(xpData?.badges ?? []);

  return (
    <Overlay onClose={onClose}>
      <div style={{ width:"100%", maxWidth:360, maxHeight:"88vh", overflowY:"auto", scrollbarWidth:"none" }}>
        {/* Level hero */}
        <Glass style={{ padding:24, marginBottom:12, background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(0,212,255,0.05))", border:"1px solid rgba(124,58,237,0.3)", textAlign:"center", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>✕</button>
          <div style={{ fontSize:52, marginBottom:8 }}>{currentLevel.icon}</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:3 }}>{currentLevel.name?.toUpperCase()}</div>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>Level {xpData?.level ?? 1}</div>
          <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:5, overflow:"hidden", marginBottom:8 }}>
            <div style={{ height:"100%", width:`${Math.min(progress,100)}%`, background:"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:5, transition:"width 1.2s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#475569" }}>
            <span>⚡ {xpData?.totalXP ?? 0} XP</span>
            <span>{nextLevel ? `${nextLevel.minXP} for ${nextLevel.name}` : "👑 MAX"}</span>
          </div>
        </Glass>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            { icon:"🔥", label:"Streak",      val:`${streak} days`,                   color:"#ffd700" },
            { icon:"🏅", label:"Badges",      val:`${earnedSet.size}/${BADGES.length}`,color:"#a855f7" },
            { icon:"📝", label:"XP This Week", val:"–",                                color:"#00d4ff" },
            { icon:"🎯", label:"Mastered",    val:"–",                                 color:"#22c55e" },
          ].map(s => (
            <Glass key={s.label} style={{ padding:"12px 14px" }}>
              <div style={{ fontSize:20 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:1 }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{s.label}</div>
            </Glass>
          ))}
        </div>

        {/* Recent badges */}
        <Glass style={{ padding:16 }}>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:12 }}>🏅 RECENT BADGES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {BADGES.filter((b:any) => earnedSet.has(b.id)).slice(0,4).map((b:any) => (
              <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#ffd700" }}>{b.name}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{b.desc}</div>
                </div>
              </div>
            ))}
            {earnedSet.size === 0 && <div style={{ fontSize:12, color:"#475569", textAlign:"center", padding:"12px 0" }}>No badges yet — start logging! ⚡</div>}
          </div>
        </Glass>
      </div>
    </Overlay>
  );
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function Glass({ children, style={} }: any) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, ...style }}>
      {children}
    </div>
  );
}

function Panel({ children, wide=false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ width:"100%", maxWidth:wide?520:400, maxHeight:"92vh", overflowY:"auto", scrollbarWidth:"none", background:"rgba(8,12,24,0.97)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:24 }}>
      {children}
    </div>
  );
}

function MenuSection({ title }: { title: string }) {
  return title ? <div style={{ fontSize:10, color:"#334155", letterSpacing:1.5, marginTop:14, marginBottom:4, paddingLeft:4 }}>{title}</div> : <div style={{ marginTop:10 }} />;
}

function MenuItem({ icon, label, sub, onClick, badge }: { icon:string; label:string; sub?:string; onClick?:()=>void; badge?:string|number }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, background:hov?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", cursor:onClick?"pointer":"default", transition:"all 0.2s" }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#64748b" }}>{sub}</div>}
      </div>
      {badge !== undefined && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(255,34,84,0.2)", color:"#ff2254", fontWeight:700 }}>{badge}</span>}
      <span style={{ fontSize:16, color:"#334155" }}>›</span>
    </div>
  );
}

export { AvatarDisplay, AVATAR_PRESETS };