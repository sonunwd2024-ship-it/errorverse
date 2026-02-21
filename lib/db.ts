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
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data().count || 0;
    await setDoc(ref, { userId, date: today, count: current + 1 }, { merge: true });
  } else {
    await setDoc(ref, { userId, date: today, count: 1, createdAt: serverTimestamp() });
  }
}

export async function getTodayEntryCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const ref = doc(db, "dailyActivity", `${userId}_${today}`);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return 0;
    return snap.data().count || 0;
  } catch {
    return 0;
  }
}

// ─── STREAK (requires min 3 entries per day) ──────────────────────────────────

export async function getStreak(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, "dailyActivity"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const qualifiedDates = snap.docs
      .filter((d) => (d.data().count || 0) >= 3)
      .map((d) => d.data().date as string);

    if (qualifiedDates.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (qualifiedDates[0] !== today && qualifiedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < qualifiedDates.length - 1; i++) {
      const curr = new Date(qualifiedDates[i]);
      const prev = new Date(qualifiedDates[i + 1]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  } catch {
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
  await setDoc(doc(db, "leaderboard", userId), {
    userId,
    displayName: displayName || "Anonymous",
    totalErrors,
    repeatedMistakes,
    streak,
    updatedAt: serverTimestamp(),
  });
}

export async function getLeaderboard() {
  const q = query(collection(db, "leaderboard"), orderBy("repeatedMistakes", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d, idx) => ({ rank: idx + 1, id: d.id, ...d.data() }));
}

// ─── CALENDAR HELPER ──────────────────────────────────────────────────────────

export async function getDailyActivityForMonth(userId: string, year: number, month: number): Promise<string[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;
  const q = query(
    collection(db, "dailyActivity"),
    where("userId", "==", userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => (d.data().count || 0) >= 3)
    .map((d) => d.data().date as string);
}