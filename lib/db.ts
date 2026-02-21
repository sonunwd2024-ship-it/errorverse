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
  serverTimestamp,
} from "firebase/firestore";

// ─── ERRORS ───────────────────────────────────────────────────────────────────

export async function addError(userId: string, error: Record<string, unknown>) {
  const ref = await addDoc(collection(db, "errors"), {
    ...error,
    userId,
    createdAt: serverTimestamp(),
  });
  await updateDailyActivity(userId);
  return ref;
}

export async function getErrors(userId: string) {
  const q = query(
    collection(db, "errors"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteError(errorId: string) {
  await deleteDoc(doc(db, "errors", errorId));
}

// ─── ANIME COLLECTION ─────────────────────────────────────────────────────────

export async function addCollectionEntry(userId: string, entry: Record<string, unknown>) {
  const ref = await addDoc(collection(db, "collection"), {
    ...entry,
    userId,
    createdAt: serverTimestamp(),
  });
  await updateDailyActivity(userId);
  return ref;
}

export async function getCollection(userId: string) {
  const q = query(
    collection(db, "collection"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteCollectionEntry(entryId: string) {
  await deleteDoc(doc(db, "collection", entryId));
}

// ─── DAILY ACTIVITY ───────────────────────────────────────────────────────────

export async function updateDailyActivity(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const docId = `${userId}_${today}`;
  const ref = doc(db, "dailyActivity", docId);
  try {
    const snap = await getDoc(ref);
    const newCount = snap.exists() ? (snap.data().count || 0) + 1 : 1;
    await setDoc(ref, {
      userId,
      date: today,
      count: newCount,
      updatedAt: serverTimestamp(),
    });
    console.log(`[STREAK] dailyActivity updated: count=${newCount} for ${today}`);
  } catch (e) {
    console.error("[STREAK] updateDailyActivity failed:", e);
  }
}

export async function getTodayEntryCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const snap = await getDoc(doc(db, "dailyActivity", `${userId}_${today}`));
    if (!snap.exists()) return 0;
    return snap.data().count || 0;
  } catch {
    return 0;
  }
}

// ─── STREAK ───────────────────────────────────────────────────────────────────
// NO orderBy to avoid needing Firestore composite index — sort in JS instead

export async function getStreak(userId: string): Promise<number> {
  try {
    // Simple query — no orderBy, no index needed
    const q = query(
      collection(db, "dailyActivity"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);

    // Filter days with 3+ entries, sort descending in JS
    const qualifiedDates = snap.docs
      .map((d) => ({ date: d.data().date as string, count: d.data().count as number }))
      .filter((d) => d.count >= 3)
      .map((d) => d.date)
      .sort()
      .reverse();

    console.log("[STREAK] qualifiedDates:", qualifiedDates);

    if (qualifiedDates.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Streak must start from today or yesterday
    if (qualifiedDates[0] !== today && qualifiedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < qualifiedDates.length - 1; i++) {
      const curr = new Date(qualifiedDates[i]);
      const prev = new Date(qualifiedDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }
    console.log("[STREAK] final streak:", streak);
    return streak;
  } catch (e) {
    console.error("[STREAK] getStreak failed:", e);
    return 0;
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
    console.error("[LEADERBOARD] update failed:", e);
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

export async function getDailyActivityForMonth(
  userId: string,
  year: number,
  month: number
): Promise<string[]> {
  try {
    // No orderBy — just filter by userId, then filter by date in JS
    const q = query(
      collection(db, "dailyActivity"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;
    return snap.docs
      .map((d) => ({ date: d.data().date as string, count: d.data().count as number }))
      .filter((d) => d.count >= 3 && d.date >= startDate && d.date <= endDate)
      .map((d) => d.date);
  } catch {
    return [];
  }
}