import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthContext from "./authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AUTH_STORAGE_KEY = "zeroplay.auth";

function getDisplayName(user) {
  return user?.username || user?.profile?.username || user?.email?.split("@")[0] || "User";
}

function getToken(authData) {
  return authData?.session?.accessToken || authData?.token || null;
}

function isExpired(authData) {
  const expiresAt = authData?.session?.expiresAt;

  if (!expiresAt) {
    return false;
  }

  return Number(expiresAt) * 1000 <= Date.now();
}

function readStoredAuth() {
  const candidates = [
    { storage: localStorage, storageType: "local" },
    { storage: sessionStorage, storageType: "session" },
  ];

  for (const candidate of candidates) {
    const rawValue = candidate.storage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) {
      continue;
    }

    try {
      const authData = JSON.parse(rawValue);

      if (getToken(authData) && !isExpired(authData)) {
        return {
          authData,
          storageType: candidate.storageType,
        };
      }

      candidate.storage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      candidate.storage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return null;
}

function normalizeAuthData(authData) {
  if (!authData) {
    return null;
  }

  const profile = authData.profile || null;
  const user = {
    ...(authData.user || {}),
    ...(profile || {}),
  };

  return {
    ...authData,
    user,
    profile,
  };
}

function persistAuthData(authData, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  storage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...authData,
      savedAt: new Date().toISOString(),
    }),
  );
  otherStorage.removeItem(AUTH_STORAGE_KEY);
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload?.data;
}

function mergeCurrentUser(authData, currentUser) {
  return normalizeAuthData({
    ...authData,
    user: {
      ...(authData?.user || {}),
      ...(currentUser || {}),
    },
    profile: {
      ...(authData?.profile || {}),
      ...(currentUser?.profile || {}),
      username: currentUser?.username || authData?.profile?.username,
    },
  });
}

export function AuthProvider({ children }) {
  const storedAuth = useMemo(() => readStoredAuth(), []);
  const [authData, setAuthData] = useState(() => normalizeAuthData(storedAuth?.authData));
  const [storageType, setStorageType] = useState(storedAuth?.storageType || null);
  const [isRestoring, setIsRestoring] = useState(Boolean(storedAuth?.authData));

  const token = getToken(authData);
  const user = authData?.user || null;
  const isAuthenticated = Boolean(token && user);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setAuthData(null);
    setStorageType(null);
  }, []);

  const fetchCurrentUser = useCallback(async (accessToken) => {
    return requestJson("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function restoreSession() {
      if (!storedAuth?.authData) {
        setIsRestoring(false);
        return;
      }

      const accessToken = getToken(storedAuth.authData);

      if (!accessToken) {
        clearAuth();
        setIsRestoring(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(accessToken);
        const nextAuthData = mergeCurrentUser(storedAuth.authData, currentUser);

        if (!ignore) {
          setAuthData(nextAuthData);
          setStorageType(storedAuth.storageType);
          persistAuthData(nextAuthData, storedAuth.storageType === "local");
        }
      } catch {
        if (!ignore) {
          clearAuth();
        }
      } finally {
        if (!ignore) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      ignore = true;
    };
  }, [clearAuth, fetchCurrentUser, storedAuth]);

  const signIn = useCallback(
    async ({ email, password, rememberMe }) => {
      const loginData = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const accessToken = getToken(loginData);

      if (!accessToken) {
        throw new Error("Login did not return a session token.");
      }

      const currentUser = await fetchCurrentUser(accessToken);
      const nextAuthData = mergeCurrentUser(loginData, currentUser);

      persistAuthData(nextAuthData, rememberMe);
      setAuthData(nextAuthData);
      setStorageType(rememberMe ? "local" : "session");

      return nextAuthData;
    },
    [fetchCurrentUser],
  );

  const signUp = useCallback(
    async ({ email, password, username, rememberMe }) => {
      const signupData = await requestJson("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, username }),
      });
      const accessToken = getToken(signupData);

      if (!accessToken) {
        return signupData;
      }

      const currentUser = await fetchCurrentUser(accessToken);
      const nextAuthData = mergeCurrentUser(signupData, currentUser);

      persistAuthData(nextAuthData, rememberMe);
      setAuthData(nextAuthData);
      setStorageType(rememberMe ? "local" : "session");

      return nextAuthData;
    },
    [fetchCurrentUser],
  );

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    const currentUser = await fetchCurrentUser(token);
    const nextAuthData = mergeCurrentUser(authData, currentUser);

    persistAuthData(nextAuthData, storageType === "local");
    setAuthData(nextAuthData);

    return nextAuthData.user;
  }, [authData, fetchCurrentUser, storageType, token]);

  const updateAccount = useCallback(
    async (updates) => {
      if (!token) {
        throw new Error("You must be logged in to update account settings.");
      }

      const currentUser = await requestJson("/auth/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const nextAuthData = mergeCurrentUser(authData, currentUser);

      persistAuthData(nextAuthData, storageType === "local");
      setAuthData(nextAuthData);

      return nextAuthData.user;
    },
    [authData, storageType, token],
  );

  const logout = useCallback(async () => {
    const accessToken = token;

    clearAuth();

    if (!accessToken) {
      return;
    }

    try {
      await requestJson("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Local logout still wins if the backend session has already expired.
    }
  }, [clearAuth, token]);

  const value = useMemo(
    () => ({
      apiBaseUrl: API_BASE_URL,
      authData,
      displayName: getDisplayName(user),
      isAuthenticated,
      isRestoring,
      logout,
      refreshUser,
      signIn,
      signUp,
      storageType,
      token,
      updateAccount,
      user,
    }),
    [
      authData,
      isAuthenticated,
      isRestoring,
      logout,
      refreshUser,
      signIn,
      signUp,
      storageType,
      token,
      updateAccount,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
