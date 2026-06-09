import { useMemo, useState } from "react";

import { useAuth } from "../context/useAuth";

const defaultPreferences = {
  matchAlerts: true,
  teamNews: true,
  accountNotifications: true,
  theme: "system",
};

function getPreferencesKey(userId) {
  return userId ? `zeroplay.preferences.${userId}` : "zeroplay.preferences";
}

function readPreferences(userId) {
  const rawValue = localStorage.getItem(getPreferencesKey(userId));

  if (!rawValue) {
    return defaultPreferences;
  }

  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(rawValue),
    };
  } catch {
    return defaultPreferences;
  }
}

function Settings() {
  const { displayName, updateAccount, user } = useAuth();
  const [username, setUsername] = useState(user?.username || displayName);
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferences, setPreferences] = useState(() => readPreferences(user?.id));
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const preferencesKey = useMemo(() => getPreferencesKey(user?.id), [user?.id]);

  function updatePreference(key, value) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));
  }

  function validate() {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const wantsEmailChange = trimmedEmail !== (user?.email || "");
    const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0;

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return "Username must be between 3 and 30 characters.";
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return "Username can only contain letters, numbers, and underscores.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return "Enter a valid email address.";
    }

    if (wantsPasswordChange && newPassword.length < 8) {
      return "New password must be at least 8 characters.";
    }

    if (wantsPasswordChange && newPassword !== confirmPassword) {
      return "New password and confirmation must match.";
    }

    if ((wantsEmailChange || wantsPasswordChange) && !currentPassword) {
      return "Current password is required for email or password changes.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validationError = validate();

    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const updates = {};

    if (trimmedUsername !== (user?.username || displayName)) {
      updates.username = trimmedUsername;
    }

    if (trimmedEmail !== (user?.email || "")) {
      updates.email = trimmedEmail;
      updates.currentPassword = currentPassword;
    }

    if (newPassword) {
      updates.password = newPassword;
      updates.currentPassword = currentPassword;
    }

    setSaving(true);

    try {
      if (Object.keys(updates).length > 0) {
        await updateAccount(updates);
      }

      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus({ type: "success", message: "Changes saved." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not save changes.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-zinc-900 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
            Account controls
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">Settings</h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Manage the account details connected to your authenticated ZeroPlay session.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-6">
            <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
              <h2 className="text-2xl font-black">Profile Details</h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">
                    Change username
                  </span>
                  <input
                    type="text"
                    value={username}
                    autoComplete="username"
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">
                    Change email
                  </span>
                  <input
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>
              </div>
            </article>

            <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
              <h2 className="text-2xl font-black">Change Password</h2>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">
                    Current password
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    autoComplete="current-password"
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">
                    New password
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    autoComplete="new-password"
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">
                    Confirm password
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>
              </div>
            </article>
          </section>

          <section className="space-y-6">
            <article
              id="notifications"
              className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6"
            >
              <h2 className="text-2xl font-black">Notification Preferences</h2>

              <div className="mt-5 space-y-3">
                {[
                  ["matchAlerts", "Match alerts"],
                  ["teamNews", "Favorite team news"],
                  ["accountNotifications", "Account notifications"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/45 px-4 py-3"
                  >
                    <span className="font-bold text-zinc-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      onChange={(event) => updatePreference(key, event.target.checked)}
                      className="h-5 w-5 accent-cyan-300"
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
              <h2 className="text-2xl font-black">Theme Preferences</h2>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-zinc-400">
                  Preferred theme
                </span>
                <select
                  value={preferences.theme}
                  onChange={(event) => updatePreference("theme", event.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                >
                  <option value="system">System default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
            </article>

            {(status.message || saving) && (
              <div
                role="status"
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  status.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {saving ? "Saving changes..." : status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </section>
        </form>
      </main>
    </div>
  );
}

export default Settings;
