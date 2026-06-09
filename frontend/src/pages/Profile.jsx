import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function getAvatarUrl(user) {
  return user?.avatarUrl || user?.avatar_url || user?.profile?.avatar_url || null;
}

function getInitial(displayName) {
  return displayName?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAccountStatus(user) {
  if (user?.accountStatus) {
    return user.accountStatus;
  }

  if (user?.emailConfirmedAt === null) {
    return "Email verification pending";
  }

  return "Active";
}

function ProfileStat({ label, value, id }) {
  return (
    <article
      id={id}
      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
    >
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-white">{value}</p>
    </article>
  );
}

function Profile() {
  const { apiBaseUrl, displayName, token, user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoritesStatus, setFavoritesStatus] = useState("loading");
  const avatarUrl = getAvatarUrl(user);
  const joinDate = user?.joinedAt || user?.profileCreatedAt || user?.createdAt;
  const favoriteTeam = useMemo(() => {
    const firstFavorite = favorites[0];

    return firstFavorite?.team?.name || firstFavorite?.teamName || null;
  }, [favorites]);

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      if (!token) {
        setFavoritesStatus("idle");
        return;
      }

      setFavoritesStatus("loading");

      try {
        const response = await fetch(`${apiBaseUrl}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Could not load favorites.");
        }

        if (!ignore) {
          setFavorites(payload?.data || []);
          setFavoritesStatus("ready");
        }
      } catch {
        if (!ignore) {
          setFavoritesStatus("error");
        }
      }
    }

    loadFavorites();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, token]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-zinc-900 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6 shadow-2xl shadow-black/30 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-300/30 bg-cyan-300 text-4xl font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitial(displayName)
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                  ZeroPlay account
                </p>
                <h1 className="mt-2 truncate text-4xl font-black sm:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-3 break-words text-zinc-400">{user?.email}</p>
              </div>
            </div>

            <Link
              to="/settings"
              className="w-fit rounded-2xl bg-cyan-300 px-6 py-3 font-black text-black transition hover:-translate-y-1 hover:bg-cyan-200"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ProfileStat label="Username" value={displayName} />
          <ProfileStat label="Email" value={user?.email || "Unavailable"} />
          <ProfileStat
            id="favorite-team"
            label="Favorite Team"
            value={
              favoritesStatus === "loading"
                ? "Loading"
                : favoritesStatus === "error"
                  ? "Could not load favorites"
                  : favoriteTeam || "No favorite team selected"
            }
          />
          <ProfileStat label="Join Date" value={formatDate(joinDate)} />
          <ProfileStat label="Account Status" value={getAccountStatus(user)} />
          <ProfileStat label="Session Storage" value="Protected by ZeroPlay Auth" />
        </div>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-[#0f0f13] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                Favorite teams
              </p>
              <h2 className="mt-1 text-3xl font-black">Account Picks</h2>
            </div>
            <Link
              to="/teams"
              className="w-fit rounded-xl border border-zinc-800 px-5 py-3 font-black transition hover:border-cyan-300 hover:text-cyan-300"
            >
              Browse Teams
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {favoritesStatus === "ready" && favorites.length > 0 ? (
              favorites.map((favorite) => (
                <article
                  key={favorite.id}
                  className="rounded-2xl border border-zinc-800 bg-black/45 p-4"
                >
                  <p className="font-black">{favorite.team?.name || `Team ${favorite.team_id}`}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {favorite.team?.league || "League unavailable"}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-black/45 p-5 text-zinc-400 md:col-span-2">
                {favoritesStatus === "loading"
                  ? "Loading favorite teams."
                  : "No favorite teams have been saved yet."}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
