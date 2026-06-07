import { useState, useRef, useCallback, useEffect } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useProgress } from "../hooks/useProgress";
import { useCourseTopics } from "../hooks/useCourseTopics";
import { useAuth } from "../context/AuthContext";
import { ADMIN_EMAIL } from "../admin";
import AIAssistant from "../components/AIAssistant";

// ─── Progress bar ────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
        <span>{value}/{max} topics</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Resize handle (desktop only) ────────────────────────────────
function ResizeHandle({ onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="hidden md:flex w-1.5 shrink-0 cursor-col-resize group items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      title="Drag to resize"
    >
      <div className="w-0.5 h-8 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-400 dark:group-hover:bg-blue-600 transition-colors" />
    </div>
  );
}

// ─── Edit topic modal (admin) ─────────────────────────────────────
function EditTopicModal({ topic, courseId, onClose, onSaved }) {
  const [title, setTitle]       = useState(topic.title);
  const [slideUrl, setSlideUrl] = useState(topic.slideUrl ?? "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("Title cannot be empty."); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, "courses", courseId, "topics", topic.id), {
        title: title.trim(),
        slideUrl: slideUrl.trim(),
      });
      onSaved({ ...topic, title: title.trim(), slideUrl: slideUrl.trim() });
      onClose();
    } catch {
      setError("Failed to save. Check your connection.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Edit Topic</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Topic Title *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Slide URL</label>
            <input
              type="url"
              value={slideUrl}
              onChange={(e) => setSlideUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/FILE_ID/preview"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
              Change <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/view</code> → <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/preview</code> in the Google Drive URL.
            </p>
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal (admin) ─────────────────────────────────
function DeleteConfirmModal({ topic, courseId, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "courses", courseId, "topics", topic.id));
      onDeleted(topic.id);
      onClose();
    } catch {
      setError("Failed to delete. Check your connection.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Delete Topic?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            "<span className="font-medium text-slate-700 dark:text-slate-300">{topic.title}</span>" will be permanently removed for all users.
          </p>
          {error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
          <div className="flex gap-2 justify-center mt-4">
            <button onClick={onClose} disabled={deleting} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 transition disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
            >
              {deleting && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }                                        = useAuth();
  const { progress, toggle, loading: progressLoading }  = useProgress(user);
  const { courses, loading: coursesLoading }            = useCourseTopics();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Mobile navigation: "courses" | "topics" | "slides"
  const [mobileView, setMobileView]       = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTopic, setSelectedTopic]   = useState(null);

  // Resizable sidebar widths (desktop)
  const [courseWidth, setCourseWidth] = useState(208);
  const [topicWidth, setTopicWidth]   = useState(256);

  // Admin modals
  const [editTopic, setEditTopic]     = useState(null); // { topic, courseId }
  const [deleteTopic, setDeleteTopic] = useState(null); // { topic, courseId }

  // Drag refs
  const draggingPanel  = useRef(null);
  const dragStartX     = useRef(0);
  const dragStartWidth = useRef(0);

  const activeCourse = selectedCourse ?? courses[0] ?? null;
  const courseTopics = activeCourse?.topics ?? [];
  const doneCount    = courseTopics.filter((t) => progress[t.id]).length;
  const activeTopic  = selectedTopic ?? courseTopics[0] ?? null;

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setMobileView("topics");
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setMobileView("slides");
  };

  const handleTopicSaved = (updated) => {
    if (selectedTopic?.id === updated.id) setSelectedTopic(updated);
  };

  const handleTopicDeleted = (deletedId) => {
    if (selectedTopic?.id === deletedId) setSelectedTopic(null);
  };

  // ── Resize drag ──
  const startResize = useCallback((panel) => (e) => {
    e.preventDefault();
    draggingPanel.current  = panel;
    dragStartX.current     = e.clientX;
    dragStartWidth.current = panel === "course" ? courseWidth : topicWidth;
  }, [courseWidth, topicWidth]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingPanel.current) return;
      const delta    = e.clientX - dragStartX.current;
      const newWidth = Math.min(Math.max(dragStartWidth.current + delta, 140), 480);
      if (draggingPanel.current === "course") setCourseWidth(newWidth);
      if (draggingPanel.current === "topic")  setTopicWidth(newWidth);
    };
    const onUp = () => { draggingPanel.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Loading spinner ──
  if (progressLoading || coursesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your progress…</p>
        </div>
      </div>
    );
  }

  // ── Mobile breadcrumb ──
  const MobileBreadcrumb = () => (
    <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
      <button
        onClick={() => setMobileView("courses")}
        className={`font-medium whitespace-nowrap ${mobileView === "courses" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}
      >
        Courses
      </button>
      {activeCourse && (
        <>
          <span className="text-slate-300 dark:text-slate-700">›</span>
          <button
            onClick={() => setMobileView("topics")}
            className={`font-medium whitespace-nowrap ${mobileView === "topics" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}
          >
            {activeCourse.name}
          </button>
        </>
      )}
      {activeTopic && mobileView === "slides" && (
        <>
          <span className="text-slate-300 dark:text-slate-700">›</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[140px]">{activeTopic.title}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MobileBreadcrumb />

      <div className="flex-1 flex overflow-hidden">

        {/* ── Courses sidebar ── */}
        <aside
          style={{ width: courseWidth }}
          className={[
            "shrink-0 border-r border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-950 overflow-y-auto flex flex-col",
            "w-full",
            mobileView === "courses" ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold">Courses</p>
          </div>

          <nav className="flex-1 px-2 pb-4 flex flex-col gap-1">
            {courses.map((course) => {
              const total  = course.topics.length;
              const done   = course.topics.filter((t) => progress[t.id]).length;
              const pct    = total === 0 ? 0 : Math.round((done / total) * 100);
              const active = activeCourse?.id === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className={[
                    "w-full text-left px-3 py-3 rounded-xl transition-all duration-150",
                    active
                      ? "bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg leading-none">{course.icon}</span>
                    <span className={`text-sm font-medium truncate ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                      {course.name}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{done}/{total} · {pct}%</p>
                </button>
              );
            })}
          </nav>

          {/* Overall progress */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold mb-2">Overall</p>
            {(() => {
              const all  = courses.flatMap((c) => c.topics);
              const done = all.filter((t) => progress[t.id]).length;
              return <ProgressBar value={done} max={all.length} />;
            })()}
          </div>
        </aside>

        {/* ── Resize handle 1 ── */}
        <ResizeHandle onMouseDown={startResize("course")} />

        {/* ── Topics panel ── */}
        <div
          style={{ width: topicWidth }}
          className={[
            "shrink-0 border-r border-slate-200 dark:border-slate-800",
            "bg-slate-50 dark:bg-slate-950/50 overflow-y-auto flex flex-col",
            "w-full",
            mobileView === "topics" ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          {activeCourse ? (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{activeCourse.icon}</span>
                  <h2 className="font-semibold text-slate-900 dark:text-white text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {activeCourse.name}
                  </h2>
                </div>
                <ProgressBar value={doneCount} max={courseTopics.length} />
              </div>

              <div className="flex-1 p-2">
                {courseTopics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No topics yet</p>
                    <p className="text-slate-400 dark:text-slate-600 text-xs">Use the Admin panel to add topics.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 py-1">
                    {courseTopics.map((topic, i) => {
                      const done   = !!progress[topic.id];
                      const active = activeTopic?.id === topic.id;
                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic)}
                          className={[
                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                            active
                              ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-900"
                              : "hover:bg-white dark:hover:bg-slate-900",
                          ].join(" ")}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggle(topic.id); }}
                            className={[
                              "w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                              done
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300 dark:border-slate-600 hover:border-blue-400",
                            ].join(" ")}
                            aria-label={done ? "Mark unread" : "Mark done"}
                          >
                            {done && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={[
                              "text-sm leading-snug truncate",
                              done
                                ? "line-through text-slate-400 dark:text-slate-600"
                                : active
                                  ? "font-medium text-blue-700 dark:text-blue-300"
                                  : "text-slate-700 dark:text-slate-300",
                            ].join(" ")}>
                              {topic.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Topic {i + 1}</p>
                          </div>

                          {/* Admin quick icons (hover) */}
                          {isAdmin && (
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditTopic({ topic, courseId: activeCourse.id }); }}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                                title="Edit topic"
                                aria-label="Edit topic"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTopic({ topic, courseId: activeCourse.id }); }}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                title="Delete topic"
                                aria-label="Delete topic"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 dark:text-slate-600 text-sm">Select a course</p>
            </div>
          )}
        </div>

        {/* ── Resize handle 2 ── */}
        <ResizeHandle onMouseDown={startResize("topic")} />

        {/* ── Slide viewer ── */}
        <main
          className={[
            "flex-1 bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden",
            mobileView === "slides" ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          {activeTopic ? (
            <>
              {/* Slide header */}
              <div className="px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3
                    className="font-semibold text-slate-900 dark:text-white text-sm truncate"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {activeTopic.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-600">{activeCourse?.name}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Admin edit / delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                      <button
                        onClick={() => setEditTopic({ topic: activeTopic, courseId: activeCourse.id })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTopic({ topic: activeTopic, courseId: activeCourse.id })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}

                  {/* Mark as read */}
                  <button
                    onClick={() => toggle(activeTopic.id)}
                    className={[
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      progress[activeTopic.id]
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                        : "bg-blue-600 text-white hover:bg-blue-700",
                    ].join(" ")}
                  >
                    {progress[activeTopic.id] ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Done
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Mark as Read
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Slide iframe */}
              <div className="flex-1 p-2 md:p-4">
                {activeTopic.slideUrl ? (
                  <iframe
                    key={activeTopic.id}
                    src={activeTopic.slideUrl}
                    className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-sm"
                    allow="autoplay"
                    title={activeTopic.title}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-8">
                    <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No slide linked</p>
                    <p className="text-slate-400 dark:text-slate-600 text-xs mt-2 max-w-xs">
                      {isAdmin ? "Click Edit above to add a slide URL." : "Admin hasn't linked a slide for this topic yet."}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setEditTopic({ topic: activeTopic, courseId: activeCourse.id })}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Add Slide URL
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Select a topic to view its slides</p>
            </div>
          )}
        </main>
      </div>

      {/* ── AI Floating Assistant ── */}
      <AIAssistant
        activeTopic={activeTopic}
        activeCourse={activeCourse}
        mobileView={mobileView}
      />

      {/* ── Edit modal ── */}
      {editTopic && (
        <EditTopicModal
          topic={editTopic.topic}
          courseId={editTopic.courseId}
          onClose={() => setEditTopic(null)}
          onSaved={handleTopicSaved}
        />
      )}

      {/* ── Delete modal ── */}
      {deleteTopic && (
        <DeleteConfirmModal
          topic={deleteTopic.topic}
          courseId={deleteTopic.courseId}
          onClose={() => setDeleteTopic(null)}
          onDeleted={handleTopicDeleted}
        />
      )}
    </div>
  );
}
