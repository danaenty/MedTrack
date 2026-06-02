import { useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { useCourseTopics } from "../hooks/useCourseTopics";
import { useAuth } from "../context/AuthContext";

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

export default function Dashboard() {
  const { user } = useAuth();
  const { progress, toggle, loading: progressLoading } = useProgress(user);
  const { courses, loading: coursesLoading } = useCourseTopics();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [mobileView, setMobileView] = useState("courses");

  // Pick first course once courses load
  const activeCourse = selectedCourse ?? courses[0] ?? null;
  const courseTopics = activeCourse?.topics ?? [];
  const doneCount = courseTopics.filter((t) => progress[t.id]).length;

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setMobileView("topics");
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setMobileView("slides");
  };

  const activeTopic = selectedTopic ?? courseTopics[0] ?? null;

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

  const MobileBreadcrumb = () => (
    <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
      <button onClick={() => setMobileView("courses")} className={`font-medium ${mobileView === "courses" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
        Courses
      </button>
      {activeCourse && <>
        <span className="text-slate-300 dark:text-slate-700">›</span>
        <button onClick={() => setMobileView("topics")} className={`font-medium ${mobileView === "topics" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
          {activeCourse.name}
        </button>
      </>}
      {activeTopic && mobileView === "slides" && <>
        <span className="text-slate-300 dark:text-slate-700">›</span>
        <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]">{activeTopic.title}</span>
      </>}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MobileBreadcrumb />
      <div className="flex-1 flex overflow-hidden">

        {/* ── Courses Sidebar ── */}
        <aside className={`
          w-full md:w-52 lg:w-60 shrink-0 border-r border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-950 overflow-y-auto
          ${mobileView === "courses" ? "flex flex-col" : "hidden md:flex md:flex-col"}
        `}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold">Courses</p>
          </div>
          <nav className="flex-1 px-2 pb-4 flex flex-col gap-1">
            {courses.map((course) => {
              const total = course.topics.length;
              const done = course.topics.filter((t) => progress[t.id]).length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              const active = activeCourse?.id === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 ${
                    active
                      ? "bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg leading-none">{course.icon}</span>
                    <span className={`text-sm font-medium truncate ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                      {course.name}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
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
              const allTopics = courses.flatMap((c) => c.topics);
              const allDone = allTopics.filter((t) => progress[t.id]).length;
              return <ProgressBar value={allDone} max={allTopics.length} />;
            })()}
          </div>
        </aside>

        {/* ── Topics Panel ── */}
        <div className={`
          w-full md:w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800
          bg-slate-50 dark:bg-slate-950/50 overflow-y-auto flex flex-col
          ${mobileView === "topics" ? "flex" : "hidden md:flex"}
        `}>
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
                    <p className="text-slate-400 dark:text-slate-600 text-xs">Use the Admin panel to add topics to this course.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 py-1">
                    {courseTopics.map((topic, i) => {
                      const done = !!progress[topic.id];
                      const active = activeTopic?.id === topic.id;
                      return (
                        <div
                          key={topic.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                            active
                              ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-900"
                              : "hover:bg-white dark:hover:bg-slate-900"
                          }`}
                          onClick={() => handleSelectTopic(topic)}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggle(topic.id); }}
                            className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                              done
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300 dark:border-slate-600 hover:border-blue-400"
                            }`}
                            aria-label={done ? "Mark unread" : "Mark read"}
                          >
                            {done && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug truncate ${
                              done
                                ? "line-through text-slate-400 dark:text-slate-600"
                                : active
                                  ? "font-medium text-blue-700 dark:text-blue-300"
                                  : "text-slate-700 dark:text-slate-300"
                            }`}>
                              {topic.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Topic {i + 1}</p>
                          </div>
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

        {/* ── Slide Viewer ── */}
        <main className={`
          flex-1 bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden
          ${mobileView === "slides" ? "flex" : "hidden md:flex"}
        `}>
          {activeTopic ? (
            <>
              <div className="px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {activeTopic.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-600">{activeCourse?.name}</p>
                </div>
                <button
                  onClick={() => toggle(activeTopic.id)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    progress[activeTopic.id]
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
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
                      Edit this topic in the Admin panel to add a Google Drive preview URL.
                    </p>
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
    </div>
  );
}
