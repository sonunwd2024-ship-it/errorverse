import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ErrorEntry {
  id?: string;
  userId: string;
  subject: "Physics" | "Chemistry" | "Math" | "Other";
  chapter: string;
  questionType: "Numerical" | "Theory" | "Proof" | "MCQ";
  mistakeType: "Conceptual" | "Calculation" | "Silly mistake" | "Time pressure";
  difficulty: "Easy" | "Medium" | "Hard";
  solution: string;
  lesson: string;
  whyMistake: string;
  formula: string;
  imageUrl?: string;
  date: string;
  masteryLevel: number;        // 0–100
  masteryStage: "red" | "yellow" | "green"; // <40 | 40-74 | 75+
  nextReviewDate: string;      // ISO date string
  reviewHistory: string[];     // array of ISO date strings when reviewed
  revisionInterval: number;    // current interval in days (1 → 3 → 7 → 15 → 30)
  isArchived: boolean;
  createdAt?: unknown;
}

export interface UserXP {
  userId: string;
  totalXP: number;
  level: number;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  unlockedThemes: string[];
  updatedAt?: unknown;
}

export interface RevisionLog {
  userId: string;
  errorId: string;
  reviewedAt: string;
  result: "mastered" | "skipped" | "reviewed";
  xpEarned: number;
}

// ─── XP CONFIG ───────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  addError: 10,
  reviewError: 15,
  masterError: 25,
  streakBonus: 5,        // per streak day bonus
  dailyGoal: 30,         // completing 3+ entries
} as const;

export const LEVELS = [
  { level: 1, name: "Beginner",     minXP: 0,    icon: "🐣" },
  { level: 2, name: "Learner",      minXP: 200,  icon: "📖" },
  { level: 3, name: "Hustler",      minXP: 500,  icon: "💪" },
  { level: 4, name: "Error Slayer", minXP: 1000, icon: "⚡" },
  { level: 5, name: "Master",       minXP: 1800, icon: "🎯" },
  { level: 6, name: "Error God",    minXP: 3000, icon: "👑" },
] as const;

export const BADGES = [
  { id: "first_error",    name: "First Blood",    desc: "Log your first error",          icon: "🩸", condition: (xp: UserXP, errors: ErrorEntry[]) => errors.length >= 1 },
  { id: "on_fire",        name: "On Fire",         desc: "7-day streak",                  icon: "🔥", condition: (xp: UserXP) => xp.currentStreak >= 7 },
  { id: "big_brain",      name: "Big Brain",       desc: "Master 20 errors",              icon: "🧠", condition: (_: UserXP, errors: ErrorEntry[]) => errors.filter(e => e.masteryStage === "green").length >= 20 },
  { id: "speed_runner",   name: "Speed Runner",    desc: "Add 10 errors in one day",     icon: "⚡", condition: () => false }, // checked separately
  { id: "chem_wizard",    name: "Chem Wizard",     desc: "Master 10 Chemistry errors",    icon: "⚗️", condition: (_: UserXP, errors: ErrorEntry[]) => errors.filter(e => e.subject === "Chemistry" && e.masteryStage === "green").length >= 10 },
  { id: "perfect_week",   name: "Perfect Week",    desc: "Log errors for 7 days straight",icon: "🌟", condition: (xp: UserXP) => xp.currentStreak >= 7 },
  { id: "centurion",      name: "Centurion",       desc: "Log 100 total errors",          icon: "💯", condition: (_: UserXP, errors: ErrorEntry[]) => errors.length >= 100 },
  { id: "error_god",      name: "Error God",       desc: "Reach Level 6",                icon: "👑", condition: (xp: UserXP) => xp.level >= 6 },
] as const;

// Spaced repetition intervals (days)
const REVIEW_INTERVALS = [1, 3, 7, 15, 30];

function getNextInterval(currentInterval: number): number {
  const idx = REVIEW_INTERVALS.indexOf(currentInterval);
  return REVIEW_INTERVALS[Math.min(idx + 1, REVIEW_INTERVALS.length - 1)];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function calcMasteryStage(level: number): "red" | "yellow" | "green" {
  if (level >= 75) return "green";
  if (level >= 40) return "yellow";
  return "red";
}

function calcLevel(xp: number): { level: number; name: string; icon: string } {
  const found = [...LEVELS].reverse().find(l => xp >= l.minXP);
  return found ?? LEVELS[0];
}

// ─── ERRORS ───────────────────────────────────────────────────────────────────

export async function addError(userId: string, error: Omit<ErrorEntry, "userId" | "masteryLevel" | "masteryStage" | "nextReviewDate" | "reviewHistory" | "revisionInterval" | "isArchived">) {
  const entry = {
    ...error,
    userId,
    difficulty: error.difficulty ?? "Medium",
    whyMistake: error.whyMistake ?? "",
    formula: error.formula ?? "",
    masteryLevel: 0,
    masteryStage: "red" as const,
    nextReviewDate: addDays(today(), 1),
    reviewHistory: [],
    revisionInterval: 1,
    isArchived: false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "errors"), entry);
  const newCount = await updateDailyActivity(userId);

  // Award XP
  await awardXP(userId, XP_REWARDS.addError);

  return { ref, newCount };
}

