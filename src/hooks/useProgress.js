import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useProgress(user) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProgress({}); setLoading(false); return; }
    const ref = doc(db, "users", user.uid, "data", "progress");
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProgress(snap.data());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const toggle = useCallback(async (topicId) => {
    if (!user) return;
    const updated = { ...progress, [topicId]: !progress[topicId] };
    setProgress(updated);
    const ref = doc(db, "users", user.uid, "data", "progress");
    await setDoc(ref, updated, { merge: true });
  }, [progress, user]);

  return { progress, toggle, loading };
}
