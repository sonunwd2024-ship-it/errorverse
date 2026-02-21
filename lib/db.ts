import { db } from "./firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

// ─── ERRORS ───────────────────────────────────────────────────────────────────

export async function addError(userId: string, error: Record<string, unknown>) {
  return addDoc(collection(db, "errors"), { ...error, userId, createdAt: serverTimestamp() });
}

export async function getErrors(userId: string) {
  const q = query(collection(db, "errors"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteError(errorId: string) {
  await deleteDoc(doc(db, "errors", errorId));
}

// ─── COLLECTION ───────────────────────────────────────────────────────────────

export async function addCollectionEntry(userId: string, entry: Record<string, unknown>) {
  return addDoc(collection(db, "collection"), { ...entry, userId, createdAt: serverTimestamp() });
}

export async function getCollection(userId: string) {
  const q = query(collection(db, "collection"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteCollectionEntry(entryId: string) {
  await deleteDoc(doc(db, "collection", entryId));
}

// ─── STREAK (requires 3 total entries on a day to count) ─────────────────────

export async function recordActivityDate(userId: string, totalEntriesForUser: number) {
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have a record for today
  const q = query(collection(db, "activity"), where("userId", "==", userId), where("date", "==", today));
  const snap = await getDocs(q);

  if (snap.empty) {
    // Create a new record for today
    await addDoc(collection(db, "activity"), {
      userId,
      date: today,
      count: totalEntriesForUser,
      qualified: totalEntriesForUser >= 3,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update existing record — use deleteDoc + addDoc since we don't have updateDoc imported
    const existingDoc = snap.docs[0];
    await deleteDoc(doc(db, "activity", existingDoc.id));
    await addDoc(collection(db, "activity"), {
      userId,
      date: today,
      count: totalEntriesForUser,
      qualified: totalEntriesForUser >= 3,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getStreak(userId: string): Promise<number> {
  const q = query(collection(db, "activity"), where("userId", "==", userId), where("qualified", "==", true), orderBy("date", "desc"));
  const snap = await getDocs(q);
  const dates = snap.docs.map(d => (d.data() as { date: string }).date);

  if (dates.length === 0) return 0;

  // Check if today or yesterday is in the list (streak must be current)
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i + 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) { streak++; } else { break; }
  }
  return streak;
}