export async function getErrors(userId: string): Promise<ErrorEntry[]> {
  const q = query(
    collection(db, "errors"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ErrorEntry));
}

export async function deleteError(errorId: string) {
  await deleteDoc(doc(db, "errors", errorId));
}

export async function updateErrorMastery(errorId: string, result: "mastered" | "reviewed" | "skipped"): Promise<number> {
  const ref = doc(db, "errors", errorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;

  const data = snap.data() as ErrorEntry;
  const currentInterval = data.revisionInterval ?? 1;

  let newMasteryLevel = data.masteryLevel ?? 0;
  let newInterval = currentInterval;
  let xpEarned = 0;

  if (result === "mastered") {
    newMasteryLevel = Math.min(100, newMasteryLevel + 25);
    newInterval = getNextInterval(currentInterval);
    xpEarned = XP_REWARDS.masterError;
  } else if (result === "reviewed") {
    newMasteryLevel = Math.min(100, newMasteryLevel + 10);
    xpEarned = XP_REWARDS.reviewError;
  } else {
    // skipped — slight regression
    newMasteryLevel = Math.max(0, newMasteryLevel - 5);
  }

  const newStage = calcMasteryStage(newMasteryLevel);
  const nextReview = addDays(today(), newInterval);
  const reviewHistory = [...(data.reviewHistory ?? []), today()];

  await updateDoc(ref, {
    masteryLevel: newMasteryLevel,
    masteryStage: newStage,
    nextReviewDate: nextReview,
    revisionInterval: newInterval,
    reviewHistory,
  });

  return xpEarned;
}

// Get errors due for review today
export async function getTodayRevisions(userId: string): Promise<ErrorEntry[]> {
  const q = query(
    collection(db, "errors"),
    where("userId", "==", userId),
    where("isArchived", "==", false)
  );
  const snap = await getDocs(q);
  const td = today();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as ErrorEntry))
    .filter(e => e.nextReviewDate <= td && e.masteryStage !== "green")
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
}

// Get upcoming revision schedule
export async function getRevisionSchedule(userId: string): Promise<{ date: string; count: number }[]> {
  const q = query(
    collection(db, "errors"),
    where("userId", "==", userId),
    where("isArchived", "==", false)
  );
  const snap = await getDocs(q);
  const errors = snap.docs.map(d => ({ id: d.id, ...d.data() } as ErrorEntry));

  const schedule: Record<string, number> = {};
  errors.forEach(e => {
    if (e.nextReviewDate && e.masteryStage !== "green") {
      schedule[e.nextReviewDate] = (schedule[e.nextReviewDate] ?? 0) + 1;
    }
  });

  return Object.entries(schedule)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 30);
}

// ─── XP & GAMIFICATION ────────────────────────────────────────────────────────

export async function awardXP(userId: string, xp: number): Promise<UserXP> {
  const ref = doc(db, "userXP", userId);
  const snap = await getDoc(ref);

  let data: UserXP = snap.exists()
    ? (snap.data() as UserXP)
    : { userId, totalXP: 0, level: 1, levelName: "Beginner", currentStreak: 0, longestStreak: 0, badges: [], unlockedThemes: [] };

  data.totalXP = (data.totalXP ?? 0) + xp;
  const { level, name } = calcLevel(data.totalXP);
  data.level = level;
  data.levelName = name;

  await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
  return data;
}

export async function getUserXP(userId: string): Promise<UserXP | null> {
  try {
    const snap = await getDoc(doc(db, "userXP", userId));
    if (!snap.exists()) return null;
    return snap.data() as UserXP;
  } catch {
    return null;
  }
}

export async function checkAndAwardBadges(userId: string, errors: ErrorEntry[]): Promise<string[]> {
  const xpSnap = await getDoc(doc(db, "userXP", userId));
  if (!xpSnap.exists()) return [];

  const xpData = xpSnap.data() as UserXP;
  const currentBadges = new Set(xpData.badges ?? []);
  const newBadges: string[] = [];

  BADGES.forEach(badge => {
    if (!currentBadges.has(badge.id) && badge.condition(xpData, errors)) {
      currentBadges.add(badge.id);
      newBadges.push(badge.id);
    }
  });

  if (newBadges.length > 0) {
    await updateDoc(doc(db, "userXP", userId), {
      badges: [...currentBadges],
    });
  }

  return newBadges;
}

// ─── REVISION LOG ─────────────────────────────────────────────────────────────

export async function logRevision(userId: string, errorId: string, result: "mastered" | "skipped" | "reviewed", xpEarned: number) {
  await addDoc(collection(db, "revisionLogs"), {
    userId,
    errorId,
    reviewedAt: today(),
    result,
    xpEarned,
    createdAt: serverTimestamp(),
  });
}

