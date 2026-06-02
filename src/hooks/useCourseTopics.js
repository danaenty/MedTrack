import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

// Course definitions — names and icons never change, only topics do
export const COURSES = [
  { id: "histopathology",     name: "Histopathology",    icon: "🔬" },
  { id: "chemical-pathology", name: "Chemical Pathology", icon: "⚗️" },
  { id: "microbiology",       name: "Microbiology",      icon: "🦠" },
  { id: "haematology",        name: "Haematology",       icon: "🩸" },
  { id: "pharmacology",       name: "Pharmacology",      icon: "💊" },
];

export function useCourseTopics() {
  const [topicsByCourse, setTopicsByCourse] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = COURSES.map((course) => {
      const q = query(
        collection(db, "courses", course.id, "topics"),
        orderBy("createdAt", "asc")
      );
      return onSnapshot(q, (snap) => {
        const topics = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTopicsByCourse((prev) => ({ ...prev, [course.id]: topics }));
      });
    });

    const timer = setTimeout(() => setLoading(false), 600);
    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(timer);
    };
  }, []);

  const courses = COURSES.map((course) => ({
    ...course,
    topics: topicsByCourse[course.id] ?? [],
  }));

  return { courses, loading };
}
