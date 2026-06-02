export default function AboutPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold mb-2">About</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            MedTrack
          </h1>
          <div className="w-12 h-0.5 bg-blue-600 rounded-full" />
        </div>

        {/* Project card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">About the Project</h2>
              <p className="text-xs text-slate-400 dark:text-slate-600">2nd MBBS Professional Exam Preparation</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            MedTrack is a study progress tracker built specifically for the 2nd MBBS Professional Examinations
            in Pathology and Pharmacology. It allows medical students to track their reading across topics,
            view lecture slides directly within the app, and monitor their overall preparation progress.
          </p>
        </div>

        {/* Developer card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              K
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold mb-1">Developer</p>
              <h2 className="font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Kabiru Bayu Bello
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5">500 Level Medical Student</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Federal University of Health Sciences Azare, Bauchi State</p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              I created this project to track my progress in preparation for my 2nd MBBS Professional Exams
              (Pathology and Pharmacology). Instead of scattered notes and spreadsheets, I wanted a clean,
              focused tool that keeps everything in one place — courses, topics, and slides.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-3">
              Feel free to create an account and use it. Good luck with your studies! 🩺
            </p>
          </div>
        </div>

        {/* Courses covered */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Courses Covered</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "🔬", name: "Histopathology" },
              { icon: "⚗️", name: "Chemical Pathology" },
              { icon: "🦠", name: "Microbiology" },
              { icon: "🩸", name: "Haematology" },
              { icon: "💊", name: "Pharmacology" },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-lg">{c.icon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