// ─── ANIME COLLECTION ─────────────────────────────────────────────────────────

export async function addCollectionEntry(userId: string, entry: Record<string, unknown>) {
  const ref = await addDoc(collection(db, "collection"), {
    ...entry,
    userId,
    createdAt: serverTimestamp(),
  });
  const newCount = await updateDailyActivity(userId);
  return { ref, newCount };
}

export async function getCollection(userId: string) {
  const q = query(
    collection(db, "collection"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteCollectionEntry(entryId: string) {
  await deleteDoc(doc(db, "collection", entryId));
}

// ─── DAILY ACTIVITY ───────────────────────────────────────────────────────────

export async function updateDailyActivity(userId: string): Promise<number> {
  const td = today();
  const docId = `${userId}_${td}`;
  const ref = doc(db, "dailyActivity", docId);
  try {
    const snap = await getDoc(ref);
    const currentCount = snap.exists() ? (snap.data().count ?? 0) : 0;
    const newCount = currentCount + 1;

    if (!snap.exists()) {
      await setDoc(ref, {
        userId,
        date: td,
        count: 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        count: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    if (newCount === 3) {
      await awardXP(userId, XP_REWARDS.dailyGoal);
    }
    return newCount;
  } catch (e) {
    console.error("updateDailyActivity failed:", e);
    return 0;
  }
}

export async function getTodayEntryCount(userId: string): Promise<number> {
  const td = today();
  try {
    const snap = await getDoc(doc(db, "dailyActivity", `${userId}_${td}`));
    if (!snap.exists()) return 0;
    return snap.data().count ?? 0;
  } catch {
    return 0;
  }
}

// ─── STREAK ───────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<number> {
  try {
    const q = query(collection(db, "dailyActivity"), where("userId", "==", userId));
    const snap = await getDocs(q);

    const qualifiedDates = snap.docs
      .map(d => ({ date: d.data().date as string, count: d.data().count as number }))
      .filter(d => d.count >= 3)
      .map(d => d.date)
      .sort()
      .reverse();

    if (qualifiedDates.length === 0) return 0;

    const td = today();
    const yesterday = addDays(td, -1);

    if (qualifiedDates[0] !== td && qualifiedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < qualifiedDates.length - 1; i++) {
      const curr = new Date(qualifiedDates[i]);
      const prev = new Date(qualifiedDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  } catch (e) {
    console.error("getStreak failed:", e);
    return 0;
  }
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<number> {
  try {
    const q = query(collection(db, "dailyActivity"), where("userId", "==", userId));
    const snap = await getDocs(q);

    const qualifiedDates = snap.docs
      .map(d => ({ date: d.data().date as string, count: d.data().count as number }))
      .filter(d => d.count >= 3)
      .map(d => d.date)
      .sort()
      .reverse();

    if (qualifiedDates.length === 0) return 0;

    const td = today();
    const yesterday = addDays(td, -1);

    if (qualifiedDates[0] !== td && qualifiedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < qualifiedDates.length - 1; i++) {
      const curr = new Date(qualifiedDates[i]);
      const prev = new Date(qualifiedDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }

    // Save streak to userXP so badges work
    try {
      const xpRef = doc(db, "userXP", userId);
      const xpSnap = await getDoc(xpRef);
      if (xpSnap.exists()) {
        const current = xpSnap.data();
        await updateDoc(xpRef, {
          currentStreak: streak,
          longestStreak: Math.max(streak, current.longestStreak ?? 0),
        });
      }
    } catch {}

    return streak;
  } catch (e) {
    console.error("getStreak failed:", e);
    return 0;
  }
}

export async function getChapterHeatmap(userId: string): Promise<{ chapter: string; subject: string; count: number }[]> {
  try {
    const errors = await getErrors(userId);
    const map: Record<string, { chapter: string; subject: string; count: number }> = {};
    errors.forEach(e => {
      const key = `${e.subject}__${e.chapter}`;
      if (!map[key]) map[key] = { chapter: e.chapter, subject: e.subject, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
  } catch {
    return [];
  }
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

export async function updateLeaderboard(
  userId: string,
  displayName: string,
  totalErrors: number,
  repeatedMistakes: number,
  streak: number
) {
  try {
    await setDoc(doc(db, "leaderboard", userId), {
      userId,
      displayName: displayName || "Anonymous",
      totalErrors,
      repeatedMistakes,
      streak,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("updateLeaderboard failed:", e);
  }
}

export async function getLeaderboard() {
  try {
    const q = query(collection(db, "leaderboard"), orderBy("repeatedMistakes", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d, idx) => ({ rank: idx + 1, id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

export async function getDailyActivityForMonth(userId: string, year: number, month: number): Promise<string[]> {
  try {
    const q = query(collection(db, "dailyActivity"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;
    return snap.docs
      .map(d => ({ date: d.data().date as string, count: d.data().count as number }))
      .filter(d => d.count >= 3 && d.date >= startDate && d.date <= endDate)
      .map(d => d.date);
  } catch {
    return [];
  }
}