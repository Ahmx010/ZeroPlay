import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Games", to: "/games" },
  { label: "Teams", to: "/teams" },
  { label: "News", to: "/news" },
];

function getInitial(displayName) {
  return displayName?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function getAvatarUrl(user) {
  return user?.avatarUrl || user?.avatar_url || user?.profile?.avatar_url || null;
}

function Navbar() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { displayName, isAuthenticated, logout, user } = useAuth();
  const avatarUrl = getAvatarUrl(user);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    setIsMenuOpen(false);
    await logout();
    navigate("/");
  }

  function navLinkClass({ isActive }) {
    return `rounded-xl px-3 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-cyan-300 text-black"
        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
    }`;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-900 bg-black/90 px-4 text-white backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-300">
            ZP
          </span>
          <span className="text-lg font-black tracking-wide">ZeroPlay</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <div ref={menuRef} className="relative ml-1">
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 text-sm font-black text-white transition hover:border-cyan-300"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-300 text-xs font-black text-black">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitial(displayName)
                  )}
                </span>
                <span className="hidden max-w-32 truncate sm:inline">Hi, {displayName}</span>
                <span aria-hidden="true" className="text-xs text-cyan-300">
                  ▼
                </span>
              </button>

              {isMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900 hover:text-cyan-300"
                  >
                    <span aria-hidden="true">👤</span>
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900 hover:text-cyan-300"
                  >
                    <span aria-hidden="true">⚙️</span>
                    Settings
                  </Link>
                  <Link
                    to="/profile#favorite-team"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900 hover:text-cyan-300"
                  >
                    <span aria-hidden="true">⭐</span>
                    Favorite Teams
                  </Link>
                  <Link
                    to="/settings#notifications"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900 hover:text-cyan-300"
                  >
                    <span aria-hidden="true">🔔</span>
                    Notifications
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm font-bold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
                  >
                    <span aria-hidden="true">🚪</span>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
