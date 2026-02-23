"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, deleteDoc, query, where } from "firebase/firestore";
import {

  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut,
} from "firebase/auth";

// ─── FIREBASE PERSISTENCE ─────────────────────────────────────────────────────

export async function saveUserProfile(userId: string, data: {
  displayName: string;
  avatar: string;
  photoURL?: string | null;
  bio?: string;
}) {
  try {
    await setDoc(doc(db, "userProfiles", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("saveUserProfile error:", err);
    return false;
  }
}

export async function loadUserProfile(userId: string) {
  try {
    const snap = await getDoc(doc(db, "userProfiles", userId));
    if (snap.exists()) return snap.data() as {
      displayName: string;
      avatar: string;
      photoURL?: string | null;
      bio?: string;
    };
    return null;
  } catch (err) {
    console.error("loadUserProfile error:", err);
    return null;
  }
}

// ─── ANIME AVATAR CATALOG ─────────────────────────────────────────────────────
// Real anime themed avatars with distinct visual identities

export const AVATARS = [
  // ONE PIECE
  { id:"av_luffy",    emoji:"🏴‍☠️", label:"Luffy",       color:"#FF4444", bg:"linear-gradient(135deg,#7f1d1d,#dc2626)",    series:"One Piece",    style:"⚡ STRAW HAT" },
  { id:"av_zoro",     emoji:"⚔️",   label:"Zoro",        color:"#22c55e", bg:"linear-gradient(135deg,#14532d,#16a34a)",    series:"One Piece",    style:"🗡 3-SWORD" },
  { id:"av_nami",     emoji:"🌩️",   label:"Nami",        color:"#f97316", bg:"linear-gradient(135deg,#7c2d12,#ea580c)",    series:"One Piece",    style:"⚡ NAVIGATOR" },
  { id:"av_sanji",    emoji:"🔥",   label:"Sanji",       color:"#fbbf24", bg:"linear-gradient(135deg,#78350f,#d97706)",    series:"One Piece",    style:"🦵 BLACK LEG" },
  { id:"av_shanks",   emoji:"👑",   label:"Shanks",      color:"#dc2626", bg:"linear-gradient(135deg,#450a0a,#b91c1c)",    series:"One Piece",    style:"🌊 YONKO" },
  { id:"av_ace",      emoji:"🔥",   label:"Ace",         color:"#f97316", bg:"linear-gradient(135deg,#431407,#c2410c)",    series:"One Piece",    style:"🔥 FIRE FIST" },
  // NARUTO
  { id:"av_naruto",   emoji:"🦊",   label:"Naruto",      color:"#fb923c", bg:"linear-gradient(135deg,#7c2d12,#f97316)",    series:"Naruto",       style:"☯ NINE-TAILS" },
  { id:"av_sasuke",   emoji:"⚡",   label:"Sasuke",      color:"#8b5cf6", bg:"linear-gradient(135deg,#1e1b4b,#7c3aed)",    series:"Naruto",       style:"👁 SHARINGAN" },
  { id:"av_itachi",   emoji:"🌙",   label:"Itachi",      color:"#a78bfa", bg:"linear-gradient(135deg,#0f0a1a,#4c1d95)",    series:"Naruto",       style:"🪽 MANGEKYOU" },
  { id:"av_minato",   emoji:"⚡",   label:"Minato",      color:"#fde68a", bg:"linear-gradient(135deg,#713f12,#ca8a04)",    series:"Naruto",       style:"🌀 4TH HOKAGE" },
  { id:"av_madara",   emoji:"🌑",   label:"Madara",      color:"#dc2626", bg:"linear-gradient(135deg,#1c1917,#7f1d1d)",    series:"Naruto",       style:"☯ UCHIHA" },
  // AOT
  { id:"av_eren",     emoji:"🪖",   label:"Eren",        color:"#78716c", bg:"linear-gradient(135deg,#1c1917,#44403c)",    series:"AOT",          style:"💀 TITAN" },
  { id:"av_mikasa",   emoji:"🔴",   label:"Mikasa",      color:"#ef4444", bg:"linear-gradient(135deg,#7f1d1d,#b91c1c)",    series:"AOT",          style:"🗡 ACKERMAN" },
  { id:"av_levi",     emoji:"🧹",   label:"Levi",        color:"#94a3b8", bg:"linear-gradient(135deg,#0f172a,#334155)",    series:"AOT",          style:"⚡ CAPTAIN" },
  { id:"av_armin",    emoji:"💡",   label:"Armin",       color:"#fde68a", bg:"linear-gradient(135deg,#713f12,#b45309)",    series:"AOT",          style:"🧠 STRATEGIST" },
  // DEMON SLAYER
  { id:"av_tanjiro",  emoji:"💧",   label:"Tanjiro",     color:"#0ea5e9", bg:"linear-gradient(135deg,#0c4a6e,#0284c7)",    series:"Demon Slayer", style:"🌊 WATER BREATH" },
  { id:"av_nezuko",   emoji:"🎋",   label:"Nezuko",      color:"#f9a8d4", bg:"linear-gradient(135deg,#500724,#be185d)",    series:"Demon Slayer", style:"🌸 BLOOD DEMON" },
  { id:"av_zenitsu",  emoji:"⚡",   label:"Zenitsu",     color:"#fde68a", bg:"linear-gradient(135deg,#713f12,#d97706)",    series:"Demon Slayer", style:"⚡ THUNDER" },
  { id:"av_rengoku",  emoji:"🔥",   label:"Rengoku",     color:"#f97316", bg:"linear-gradient(135deg,#7c2d12,#dc2626)",    series:"Demon Slayer", style:"🔥 FLAME PILLAR" },
  { id:"av_douma",    emoji:"🌸",   label:"Douma",       color:"#fb7185", bg:"linear-gradient(135deg,#4a044e,#9d174d)",    series:"Demon Slayer", style:"🌸 UPPER MOON" },
  // JJK
  { id:"av_gojo",     emoji:"♾️",   label:"Gojo",        color:"#ffffff", bg:"linear-gradient(135deg,#0a0a0a,#1e40af)",    series:"JJK",          style:"∞ INFINITY" },
  { id:"av_yuji",     emoji:"👊",   label:"Yuji",        color:"#ff2254", bg:"linear-gradient(135deg,#7f1d1d,#dc2626)",    series:"JJK",          style:"💪 DIVERGENT" },
  { id:"av_megumi",   emoji:"🐾",   label:"Megumi",      color:"#38bdf8", bg:"linear-gradient(135deg,#0c4a6e,#1d4ed8)",    series:"JJK",          style:"🐾 TEN SHADOWS" },
  { id:"av_sukuna",   emoji:"☯️",   label:"Sukuna",      color:"#ff2254", bg:"linear-gradient(135deg,#450a0a,#991b1b)",    series:"JJK",          style:"👹 KING OF CURSES" },
  { id:"av_nobara",   emoji:"🔨",   label:"Nobara",      color:"#fbbf24", bg:"linear-gradient(135deg,#78350f,#b45309)",    series:"JJK",          style:"🔩 STRAW DOLL" },
  // DEATH NOTE
  { id:"av_light",    emoji:"📓",   label:"Light",       color:"#fbbf24", bg:"linear-gradient(135deg,#713f12,#b45309)",    series:"Death Note",   style:"🖊 KIRA" },
  { id:"av_l",        emoji:"🍰",   label:"L",           color:"#e2e8f0", bg:"linear-gradient(135deg,#0a0a0a,#1f2937)",    series:"Death Note",   style:"🧠 DETECTIVE" },
  { id:"av_ryuk",     emoji:"🍎",   label:"Ryuk",        color:"#6366f1", bg:"linear-gradient(135deg,#1e1b4b,#312e81)",    series:"Death Note",   style:"😈 SHINIGAMI" },
  // SOLO LEVELING
  { id:"av_jinwoo",   emoji:"🗡️",   label:"Sung Jinwoo", color:"#818cf8", bg:"linear-gradient(135deg,#1e1b4b,#4338ca)",    series:"Solo Leveling", style:"👤 SHADOW MONARCH" },
  { id:"av_beru",     emoji:"🐜",   label:"Beru",        color:"#22c55e", bg:"linear-gradient(135deg,#14532d,#166534)",    series:"Solo Leveling", style:"🐜 SHADOW KNIGHT" },
  // CHAINSAW MAN
  { id:"av_denji",    emoji:"🪚",   label:"Denji",       color:"#fca5a5", bg:"linear-gradient(135deg,#7f1d1d,#b91c1c)",    series:"Chainsaw Man", style:"🪚 CHAINSAW DEVIL" },
  { id:"av_power",    emoji:"🩸",   label:"Power",       color:"#ff2254", bg:"linear-gradient(135deg,#450a0a,#dc2626)",    series:"Chainsaw Man", style:"🩸 BLOOD DEVIL" },
  { id:"av_aki",      emoji:"⛩️",   label:"Aki",         color:"#38bdf8", bg:"linear-gradient(135deg,#0c1a4e,#1d4ed8)",    series:"Chainsaw Man", style:"⛩ FUTURE DEVIL" },
  // HxH
  { id:"av_gon",      emoji:"🎣",   label:"Gon",         color:"#84cc16", bg:"linear-gradient(135deg,#1a2e05,#4d7c0f)",    series:"HxH",          style:"⚡ JAJANKEN" },
  { id:"av_killua",   emoji:"⚡",   label:"Killua",      color:"#7dd3fc", bg:"linear-gradient(135deg,#0c1a4e,#0e7490)",    series:"HxH",          style:"⚡ GODSPEED" },
  { id:"av_hisoka",   emoji:"🃏",   label:"Hisoka",      color:"#f43f5e", bg:"linear-gradient(135deg,#4a044e,#be185d)",    series:"HxH",          style:"🃏 BUNGEE GUM" },
  { id:"av_meruem",   emoji:"👑",   label:"Meruem",      color:"#a855f7", bg:"linear-gradient(135deg,#1e1b4b,#4c1d95)",    series:"HxH",          style:"👑 CHIMERA ANT" },
  // DRAGON BALL
  { id:"av_goku",     emoji:"🐉",   label:"Goku",        color:"#f59e0b", bg:"linear-gradient(135deg,#78350f,#d97706)",    series:"Dragon Ball",  style:"⚡ ULTRA INSTINCT" },
  { id:"av_vegeta",   emoji:"👸",   label:"Vegeta",      color:"#a855f7", bg:"linear-gradient(135deg,#1e1b4b,#7c3aed)",    series:"Dragon Ball",  style:"💎 SUPER SAIYAN" },
  { id:"av_broly",    emoji:"💚",   label:"Broly",       color:"#22c55e", bg:"linear-gradient(135deg,#14532d,#15803d)",    series:"Dragon Ball",  style:"💪 LEGENDARY" },
  // MHA
  { id:"av_deku",     emoji:"💪",   label:"Deku",        color:"#22d3ee", bg:"linear-gradient(135deg,#0c4a6e,#0e7490)",    series:"MHA",          style:"☀️ ONE FOR ALL" },
  { id:"av_bakugo",   emoji:"💥",   label:"Bakugo",      color:"#f97316", bg:"linear-gradient(135deg,#7c2d12,#c2410c)",    series:"MHA",          style:"💥 EXPLOSION" },
  { id:"av_todoroki", emoji:"❄️",   label:"Todoroki",    color:"#38bdf8", bg:"linear-gradient(135deg,#0c4a6e,#1e40af)",    series:"MHA",          style:"🔥❄ HALF-COLD" },
  // FMA
  { id:"av_ed",       emoji:"⚙️",   label:"Edward",      color:"#fcd34d", bg:"linear-gradient(135deg,#713f12,#b45309)",    series:"FMA",          style:"⚗ FULLMETAL" },
  { id:"av_roy",      emoji:"🔥",   label:"Roy Mustang", color:"#dc2626", bg:"linear-gradient(135deg,#7f1d1d,#b91c1c)",    series:"FMA",          style:"🔥 FLAME ALCH" },
  // MANHWA / MANHWA
  { id:"av_baam",     emoji:"🌀",   label:"Baam",        color:"#38bdf8", bg:"linear-gradient(135deg,#0c1a4e,#0284c7)",    series:"Tower of God", style:"🌀 IRREGULAR" },
  { id:"av_xiao",     emoji:"🔥",   label:"Xiao Yan",    color:"#f97316", bg:"linear-gradient(135deg,#7c2d12,#ea580c)",    series:"Battle Through", style:"🔥 HEAVENLY FLAME" },
  { id:"av_wanglin",  emoji:"⚡",   label:"Wang Lin",    color:"#a855f7", bg:"linear-gradient(135deg,#1e1b4b,#4c1d95)",    series:"Renegade",     style:"⚡ CELESTIAL" },
  { id:"av_mubai",    emoji:"🌑",   label:"Mu Bai",      color:"#94a3b8", bg:"linear-gradient(135deg,#0f172a,#334155)",    series:"Martial Peak",  style:"🗡 PEAK WARRIOR" },
  // SPY x FAMILY
  { id:"av_anya",     emoji:"🥜",   label:"Anya",        color:"#f9a8d4", bg:"linear-gradient(135deg,#4a044e,#86198f)",    series:"Spy x Family", style:"🧠 TELEPATH" },
  { id:"av_loid",     emoji:"🕵️",   label:"Loid",        color:"#6366f1", bg:"linear-gradient(135deg,#1e1b4b,#4338ca)",    series:"Spy x Family", style:"🎭 SPY" },
  // RE:ZERO
  { id:"av_rem",      emoji:"💙",   label:"Rem",         color:"#3b82f6", bg:"linear-gradient(135deg,#1e1b4b,#1d4ed8)",    series:"Re:Zero",      style:"💙 ONI" },
  { id:"av_subaru",   emoji:"♻️",   label:"Subaru",      color:"#94a3b8", bg:"linear-gradient(135deg,#0f172a,#1e293b)",    series:"Re:Zero",      style:"♻ RETURN BY DEATH" },
  // OVERLORD
  { id:"av_ainz",     emoji:"💀",   label:"Ainz",        color:"#a78bfa", bg:"linear-gradient(135deg,#0f0a1a,#4c1d95)",    series:"Overlord",     style:"💀 SORCERER KING" },
  // VINLAND
  { id:"av_thorfinn", emoji:"🪓",   label:"Thorfinn",    color:"#93c5fd", bg:"linear-gradient(135deg,#1e3a5f,#1d4ed8)",    series:"Vinland Saga", style:"🪓 ASKELADD" },
  { id:"av_askeladd", emoji:"⚔️",   label:"Askeladd",   color:"#94a3b8", bg:"linear-gradient(135deg,#1c1917,#374151)",    series:"Vinland Saga", style:"⚡ MERCENARY" },
  // BERSERK
  { id:"av_guts",     emoji:"🗡️",   label:"Guts",        color:"#d6d3d1", bg:"linear-gradient(135deg,#1c1917,#292524)",    series:"Berserk",      style:"⚔ BLACK SWORDSMAN" },
  { id:"av_griffith", emoji:"🦅",   label:"Griffith",    color:"#fde68a", bg:"linear-gradient(135deg,#713f12,#ca8a04)",    series:"Berserk",      style:"🌙 FEMTO" },
  // SAO
  { id:"av_kirito",   emoji:"🗡️",   label:"Kirito",      color:"#1e40af", bg:"linear-gradient(135deg,#1e1b4b,#1d4ed8)",    series:"SAO",          style:"⚔ DUAL BLADE" },
  { id:"av_asuna",    emoji:"⚡",   label:"Asuna",       color:"#ff6b9d", bg:"linear-gradient(135deg,#4a044e,#be185d)",    series:"SAO",          style:"⚡ LIGHTNING FLASH" },
  // FAIRY TAIL
  { id:"av_natsu",    emoji:"🔥",   label:"Natsu",       color:"#f97316", bg:"linear-gradient(135deg,#7c2d12,#ea580c)",    series:"Fairy Tail",   style:"🐉 DRAGON SLAYER" },
  { id:"av_erza",     emoji:"⚔️",   label:"Erza",        color:"#ef4444", bg:"linear-gradient(135deg,#7f1d1d,#b91c1c)",    series:"Fairy Tail",   style:"🛡 SCARLET" },
  // KONOSUBA
  { id:"av_kazuma",   emoji:"😅",   label:"Kazuma",      color:"#94a3b8", bg:"linear-gradient(135deg,#0f172a,#1e293b)",    series:"Konosuba",     style:"🎲 ADVENTURER" },
  { id:"av_aqua",     emoji:"💧",   label:"Aqua",        color:"#38bdf8", bg:"linear-gradient(135deg,#0c4a6e,#0284c7)",    series:"Konosuba",     style:"💧 GODDESS" },
  // 7 DEADLY SINS
  { id:"av_meliodas", emoji:"🐷",   label:"Meliodas",    color:"#22c55e", bg:"linear-gradient(135deg,#14532d,#15803d)",    series:"7DS",          style:"🐉 DRAGON SIN" },
  { id:"av_escanor",  emoji:"☀️",   label:"Escanor",     color:"#fde68a", bg:"linear-gradient(135deg,#713f12,#d97706)",    series:"7DS",          style:"☀ LION SIN" },
  // TENSEI SLIME
  { id:"av_rimuru",   emoji:"🧪",   label:"Rimuru",      color:"#06b6d4", bg:"linear-gradient(135deg,#0c4a6e,#0e7490)",    series:"Slime",        style:"🌀 DEMON LORD" },
  // BLACK CLOVER
  { id:"av_asta",     emoji:"⬛",   label:"Asta",        color:"#94a3b8", bg:"linear-gradient(135deg,#0f172a,#334155)",    series:"Black Clover", style:"⬛ ANTI-MAGIC" },
  { id:"av_yami",     emoji:"🌑",   label:"Yami",        color:"#1f2937", bg:"linear-gradient(135deg,#030712,#111827)",    series:"Black Clover", style:"🌑 DARK MAGIC" },
];

export const AVATAR_CATEGORIES = [
  { name:"🏴‍☠️ One Piece",   ids:["av_luffy","av_zoro","av_nami","av_sanji","av_shanks","av_ace"] },
  { name:"🦊 Naruto",       ids:["av_naruto","av_sasuke","av_itachi","av_minato","av_madara"] },
  { name:"🪖 AOT",          ids:["av_eren","av_mikasa","av_levi","av_armin"] },
  { name:"💧 Demon Slayer", ids:["av_tanjiro","av_nezuko","av_zenitsu","av_rengoku","av_douma"] },
  { name:"♾️ JJK",          ids:["av_gojo","av_yuji","av_megumi","av_sukuna","av_nobara"] },
  { name:"📓 Death Note",   ids:["av_light","av_l","av_ryuk"] },
  { name:"🗡️ Solo Leveling",ids:["av_jinwoo","av_beru"] },
  { name:"🪚 Chainsaw Man", ids:["av_denji","av_power","av_aki"] },
  { name:"🎣 HxH",          ids:["av_gon","av_killua","av_hisoka","av_meruem"] },
  { name:"🐉 Dragon Ball",  ids:["av_goku","av_vegeta","av_broly"] },
  { name:"💪 MHA",          ids:["av_deku","av_bakugo","av_todoroki"] },
  { name:"⚙️ FMA",          ids:["av_ed","av_roy"] },
  { name:"📚 Manhwa",       ids:["av_baam","av_xiao","av_wanglin","av_mubai"] },
  { name:"✨ More",          ids:["av_anya","av_loid","av_rem","av_subaru","av_ainz","av_thorfinn","av_askeladd","av_guts","av_griffith","av_kirito","av_asuna","av_natsu","av_erza","av_kazuma","av_aqua","av_meliodas","av_escanor","av_rimuru","av_asta","av_yami"] },
];

export const AVATAR_PRESETS = AVATARS.map(a => ({ id:a.id, emoji:a.emoji, bg:a.bg, label:a.label }));

export function getAvatar(id: string) {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}

// ─── ACHIEVEMENT LEAGUES ──────────────────────────────────────────────────────

const ACHIEVEMENT_LEAGUES = [
  { id:"bronze",    name:"Bronze",    icon:"🥉", color:"#cd7f32", minXP:0 },
  { id:"silver",    name:"Silver",    icon:"🥈", color:"#c0c0c0", minXP:200 },
  { id:"gold",      name:"Gold",      icon:"🥇", color:"#ffd700", minXP:500 },
  { id:"sapphire",  name:"Sapphire",  icon:"💎", color:"#0ea5e9", minXP:1000 },
  { id:"ruby",      name:"Ruby",      icon:"❤️‍🔥", color:"#e11d48", minXP:1800 },
  { id:"diamond",   name:"Diamond",   icon:"💠", color:"#a78bfa", minXP:3000 },
  { id:"obsidian",  name:"Obsidian",  icon:"🖤", color:"#6b7280", minXP:5000 },
  { id:"legendary", name:"Legendary", icon:"👑", color:"#fbbf24", minXP:10000 },
];

const DUOLINGO_CHALLENGES = [
  { id:"c1", name:"Daily Grinder",   icon:"💪", desc:"Log errors 3 days in a row",       xp:50,  progress:2, goal:3 },
  { id:"c2", name:"Chapter Cleaner", icon:"🧹", desc:"Master all errors in one chapter",  xp:100, progress:1, goal:5 },
  { id:"c3", name:"Speed Logger",    icon:"⚡", desc:"Log 5 errors within an hour",       xp:75,  progress:3, goal:5 },
  { id:"c4", name:"Review Warrior",  icon:"⚔️", desc:"Complete 10 revision sessions",     xp:120, progress:7, goal:10 },
  { id:"c5", name:"Perfect Day",     icon:"🌟", desc:"Log 3+ entries for 7 days",         xp:200, progress:4, goal:7 },
  { id:"c6", name:"Subject Master",  icon:"📚", desc:"Master 5 errors in every subject",  xp:150, progress:2, goal:3 },
];

const DAILY_QUESTS = [
  { id:"q1", name:"Morning Warrior", icon:"☀️", desc:"Log an error before noon",           xp:20, done:true },
  { id:"q2", name:"Triple Threat",   icon:"🎯", desc:"Log 3 errors today",                 xp:30, done:false },
  { id:"q3", name:"Revision Run",    icon:"🔁", desc:"Review 2 errors",                    xp:25, done:false },
  { id:"q4", name:"Reflect & Learn", icon:"💭", desc:"Fill 'Why I made this mistake'",     xp:15, done:true },
];

const STREAK_REWARDS = [
  { days:3,   reward:"🔥 Flame Badge",    xp:50 },
  { days:7,   reward:"⚡ Week Warrior",   xp:100 },
  { days:14,  reward:"💪 Fortnight King", xp:200 },
  { days:30,  reward:"🏆 Monthly Legend", xp:500 },
  { days:100, reward:"👑 Century God",    xp:2000 },
];

// ─── AVATAR DISPLAY ───────────────────────────────────────────────────────────

export function AvatarDisplay({ avatar, photoURL, displayName, size = 40, style = {} }: any) {
  const av = getAvatar(avatar);
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName || "avatar"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${av.color}55`,
          ...style,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: av.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.44,
      flexShrink: 0,
      border: `2px solid ${av.color}44`,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      <span style={{ lineHeight: 1 }}>{av.emoji}</span>
    </div>
  );
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function Glass({ children, style = {} }: any) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Panel({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      width: "100%",
      maxWidth: wide ? 560 : 440,
      maxHeight: "94vh",
      overflowY: "auto",
      scrollbarWidth: "none" as any,
      background: "rgba(8,12,24,0.97)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      padding: 24,
    }}>
      {children}
    </div>
  );
}

function MenuSection({ title }: { title: string }) {
  return title
    ? <div style={{ fontSize:10, color:"#334155", letterSpacing:1.5, marginTop:14, marginBottom:4, paddingLeft:4 }}>{title}</div>
    : <div style={{ marginTop:10 }} />;
}

function MenuItem({ icon, label, sub, onClick, badge }: { icon:string; label:string; sub?:string; onClick?:()=>void; badge?:string|number }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"12px 14px", borderRadius:12,
        background: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#64748b" }}>{sub}</div>}
      </div>
      {badge !== undefined && (
        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(255,34,84,0.2)", color:"#ff2254", fontWeight:700 }}>{badge}</span>
      )}
      <span style={{ fontSize:16, color:"#334155" }}>›</span>
    </div>
  );
}

const INP: React.CSSProperties = {
  width:"100%", padding:"11px 14px",
  background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, color:"#e2e8f0",
  fontSize:14, outline:"none",
  fontFamily:"inherit", boxSizing:"border-box",
};

// ─── MAIN PROFILE PANEL ───────────────────────────────────────────────────────

export function ProfilePanel({ user, xpData, streak, todayCount, onClose, onLogout, onUpdateProfile, LEVELS, BADGES, XP_REWARDS }: any) {
  type View = "main"|"edit"|"avatar"|"achievements"|"challenges"|"quests"|"streakRewards"|"security"|"privacy"|"notifications";
  const [view, setView] = useState<View>("main");
  const [editName, setEditName] = useState(user.displayName || user.email?.split("@")[0] || "Warrior");
  const [editBio, setEditBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("av_luffy");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [avatarCategory, setAvatarCategory] = useState("🏴‍☠️ One Piece");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notifications, setNotifications] = useState({ streakReminder:true, revisionDue:true, weeklyReport:false, badgeEarned:true });
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load from Firebase on open ────────────────────────────────────────────
  useEffect(() => {
    loadUserProfile(user.uid).then(profile => {
      if (!profile) return;
      if (profile.displayName) setEditName(profile.displayName);
      if (profile.avatar) setSelectedAvatar(profile.avatar);
      if (profile.photoURL !== undefined) setPhotoURL(profile.photoURL ?? null);
      if (profile.bio) setEditBio(profile.bio);
    });
  }, [user.uid]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Compress/resize before storing to keep Firestore size manageable
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setPhotoURL(ev.target?.result as string); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoURL(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const profileData = {
        displayName: editName.trim() || "Warrior",
        avatar: selectedAvatar,
        photoURL: photoURL,
        bio: editBio,
      };
      const ok = await saveUserProfile(user.uid, profileData);
      if (!ok) throw new Error("Save failed");
      // Update parent component state immediately
      onUpdateProfile(profileData);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setView("main");
      }, 1200);
    } catch (err: any) {
      setSaveError("Failed to save. Please try again.");
      console.error(err);
    }
    setSaving(false);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const currentLevel  = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1)) ?? LEVELS[0];
  const nextLevel     = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1) + 1);
  const progress      = nextLevel ? (((xpData?.totalXP??0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100;
  const currentLeague = [...ACHIEVEMENT_LEAGUES].reverse().find(l => (xpData?.totalXP??0) >= l.minXP) ?? ACHIEVEMENT_LEAGUES[0];
  const nextLeague    = ACHIEVEMENT_LEAGUES[ACHIEVEMENT_LEAGUES.indexOf(currentLeague) + 1];
  const leagueProgress = nextLeague ? (((xpData?.totalXP??0) - currentLeague.minXP) / (nextLeague.minXP - currentLeague.minXP)) * 100 : 100;
  const categoryAvatarIds = AVATAR_CATEGORIES.find(c => c.name === avatarCategory)?.ids ?? [];

  const BackBtn = () => (
    <button onClick={() => setView("main")} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", padding:0, marginRight:8 }}>←</button>
  );

  // ════ MAIN ════════════════════════════════════════════════════════════════
  if (view === "main") return (
    <Overlay onClose={onClose}>
      <div style={{ width:"100%", maxWidth:420, maxHeight:"94vh", overflowY:"auto", scrollbarWidth:"none" as any, background:"rgba(8,12,24,0.97)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>PROFILE</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer" }}>✕</button>
        </div>

        {/* Avatar hero */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:12, cursor:"pointer" }} onClick={() => setView("edit")}>
            <AvatarDisplay avatar={selectedAvatar} photoURL={photoURL} displayName={editName} size={88} />
            <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`3px solid ${currentLeague.color}`, pointerEvents:"none", boxShadow:`0 0 18px ${currentLeague.color}44` }} />
            <div style={{ position:"absolute", bottom:2, right:2, width:26, height:26, borderRadius:"50%", background:"#0d1117", border:"2px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{currentLevel.icon}</div>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"#e2e8f0", marginBottom:2 }}>{editName}</div>
          <div style={{ fontSize:12, color:"#475569", marginBottom:editBio?8:10 }}>{user.email}</div>
          {editBio && <div style={{ fontSize:12, color:"#64748b", fontStyle:"italic", marginBottom:10, padding:"6px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>"{editBio}"</div>}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 16px", borderRadius:20, background:`${currentLeague.color}18`, border:`1px solid ${currentLeague.color}44` }}>
            <span style={{ fontSize:14 }}>{currentLeague.icon}</span>
            <span style={{ fontSize:12, color:currentLeague.color, fontWeight:700 }}>{currentLeague.name} League</span>
          </div>
        </div>

        {/* XP bar */}
        <Glass style={{ padding:16, marginBottom:12, background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,212,255,0.05))", border:"1px solid rgba(124,58,237,0.25)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>{currentLevel.icon} {currentLevel.name}</span>
            <span style={{ fontSize:12, color:"#64748b" }}>Lv.{xpData?.level ?? 1}</span>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
            <div style={{ height:"100%", width:`${Math.min(progress,100)}%`, background:"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:3, transition:"width 1s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#475569" }}>
            <span>⚡ {xpData?.totalXP ?? 0} XP</span>
            <span>{nextLevel ? `${nextLevel.minXP} XP → ${nextLevel.name}` : "👑 MAX LEVEL"}</span>
          </div>
        </Glass>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          {[
            { label:"Streak", value:`${streak}🔥`,                     color:"#ffd700" },
            { label:"Today",  value:`${todayCount}/3`,                  color:todayCount>=3?"#22c55e":"#00d4ff" },
            { label:"Badges", value:`${(xpData?.badges??[]).length}🏅`, color:"#a855f7" },
          ].map(s => (
            <Glass key={s.label} style={{ padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:17, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{s.label}</div>
            </Glass>
          ))}
        </div>

        {/* Menu items */}
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <MenuSection title="ACCOUNT" />
          <MenuItem icon="✏️" label="Edit Profile"           sub="Name, bio & avatar"                             onClick={() => setView("edit")} />
          <MenuItem icon="🖼️" label="Choose Avatar"          sub={`${AVATARS.length} anime avatars`}              onClick={() => setView("avatar")} />
          <MenuItem icon="🔐" label="Security"               sub="Password & sessions"                            onClick={() => setView("security")} />

          <MenuSection title="PROGRESSION" />
          <MenuItem icon="🏆" label="Achievements & Leagues" sub={`${(xpData?.badges??[]).length} badges · ${currentLeague.name} League`} onClick={() => setView("achievements")} badge={(xpData?.badges??[]).length} />
          <MenuItem icon="⚔️" label="Weekly Challenges"      sub="6 active missions"                              onClick={() => setView("challenges")} badge="3 NEW" />
          <MenuItem icon="📜" label="Daily Quests"           sub={`${DAILY_QUESTS.filter(q=>q.done).length}/${DAILY_QUESTS.length} done today`} onClick={() => setView("quests")} />
          <MenuItem icon="🔥" label="Streak Rewards"         sub={`${streak}d streak · Next at ${STREAK_REWARDS.find(r=>r.days>streak)?.days??100}d`} onClick={() => setView("streakRewards")} />

          <MenuSection title="SETTINGS" />
          <MenuItem icon="🔔" label="Notifications"          sub="Reminders & alerts"                             onClick={() => setView("notifications")} />
          <MenuItem icon="🛡️" label="Privacy"                sub="Data & visibility"                              onClick={() => setView("privacy")} />

          <MenuSection title="" />
          <button onClick={onLogout} style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"left" as const }}>
            🚪 Log Out
          </button>
          <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#334155" }}>ErrorVerse v2.0 · Made with ⚡</div>
        </div>
      </div>
    </Overlay>
  );

  // ════ EDIT PROFILE ════════════════════════════════════════════════════════
  if (view === "edit") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>EDIT PROFILE</span>
        </div>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ position:"relative", display:"inline-block" }}>
            <AvatarDisplay avatar={selectedAvatar} photoURL={photoURL} displayName={editName} size={80} />
            <div style={{ position:"absolute", inset:-3, borderRadius:"50%", border:`3px solid ${currentLeague.color}`, pointerEvents:"none" }} />
          </div>
          <div style={{ marginTop:12, display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" as const }}>
            <button onClick={() => setView("avatar")} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(0,212,255,0.3)", background:"rgba(0,212,255,0.08)", color:"#00d4ff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🖼️ Change Avatar</button>
            <button onClick={() => fileRef.current?.click()} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(168,85,247,0.3)", background:"rgba(168,85,247,0.08)", color:"#a855f7", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>📷 Upload Photo</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload} />
          {photoURL && (
            <button onClick={() => setPhotoURL(null)} style={{ marginTop:8, padding:"5px 14px", borderRadius:8, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
              🗑 Remove Photo
            </button>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>DISPLAY NAME</label>
            <input style={INP} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your warrior name..." />
          </div>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>BIO</label>
            <textarea style={{ ...INP, height:72, resize:"none" } as any} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell the verse who you are..." />
          </div>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>EMAIL</label>
            <input style={{ ...INP, opacity:0.45, cursor:"not-allowed" }} value={user.email || ""} disabled />
          </div>
          {saveError && (
            <div style={{ fontSize:12, color:"#ff2254", padding:"8px 12px", background:"rgba(255,34,84,0.1)", borderRadius:8 }}>
              ⚠️ {saveError}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding:"13px", borderRadius:10, border:"none",
              background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : saving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#00d4ff,#7c3aed)",
              color: saving ? "#475569" : "#fff",
              fontFamily:"inherit", fontSize:14, fontWeight:800,
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing:1, transition:"all 0.3s",
            }}
          >
            {saving ? "SAVING..." : saved ? "✅ SAVED!" : "SAVE CHANGES"}
          </button>
        </div>
      </Panel>
    </Overlay>
  );

  // ════ AVATAR PICKER ═══════════════════════════════════════════════════════
  if (view === "avatar") return (
    <Overlay onClose={onClose}>
      <Panel wide>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <BackBtn />
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>CHOOSE AVATAR</span>
        </div>

        {/* Photo upload section */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:10, letterSpacing:1 }}>📷 UPLOAD YOUR PHOTO</div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"16px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
          >
            {photoURL ? (
              <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center" }}>
                <img src={photoURL} style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover" }} />
                <div>
                  <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600 }}>Photo uploaded ✓</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>Click to change</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
                <div style={{ fontSize:13, color:"#94a3b8" }}>Upload from gallery</div>
                <div style={{ fontSize:11, color:"#475569" }}>JPG, PNG, GIF — auto-compressed</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload} />
          {photoURL && (
            <button onClick={() => setPhotoURL(null)} style={{ marginTop:8, width:"100%", padding:"8px", borderRadius:8, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              🗑 Remove Photo
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div style={{ fontSize:11, color:"#64748b", marginBottom:10, letterSpacing:1 }}>🎭 ANIME / MANHWA AVATARS ({AVATARS.length} characters)</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const, marginBottom:14 }}>
          {AVATAR_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setAvatarCategory(cat.name)}
              style={{
                padding:"4px 10px", borderRadius:20,
                border:`1px solid ${avatarCategory===cat.name?"#00d4ff":"rgba(255,255,255,0.1)"}`,
                background:avatarCategory===cat.name?"rgba(0,212,255,0.12)":"transparent",
                color:avatarCategory===cat.name?"#00d4ff":"#64748b",
                fontSize:11, cursor:"pointer", fontFamily:"inherit",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Avatar grid — styled cards with series info */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {categoryAvatarIds.map(id => {
            const av = getAvatar(id);
            const selected = selectedAvatar === id && !photoURL;
            return (
              <div
                key={id}
                onClick={() => { setSelectedAvatar(id); setPhotoURL(null); }}
                style={{
                  cursor:"pointer", borderRadius:14,
                  border:`2px solid ${selected ? av.color : "rgba(255,255,255,0.06)"}`,
                  background: selected ? `${av.color}14` : "rgba(255,255,255,0.03)",
                  boxShadow: selected ? `0 0 20px ${av.color}44` : "none",
                  padding:12, textAlign:"center", transition:"all 0.2s",
                  position:"relative",
                }}
              >
                {selected && (
                  <div style={{ position:"absolute", top:6, right:6, width:16, height:16, borderRadius:"50%", background:av.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#000", fontWeight:900 }}>✓</div>
                )}
                <div style={{ width:52, height:52, borderRadius:"50%", background:av.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 8px", border:`2px solid ${av.color}44` }}>
                  {av.emoji}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color: selected ? av.color : "#e2e8f0" }}>{av.label}</div>
                <div style={{ fontSize:9, color: selected ? av.color : "#475569", marginTop:2, fontWeight:600, letterSpacing:0.5 }}>{(av as any).style}</div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setView("edit")}
          style={{ width:"100%", marginTop:20, padding:"12px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:"pointer" }}
        >
          CONFIRM AVATAR ✓
        </button>
      </Panel>
    </Overlay>
  );

  // ════ ACHIEVEMENTS ════════════════════════════════════════════════════════
  if (view === "achievements") {
    const earnedSet = new Set(xpData?.badges ?? []);
    return (
      <Overlay onClose={onClose}>
        <Panel wide>
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            <BackBtn />
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>ACHIEVEMENTS</span>
          </div>
          <Glass style={{ padding:16, marginBottom:20, background:`linear-gradient(135deg,${currentLeague.color}14,transparent)`, border:`1px solid ${currentLeague.color}33` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <span style={{ fontSize:44 }}>{currentLeague.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:800, color:currentLeague.color, fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>{currentLeague.name} League</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{xpData?.totalXP??0} XP{nextLeague ? ` · ${nextLeague.minXP-(xpData?.totalXP??0)} XP to ${nextLeague.name}` : " · MAX!"}</div>
              </div>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
              <div style={{ height:"100%", width:`${Math.min(leagueProgress,100)}%`, background:`linear-gradient(90deg,${currentLeague.color},${nextLeague?.color??currentLeague.color})`, borderRadius:4, transition:"width 1s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              {ACHIEVEMENT_LEAGUES.map(lg => {
                const unlocked = (xpData?.totalXP??0) >= lg.minXP;
                return (
                  <div key={lg.id} style={{ textAlign:"center", opacity:unlocked?1:0.3 }}>
                    <div style={{ fontSize:18 }}>{lg.icon}</div>
                    <div style={{ fontSize:8, color:unlocked?lg.color:"#475569", marginTop:2 }}>{lg.name}</div>
                  </div>
                );
              })}
            </div>
          </Glass>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:12, letterSpacing:1 }}>🏅 BADGES ({(xpData?.badges??[]).length}/{BADGES.length} earned)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
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

  // ════ CHALLENGES ══════════════════════════════════════════════════════════
  if (view === "challenges") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}><BackBtn /><span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>WEEKLY CHALLENGES</span></div>
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.25)", marginBottom:16, fontSize:12, color:"#c4b5fd" }}>⏳ Resets in <strong>3 days 14 hours</strong> · Complete all for +300 XP bonus!</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {DUOLINGO_CHALLENGES.map(c => {
            const done = c.progress >= c.goal;
            const pct = Math.min(100,(c.progress/c.goal)*100);
            return (
              <Glass key={c.id} style={{ padding:16, border:`1px solid ${done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}`, background:done?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <span style={{ fontSize:26 }}>{c.icon}</span>
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
                    <div style={{ height:"100%", width:`${pct}%`, background:done?"#22c55e":"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:3, transition:"width 0.8s" }} />
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

  // ════ DAILY QUESTS ════════════════════════════════════════════════════════
  if (view === "quests") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}><BackBtn /><span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>DAILY QUESTS</span></div>
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.2)", marginBottom:16, fontSize:12, color:"#fcd34d" }}>☀️ Resets at midnight · {DAILY_QUESTS.filter(q=>q.done).length}/{DAILY_QUESTS.length} completed today</div>
        <Glass style={{ padding:14, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:6 }}>
            <span>Daily XP Progress</span>
            <span style={{ color:"#ffd700", fontWeight:700 }}>{DAILY_QUESTS.filter(q=>q.done).reduce((a,q)=>a+q.xp,0)} / {DAILY_QUESTS.reduce((a,q)=>a+q.xp,0)} XP</span>
          </div>
          <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(DAILY_QUESTS.filter(q=>q.done).reduce((a,q)=>a+q.xp,0)/DAILY_QUESTS.reduce((a,q)=>a+q.xp,0))*100}%`, background:"linear-gradient(90deg,#fbbf24,#f97316)", borderRadius:4 }} />
          </div>
        </Glass>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {DAILY_QUESTS.map(q => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:q.done?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${q.done?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}` }}>
              <span style={{ fontSize:24 }}>{q.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:q.done?"#22c55e":"#e2e8f0" }}>{q.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{q.desc}</div>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <div style={{ fontSize:12, color:"#ffd700", fontWeight:700 }}>+{q.xp} XP</div>
                <div style={{ fontSize:14, marginTop:2 }}>{q.done?"✅":"○"}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Overlay>
  );

  // ════ STREAK REWARDS ══════════════════════════════════════════════════════
  if (view === "streakRewards") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}><BackBtn /><span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>STREAK REWARDS</span></div>
        <div style={{ textAlign:"center", marginBottom:20, padding:20, background:"rgba(255,215,0,0.06)", borderRadius:14, border:"1px solid rgba(255,215,0,0.2)" }}>
          <div style={{ fontSize:56, fontFamily:"'Bebas Neue',cursive", color:"#ffd700", lineHeight:1 }}>{streak}</div>
          <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>day streak 🔥</div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>Add 3+ entries daily to maintain</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {STREAK_REWARDS.map(r => {
            const reached = streak >= r.days;
            const isNext = !reached && STREAK_REWARDS.find(x => streak < x.days) === r;
            return (
              <div key={r.days} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:reached?"rgba(255,215,0,0.06)":isNext?"rgba(0,212,255,0.04)":"rgba(255,255,255,0.02)", border:`1px solid ${reached?"rgba(255,215,0,0.3)":isNext?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.05)"}` }}>
                <div style={{ width:46, height:46, borderRadius:12, background:reached?"rgba(255,215,0,0.15)":isNext?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                  {reached?"✅":isNext?"🎯":"🔒"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:reached?"#ffd700":isNext?"#00d4ff":"#475569" }}>{r.reward}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{r.days}d streak{!reached?` · ${r.days-streak} to go`:""}</div>
                </div>
                <div style={{ fontSize:13, color:"#ffd700", fontWeight:700, flexShrink:0 }}>+{r.xp} XP</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Overlay>
  );

  // ════ SECURITY ════════════════════════════════════════════════════════════
  if (view === "security") return <SecurityPanel user={user} onBack={() => setView("main")} onClose={onClose} onLogout={onLogout} />;

  // ════ NOTIFICATIONS ═══════════════════════════════════════════════════════
  if (view === "notifications") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}><BackBtn /><span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>NOTIFICATIONS</span></div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => {
            const labels: Record<string, { icon:string; label:string; sub:string }> = {
              streakReminder: { icon:"🔥", label:"Streak Reminder",  sub:"Daily reminder to keep streak alive" },
              revisionDue:    { icon:"📅", label:"Revision Due",     sub:"When errors are due for review" },
              weeklyReport:   { icon:"📊", label:"Weekly Report",    sub:"Summary of your weekly progress" },
              badgeEarned:    { icon:"🏅", label:"Badge Earned",     sub:"When you unlock a new badge" },
            };
            const lbl = labels[key];
            return (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize:22 }}>{lbl.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{lbl.label}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{lbl.sub}</div>
                </div>
                <div
                  onClick={() => setNotifications(n => ({ ...n, [key]:!n[key] }))}
                  style={{ width:44, height:24, borderRadius:12, background:val?"linear-gradient(90deg,#00d4ff,#7c3aed)":"rgba(255,255,255,0.1)", cursor:"pointer", transition:"all 0.3s", position:"relative", flexShrink:0 }}
                >
                  <div style={{ position:"absolute", top:2, left:val?20:2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Overlay>
  );

  // ════ PRIVACY ═════════════════════════════════════════════════════════════
  if (view === "privacy") return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}><BackBtn /><span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>PRIVACY</span></div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"👁️", label:"Leaderboard Visibility", sub:"Show your name on leaderboard" },
            { icon:"📊", label:"Share Analytics",         sub:"Allow community insights" },
            { icon:"💾", label:"Export My Data",          sub:"Download all your error entries" },
            { icon:"🧹", label:"Clear All Data",          sub:"Remove all errors and stats" },
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

// ─── SECURITY PANEL (full working Firebase Auth) ──────────────────────────────

type SecView = "main" | "changePassword" | "verifyEmail" | "resetPassword" | "sessions" | "deleteAccount";

function SecurityPanel({ user, onBack, onClose, onLogout }: { user:any; onBack:()=>void; onClose:()=>void; onLogout:()=>void }) {
  const [secView, setSecView] = useState<SecView>("main");

  const BackToSec = () => (
    <button onClick={() => setSecView("main")} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", padding:0, marginRight:8 }}>←</button>
  );

  const INP_S: React.CSSProperties = {
    width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)",
    border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e2e8f0",
    fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  };

  // ── CHANGE PASSWORD ─────────────────────────────────────────────────────
  function ChangePasswordView() {
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
    const [msg, setMsg] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const strength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw) ? 4 : 3;
    const strengthColor = ["transparent","#ff2254","#ffd700","#22c55e","#00d4ff"][strength];
    const strengthLabel = ["","Weak","Fair","Strong","Unbreakable"][strength];

    const handle = async () => {
      if (!currentPw) { setMsg("Enter your current password."); setStatus("error"); return; }
      if (newPw.length < 6) { setMsg("New password must be at least 6 characters."); setStatus("error"); return; }
      if (newPw !== confirmPw) { setMsg("Passwords don't match."); setStatus("error"); return; }
      if (newPw === currentPw) { setMsg("New password must be different from current."); setStatus("error"); return; }
      setStatus("loading"); setMsg("");
      try {
        
        const u = auth.currentUser;
        if (!u || !u.email) throw new Error("Not authenticated");
        const cred = EmailAuthProvider.credential(u.email, currentPw);
        await reauthenticateWithCredential(u, cred);
        await updatePassword(u, newPw);
        setStatus("success"); setMsg("Password updated successfully! 🔒");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } catch(e: any) {
        setStatus("error");
        if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") setMsg("Current password is incorrect.");
        else if (e.code === "auth/too-many-requests") setMsg("Too many attempts. Try again later.");
        else if (e.code === "auth/requires-recent-login") setMsg("Session expired. Please log out and log back in.");
        else setMsg(e.message || "Something went wrong.");
      }
    };

    return (
      <Overlay onClose={onClose}>
        <Panel>
          <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
            <BackToSec />
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>CHANGE PASSWORD</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Current password */}
            <div>
              <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>CURRENT PASSWORD</label>
              <div style={{ position:"relative" }}>
                <input
                  style={INP_S} type={showCurrent?"text":"password"}
                  placeholder="Enter current password"
                  value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                />
                <button onClick={() => setShowCurrent(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:16 }}>
                  {showCurrent ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>NEW PASSWORD</label>
              <div style={{ position:"relative" }}>
                <input
                  style={INP_S} type={showNew?"text":"password"}
                  placeholder="Min. 6 characters"
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                />
                <button onClick={() => setShowNew(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:16 }}>
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
              {/* Strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<=strength?strengthColor:"rgba(255,255,255,0.06)", transition:"all 0.3s" }} />
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:strengthColor, fontWeight:600 }}>{strengthLabel}</div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>CONFIRM NEW PASSWORD</label>
              <input
                style={{ ...INP_S, borderColor: confirmPw && confirmPw !== newPw ? "#ff2254" : confirmPw && confirmPw === newPw ? "#22c55e" : "rgba(255,255,255,0.1)" }}
                type="password" placeholder="Repeat new password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle()}
              />
              {confirmPw && (
                <div style={{ fontSize:11, color: confirmPw === newPw ? "#22c55e" : "#ff2254", marginTop:4 }}>
                  {confirmPw === newPw ? "✓ Passwords match" : "✗ Passwords don't match"}
                </div>
              )}
            </div>

            {msg && (
              <div style={{ fontSize:12, padding:"10px 14px", borderRadius:10, background:`rgba(${status==="success"?"34,197,94":"255,34,84"},0.1)`, border:`1px solid rgba(${status==="success"?"34,197,94":"255,34,84"},0.3)`, color: status==="success" ? "#22c55e" : "#ff2254" }}>
                {msg}
              </div>
            )}

            <button
              onClick={handle}
              disabled={status === "loading"}
              style={{ padding:"13px", borderRadius:10, border:"none", background: status==="loading" ? "rgba(255,255,255,0.05)" : status==="success" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", color: status==="loading" ? "#475569" : "#fff", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor: status==="loading" ? "not-allowed" : "pointer", letterSpacing:1 }}
            >
              {status === "loading" ? "UPDATING..." : status === "success" ? "✅ UPDATED!" : "UPDATE PASSWORD"}
            </button>

            {/* Forgot password link */}
            <div style={{ textAlign:"center" }}>
              <button
                onClick={async () => {
                  try {
                    await sendPasswordResetEmail(auth, user.email);
                    setStatus("success"); setMsg("Reset email sent to " + user.email);
                  } catch { setStatus("error"); setMsg("Failed to send reset email."); }
                }}
                style={{ background:"none", border:"none", color:"#64748b", fontSize:12, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}
              >
                Forgot current password? Send reset email
              </button>
            </div>
          </div>
        </Panel>
      </Overlay>
    );
  }

  // ── EMAIL VERIFICATION ──────────────────────────────────────────────────
  function VerifyEmailView() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const isVerified = auth.currentUser?.emailVerified ?? user.emailVerified;

    const handleSend = async () => {
      setLoading(true); setError("");
      try {
        const u = auth.currentUser;
        if (!u) throw new Error("Not authenticated");
        await sendEmailVerification(u);
        setSent(true);
      } catch(e: any) {
        if (e.code === "auth/too-many-requests") setError("Too many requests. Wait a few minutes.");
        else setError(e.message || "Failed to send verification email.");
      }
      setLoading(false);
    };

    return (
      <Overlay onClose={onClose}>
        <Panel>
          <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
            <BackToSec />
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>EMAIL VERIFICATION</span>
          </div>

          {/* Status card */}
          <div style={{ padding:24, borderRadius:16, marginBottom:20, textAlign:"center", background: isVerified ? "rgba(34,197,94,0.08)" : "rgba(255,215,0,0.06)", border:`1px solid ${isVerified?"rgba(34,197,94,0.3)":"rgba(255,215,0,0.25)"}` }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{isVerified ? "✅" : "📧"}</div>
            <div style={{ fontSize:16, fontWeight:800, color: isVerified ? "#22c55e" : "#ffd700", fontFamily:"'Bebas Neue',cursive", letterSpacing:2, marginBottom:8 }}>
              {isVerified ? "EMAIL VERIFIED" : "EMAIL NOT VERIFIED"}
            </div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:4 }}>{user.email}</div>
            {!isVerified && <div style={{ fontSize:12, color:"#64748b", marginTop:8 }}>Verify your email to secure your account and unlock all features.</div>}
          </div>

          {!isVerified && (
            <>
              {sent ? (
                <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", marginBottom:16 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#22c55e", marginBottom:4 }}>✉️ Verification email sent!</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>Check your inbox at <strong style={{ color:"#94a3b8" }}>{user.email}</strong>. Click the link to verify. Then reload the app.</div>
                </div>
              ) : error ? (
                <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(255,34,84,0.08)", border:"1px solid rgba(255,34,84,0.25)", marginBottom:16, fontSize:12, color:"#ff2254" }}>{error}</div>
              ) : null}
              <button
                onClick={handleSend}
                disabled={loading || sent}
                style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background: sent ? "rgba(255,255,255,0.05)" : loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", color: (sent||loading) ? "#475569" : "#fff", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor:(sent||loading)?"not-allowed":"pointer", letterSpacing:1 }}
              >
                {loading ? "SENDING..." : sent ? "EMAIL SENT ✓" : "SEND VERIFICATION EMAIL"}
              </button>
              <button
                onClick={() => { auth.currentUser?.reload().then(() => { if(auth.currentUser?.emailVerified) setSecView("main"); }); }}
                style={{ width:"100%", marginTop:10, padding:"11px", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"#64748b", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}
              >
                I've verified — Refresh status
              </button>
            </>
          )}
        </Panel>
      </Overlay>
    );
  }

  // ── ACTIVE SESSIONS ─────────────────────────────────────────────────────
  function SessionsView() {
    
    const currentUser = auth.currentUser;
    const signInTime = currentUser?.metadata?.lastSignInTime;
    const creationTime = currentUser?.metadata?.creationTime;

    const formatDate = (str?: string) => {
      if (!str) return "Unknown";
      return new Date(str).toLocaleString(undefined, { dateStyle:"medium", timeStyle:"short" });
    };

    return (
      <Overlay onClose={onClose}>
        <Panel>
          <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
            <BackToSec />
            <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>ACTIVE SESSIONS</span>
          </div>

          {/* Current session */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>CURRENT SESSION</div>
            <div style={{ padding:"16px", borderRadius:14, background:"rgba(0,212,255,0.06)", border:"1px solid rgba(0,212,255,0.2)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(0,212,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💻</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>This Device</div>
                  <div style={{ fontSize:11, color:"#00d4ff" }}>● Active now</div>
                </div>
                <div style={{ fontSize:10, padding:"3px 10px", borderRadius:20, background:"rgba(0,212,255,0.15)", color:"#00d4ff", fontWeight:700 }}>CURRENT</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { label:"Email", value: currentUser?.email || "—" },
                  { label:"Last sign in", value: formatDate(signInTime) },
                  { label:"Account created", value: formatDate(creationTime) },
                  { label:"UID", value: currentUser?.uid?.slice(0,16)+"..." || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12 }}>
                    <span style={{ color:"#64748b" }}>{r.label}</span>
                    <span style={{ color:"#94a3b8", fontFamily:r.label==="UID"?"monospace":"inherit", fontSize:r.label==="UID"?10:12 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info box */}
          <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", marginBottom:16, fontSize:12, color:"#64748b", lineHeight:1.5 }}>
            ℹ️ Firebase Authentication manages your sessions. To sign out all other devices, change your password — this invalidates existing tokens on other devices.
          </div>

          {/* Sign out current */}
          <button
            onClick={async () => {
              try { await signOut(auth); onLogout(); } catch {}
            }}
            style={{ width:"100%", padding:"12px", borderRadius:10, border:"1px solid rgba(255,34,84,0.3)", background:"rgba(255,34,84,0.08)", color:"#ff2254", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer" }}
          >
            🚪 Sign Out This Device
          </button>
        </Panel>
      </Overlay>
    );
  }

  // ── DELETE ACCOUNT ──────────────────────────────────────────────────────
  function DeleteAccountView() {
    const [step, setStep] = useState<"confirm"|"reauth"|"deleting"|"done">("confirm");
    const [password, setPassword] = useState("");
    const [typed, setTyped] = useState("");
    const [error, setError] = useState("");
    const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

    const handleDelete = async () => {
      if (!password) { setError("Enter your password."); return; }
      setStep("deleting"); setError("");
      try {
        
        const u = auth.currentUser;
        if (!u || !u.email) throw new Error("Not authenticated");
        // Re-authenticate first
        const cred = EmailAuthProvider.credential(u.email, password);
        await reauthenticateWithCredential(u, cred);
        // Delete all user data from Firestore
        const uid = u.uid;
        const colls = ["errors","collection","dailyActivity","revisionLogs","userXP","leaderboard","userProfiles"];
        for (const col of colls) {
          try {
            const q = query(collection(db, col), where("userId", "==", uid));
            const snap = await getDocs(q);
            for (const d of snap.docs) await deleteDoc(d.ref);
            // Also try direct doc
            await deleteDoc(doc(db, col, uid));
          } catch {}
        }
        // Delete Firebase Auth user
        await deleteUser(u);
        setStep("done");
        setTimeout(() => onLogout(), 2000);
      } catch(e: any) {
        setStep("reauth");
        if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") setError("Incorrect password.");
        else if (e.code === "auth/too-many-requests") setError("Too many attempts. Try later.");
        else if (e.code === "auth/requires-recent-login") setError("Session expired. Log out and back in first.");
        else setError(e.message || "Failed to delete account.");
      }
    };

    return (
      <Overlay onClose={onClose}>
        <Panel>
          <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
            {step !== "deleting" && step !== "done" && <BackToSec />}
            <span style={{ fontSize:18, fontWeight:800, color:"#ff2254", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>DELETE ACCOUNT</span>
          </div>

          {step === "done" && (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>💀</div>
              <div style={{ fontSize:20, fontWeight:800, color:"#ff2254", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>ACCOUNT DELETED</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:8 }}>All your data has been erased. Redirecting...</div>
            </div>
          )}

          {step === "deleting" && (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:40, marginBottom:16, animation:"pulse 1s infinite" }}>🗑️</div>
              <div style={{ fontSize:14, color:"#94a3b8" }}>Erasing all your data...</div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:8 }}>This may take a moment.</div>
            </div>
          )}

          {(step === "confirm" || step === "reauth") && (
            <>
              {/* Warning box */}
              <div style={{ padding:"16px", borderRadius:14, marginBottom:20, background:"rgba(255,34,84,0.08)", border:"1px solid rgba(255,34,84,0.3)" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#ff2254", marginBottom:10 }}>⚠️ This action is PERMANENT</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["All your error entries will be deleted","Your XP, badges and streak will be lost","Your collection will be removed","Your leaderboard position will be erased","This cannot be undone"].map(w => (
                    <div key={w} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:12, color:"#94a3b8" }}>
                      <span style={{ color:"#ff2254", flexShrink:0, marginTop:1 }}>✗</span>{w}
                    </div>
                  ))}
                </div>
              </div>

              {/* Type confirmation */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>
                  TYPE <span style={{ color:"#ff2254", fontWeight:800 }}>{CONFIRM_PHRASE}</span> TO CONFIRM
                </label>
                <input
                  style={{ ...INP_S, borderColor: typed === CONFIRM_PHRASE ? "#ff2254" : "rgba(255,255,255,0.1)" }}
                  placeholder={CONFIRM_PHRASE}
                  value={typed}
                  onChange={e => setTyped(e.target.value.toUpperCase())}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:6, letterSpacing:1 }}>YOUR PASSWORD</label>
                <input
                  style={INP_S}
                  type="password"
                  placeholder="Confirm with your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && typed === CONFIRM_PHRASE && handleDelete()}
                />
              </div>

              {error && (
                <div style={{ fontSize:12, padding:"10px 14px", borderRadius:10, background:"rgba(255,34,84,0.08)", border:"1px solid rgba(255,34,84,0.25)", color:"#ff2254", marginBottom:14 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleDelete}
                disabled={typed !== CONFIRM_PHRASE || !password}
                style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background: typed === CONFIRM_PHRASE && password ? "linear-gradient(135deg,#7f1d1d,#dc2626)" : "rgba(255,255,255,0.05)", color: typed === CONFIRM_PHRASE && password ? "#fff" : "#475569", fontFamily:"inherit", fontSize:14, fontWeight:800, cursor: typed === CONFIRM_PHRASE && password ? "pointer" : "not-allowed", letterSpacing:1 }}
              >
                💀 PERMANENTLY DELETE ACCOUNT
              </button>

              <button
                onClick={() => setSecView("main")}
                style={{ width:"100%", marginTop:10, padding:"11px", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"#64748b", fontFamily:"inherit", fontSize:13, cursor:"pointer" }}
              >
                Cancel — Keep My Account
              </button>
            </>
          )}
        </Panel>
      </Overlay>
    );
  }

  // ── MAIN SECURITY MENU ──────────────────────────────────────────────────
  if (secView === "changePassword") return <ChangePasswordView />;
  if (secView === "verifyEmail")    return <VerifyEmailView />;
  if (secView === "sessions")       return <SessionsView />;
  if (secView === "deleteAccount")  return <DeleteAccountView />;

  
  const isVerified = auth.currentUser?.emailVerified ?? user.emailVerified;

  return (
    <Overlay onClose={onClose}>
      <Panel>
        <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", padding:0, marginRight:8 }}>←</button>
          <span style={{ fontSize:18, fontWeight:800, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>SECURITY</span>
        </div>

        {/* Security score */}
        {(() => {
          const score = (isVerified ? 50 : 0) + 30 + (user.email ? 20 : 0);
          const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#ffd700" : "#ff2254";
          const scoreLabel = score >= 80 ? "Strong" : score >= 50 ? "Fair" : "Weak";
          return (
            <div style={{ padding:"16px", borderRadius:14, marginBottom:20, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", marginBottom:2 }}>Account Security</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>Protect your ErrorVerse account</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:scoreColor, fontFamily:"'Bebas Neue',cursive" }}>{score}%</div>
                  <div style={{ fontSize:10, color:scoreColor, fontWeight:700 }}>{scoreLabel}</div>
                </div>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${score}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}cc)`, borderRadius:3, transition:"width 1s" }} />
              </div>
            </div>
          );
        })()}

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {/* Change password */}
          <div
            onClick={() => setSecView("changePassword")}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(0,212,255,0.04)", border:"1px solid rgba(0,212,255,0.12)", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(0,212,255,0.08)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(0,212,255,0.04)"}
          >
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(0,212,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔑</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>Change Password</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Update your account password</div>
            </div>
            <span style={{ fontSize:16, color:"#334155" }}>›</span>
          </div>

          {/* Email verification */}
          <div
            onClick={() => setSecView("verifyEmail")}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background: isVerified ? "rgba(34,197,94,0.04)" : "rgba(255,215,0,0.06)", border: `1px solid ${isVerified?"rgba(34,197,94,0.15)":"rgba(255,215,0,0.25)"}`, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.opacity="0.85"}
            onMouseLeave={e=>(e.currentTarget as any).style.opacity="1"}
          >
            <div style={{ width:42, height:42, borderRadius:12, background: isVerified ? "rgba(34,197,94,0.12)" : "rgba(255,215,0,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📧</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>Email Verification</div>
              <div style={{ fontSize:11, color: isVerified ? "#22c55e" : "#ffd700" }}>{isVerified ? "✓ Verified" : "⚠ Not verified — tap to verify"}</div>
            </div>
            <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, background: isVerified ? "rgba(34,197,94,0.15)" : "rgba(255,215,0,0.15)", color: isVerified ? "#22c55e" : "#ffd700", fontWeight:700 }}>
              {isVerified ? "DONE" : "ACTION"}
            </span>
          </div>

          {/* Active sessions */}
          <div
            onClick={() => setSecView("sessions")}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(168,85,247,0.04)", border:"1px solid rgba(168,85,247,0.12)", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(168,85,247,0.08)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(168,85,247,0.04)"}
          >
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(168,85,247,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📱</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>Active Sessions</div>
              <div style={{ fontSize:11, color:"#64748b" }}>View account info & sign out</div>
            </div>
            <span style={{ fontSize:16, color:"#334155" }}>›</span>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"8px 0" }} />

          {/* Delete account - danger */}
          <div
            onClick={() => setSecView("deleteAccount")}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, background:"rgba(255,34,84,0.05)", border:"1px solid rgba(255,34,84,0.2)", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(255,34,84,0.1)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(255,34,84,0.05)"}
          >
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,34,84,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💀</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#ff2254" }}>Delete Account</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Permanently erase all data</div>
            </div>
            <span style={{ fontSize:16, color:"#7f1d1d" }}>›</span>
          </div>
        </div>
      </Panel>
    </Overlay>
  );
}



export function XPTapPanel({ xpData, streak, onClose, LEVELS, BADGES }: any) {
  const currentLevel = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1)) ?? LEVELS[0];
  const nextLevel    = LEVELS.find((l:any) => l.level === (xpData?.level ?? 1) + 1);
  const progress     = nextLevel ? (((xpData?.totalXP??0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100;
  const earnedSet    = new Set(xpData?.badges ?? []);
  const currentLeague = [...ACHIEVEMENT_LEAGUES].reverse().find(l => (xpData?.totalXP??0) >= l.minXP) ?? ACHIEVEMENT_LEAGUES[0];

  return (
    <Overlay onClose={onClose}>
      <div style={{ width:"100%", maxWidth:360, maxHeight:"88vh", overflowY:"auto", scrollbarWidth:"none" as any }}>
        <div style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(0,212,255,0.05))", border:"1px solid rgba(124,58,237,0.3)", borderRadius:16, padding:24, marginBottom:12, textAlign:"center", position:"relative" as const }}>
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>✕</button>
          <div style={{ fontSize:52, marginBottom:8 }}>{currentLevel.icon}</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", fontFamily:"'Bebas Neue',cursive", letterSpacing:3 }}>{currentLevel.name?.toUpperCase()}</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 12px", borderRadius:20, background:`${currentLeague.color}18`, border:`1px solid ${currentLeague.color}33`, marginBottom:12 }}>
            <span style={{ fontSize:12 }}>{currentLeague.icon}</span>
            <span style={{ fontSize:11, color:currentLeague.color, fontWeight:700 }}>{currentLeague.name} League · Lv.{xpData?.level ?? 1}</span>
          </div>
          <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:5, overflow:"hidden", marginBottom:8 }}>
            <div style={{ height:"100%", width:`${Math.min(progress,100)}%`, background:"linear-gradient(90deg,#7c3aed,#00d4ff)", borderRadius:5, transition:"width 1.2s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#475569" }}>
            <span>⚡ {xpData?.totalXP ?? 0} XP</span>
            <span>{nextLevel ? `${nextLevel.minXP} for ${nextLevel.name}` : "👑 MAX"}</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            { icon:"🔥", label:"Streak",  val:`${streak} days`,                     color:"#ffd700" },
            { icon:"🏅", label:"Badges",  val:`${earnedSet.size}/${BADGES.length}`,  color:"#a855f7" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px", textAlign:"center" as const }}>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:"'Bebas Neue',cursive" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:12 }}>🏅 EARNED BADGES</div>
          {BADGES.filter((b:any) => earnedSet.has(b.id)).length === 0
            ? <div style={{ fontSize:12, color:"#475569", textAlign:"center", padding:"12px 0" }}>No badges yet — start logging! ⚡</div>
            : BADGES.filter((b:any) => earnedSet.has(b.id)).map((b:any) => (
                <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#ffd700" }}>{b.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{b.desc}</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </Overlay>
  );
}