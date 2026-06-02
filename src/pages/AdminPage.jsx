import { useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COURSES, useCourseTopics } from "../hooks/useCourseTopics";

const EMPTY_FORM = { courseId: COURSES[0].id, title: "", slideUrl: "" };

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

export default function AdminPage() {
  const { courses, loading } = useCourseTopics();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [filterCourse, setFilterCourse] = useState("all");

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(""), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  };

  // ── Add topic ──
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return flash("Topic title is required.", true);
    setSaving(true);
    try {
      const topicId = `${slugify(form.title)}-${Date.now()}`;
      await addDoc(
        collection(db, "courses", form.courseId, "topics"),
        {
          id: topicId,
          title: form.title.trim(),
          slideUrl: form.slideUrl.trim(),
          createdAt: serverTimestamp(),
        }
      );
      setForm({ ...EMPTY_FORM, courseId: form.courseId });
      flash("Topic added successfully.");
    } catch (err) {
      flash("Failed to add topic. Check your internet connection.", true);
      console.error(err);
    }
    setSaving(false);
  };

  // ── Delete topic ──
  const handleDelete = async (courseId, docId) => {
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, "courses", courseId, "topics", docId));
      flash("Topic deleted.");
    } catch (err) {
      flash("Failed to delete topic.", true);
    }
    setDeletingId(null);
  };

  // ── Start editing ──
  const startEdit = (topic, courseId) => {
    setEditingId(topic.id);
    setEditForm({ title: topic.title, slideUrl: topic.slideUrl ?? "", courseId });
  };

  // ── Save edit ──
  const saveEdit = async (courseId, docId) => {
    if (!editForm.title.trim()) return flash("Title cannot be empty.", true);
    setSaving(true);
    try {
      await updateDoc(doc(db, "courses", courseId, "topics", docId), {
        title: editForm.title.trim(),
        slideUrl: editForm.slideUrl.trim(),
      });
      setEditingId(null);
      flash("Topic updated.");
    } catch (err) {
      flash("Failed to update topic.", true);
    }
    setSaving(false);
  };

  const visibleCourses =
    filterCourse === "all"
      ? courses
      : courses.filter((c) => c.id === filterCourse);

  const totalTopics = courses.reduce((acc, c) => acc + c.topics.length, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Manage Topics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Topics you add here are instantly visible to all users.
          </p>
        </div>

        {/* Toast messages */}
        {error && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {success}
          </div>
        )}

        {/* ── Add Topic Form ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </span>
              Add New Topic
            </h2>
          </div>

          <form onSubmit={handleAdd} className="p-5 flex flex-col gap-4">
            {/* Course selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Course
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COURSES.map((course) => (
                  <button
                    type="button"
                    key={course.id}
                    onClick={() => setForm((f) => ({ ...f, courseId: course.id }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.courseId === course.id
                        ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-800"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{course.icon}</span>
                    <span className="truncate">{course.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Topic Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Cell Injury & Death"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Slide URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Google Drive Slide URL
                <span className="ml-2 text-[10px] normal-case font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="url"
                value={form.slideUrl}
                onChange={(e) => setForm((f) => ({ ...f, slideUrl: e.target.value }))}
                placeholder="https://drive.google.com/file/d/FILE_ID/preview"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1.5">
                Share the file publicly on Google Drive, then change <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/view</code> to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/preview</code> in the URL.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="self-start flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Add Topic</>
              )}
            </button>
          </form>
        </div>

        {/* ── Topic List ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
              All Topics
              <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-600">
                {totalTopics} total
              </span>
            </h2>
            {/* Filter */}
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All courses</option>
              {COURSES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleCourses.map((course) => (
                course.topics.length > 0 && (
                  <div key={course.id}>
                    {/* Course header */}
                    <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                      <span className="text-base">{course.icon}</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {course.name}
                      </span>
                      <span className="ml-auto text-xs text-slate-400 dark:text-slate-600">
                        {course.topics.length} topic{course.topics.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Topics */}
                    {course.topics.map((topic) => (
                      <div key={topic.id} className="px-5 py-3">
                        {editingId === topic.id ? (
                          // ── Edit mode ──
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="url"
                              value={editForm.slideUrl}
                              onChange={(e) => setEditForm((f) => ({ ...f, slideUrl: e.target.value }))}
                              placeholder="https://drive.google.com/file/d/FILE_ID/preview"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => saveEdit(course.id, topic.id)}
                                disabled={saving}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                              >
                                {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // ── View mode ──
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {topic.title}
                              </p>
                              {topic.slideUrl ? (
                                <a
                                  href={topic.slideUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-500 hover:underline truncate block max-w-xs"
                                >
                                  {topic.slideUrl}
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-600 italic">No slide URL</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(topic, course.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button
                                onClick={() => handleDelete(course.id, topic.id)}
                                disabled={deletingId === topic.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-40"
                                title="Delete"
                              >
                                {deletingId === topic.id
                                  ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                }
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ))}

              {visibleCourses.every((c) => c.topics.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No topics yet</p>
                  <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Use the form above to add your first topic.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
