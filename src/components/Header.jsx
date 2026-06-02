import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ADMIN_EMAIL } from "../admin";

export default function Header() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        location.pathname === to
          ? "text-blue-600 dark:text-blue-400"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 h-14 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          MedTrack
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-4 flex-1 overflow-x-auto">
        {navLink("/", "Dashboard")}
        {isAdmin && (
          <Link
            to="/admin"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname === "/admin"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            Admin
          </Link>
        )}
        {navLink("/about", "About")}
        {navLink("/contact", "Contact")}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        {/* User avatar + sign out */}
        {user && (
          <div className="flex items-center gap-2">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-7 h-7 rounded-full ring-2 ring-blue-200 dark:ring-blue-900"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block max-w-[120px] truncate">
              {user.displayName}
            </span>
            <button
              onClick={() => signOut(auth)}
              className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1 hidden sm:block"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
