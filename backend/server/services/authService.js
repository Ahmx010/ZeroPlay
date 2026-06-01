const {
  supabase,
  supabaseUrl,
  hasSupabaseConfig,
  getSupabaseRestHeaders,
} = require("./supabaseClient");
const { normalizeEmail } = require("../utils/validators");

const PROFILES_TABLE = "profiles";

function assertSupabaseReady() {
  if (!hasSupabaseConfig || !supabase) {
    const error = new Error("Supabase is not configured. Check backend/server/.env.");
    error.statusCode = 500;
    throw error;
  }
}

function createServiceError(message, statusCode, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function handleSupabaseAuthError(error, fallbackMessage, statusCode = 400) {
  if (!error) {
    return;
  }

  throw createServiceError(
    error.message || fallbackMessage,
    error.status || error.statusCode || statusCode,
    error,
  );
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at,
    createdAt: user.created_at,
  };
}

function normalizeSession(session) {
  if (!session) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    tokenType: session.token_type,
    expiresIn: session.expires_in,
    expiresAt: session.expires_at,
  };
}

async function getProfile(userClient, userId) {
  if (!userClient) {
    throw createServiceError("Authenticated Supabase client is not available.", 500);
  }

  const { data, error } = await userClient
    .from(PROFILES_TABLE)
    .select("id, username, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw createServiceError(error.message || "Could not load profile.", 500, error);
  }

  return data;
}

function normalizeCurrentUser(user, profile) {
  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.userMetadata?.username || null,
    createdAt: user.createdAt,
    emailConfirmedAt: user.emailConfirmedAt,
    profileCreatedAt: profile?.created_at || null,
    accountStatus: user.emailConfirmedAt === null ? "Email verification pending" : "Active",
  };
}

async function verifyCurrentPassword(email, password) {
  if (!password) {
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  handleSupabaseAuthError(error, "Current password is incorrect.", 401);
}

async function updateAuthUser(accessToken, updates) {
  const authUpdates = {};

  if (updates.email) {
    authUpdates.email = normalizeEmail(updates.email);
  }

  if (updates.password) {
    authUpdates.password = updates.password;
  }

  if (Object.keys(authUpdates).length === 0) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      ...getSupabaseRestHeaders(),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authUpdates),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw createServiceError(
      payload?.message ||
        payload?.error_description ||
        payload?.error ||
        "Could not update authentication details.",
      response.status,
      payload,
    );
  }

  return normalizeUser(payload?.user || payload);
}

async function updateProfile(userClient, userId, updates) {
  if (!updates.username) {
    return getProfile(userClient, userId);
  }

  const { data, error } = await userClient
    .from(PROFILES_TABLE)
    .update({
      username: updates.username.trim(),
    })
    .eq("id", userId)
    .select("id, username, created_at")
    .single();

  if (error) {
    const message = error.code === "23505"
      ? "Username is already taken."
      : error.message || "Could not update profile.";

    throw createServiceError(message, error.code === "23505" ? 409 : 500, error);
  }

  return data;
}

async function signup({ email, password, username }) {
  assertSupabaseReady();

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = username.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        username: normalizedUsername,
      },
    },
  });

  handleSupabaseAuthError(error, "Could not create account.");

  return {
    user: normalizeUser(data.user),
    session: normalizeSession(data.session),
    profile: data.user
      ? {
          id: data.user.id,
          username: normalizedUsername,
        }
      : null,
    emailVerificationRequired: !data.session,
  };
}

async function login({ email, password }) {
  assertSupabaseReady();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  handleSupabaseAuthError(error, "Invalid email or password.", 401);

  return {
    user: normalizeUser(data.user),
    session: normalizeSession(data.session),
  };
}

async function logout(accessToken) {
  assertSupabaseReady();

  const { error } = await supabase.auth.admin.signOut(accessToken, "local");

  if (error) {
    throw createServiceError(error.message || "Could not log out.", error.status || 500, error);
  }

  return {
    message: "Logged out successfully.",
  };
}

async function getMe({ user, userClient }) {
  const profile = await getProfile(userClient, user.id);

  return normalizeCurrentUser(user, profile);
}

async function updateMe({ user, userClient, accessToken, updates }) {
  assertSupabaseReady();

  const wantsAuthUpdate = Boolean(updates.email || updates.password);

  if (wantsAuthUpdate) {
    await verifyCurrentPassword(user.email, updates.currentPassword);
  }

  const profile = await updateProfile(userClient, user.id, updates);
  const updatedAuthUser = await updateAuthUser(accessToken, updates);
  const nextUser = updatedAuthUser
    ? {
        ...user,
        ...updatedAuthUser,
        emailConfirmedAt: updatedAuthUser.emailConfirmedAt,
        createdAt: updatedAuthUser.createdAt,
      }
    : user;

  return normalizeCurrentUser(nextUser, profile);
}

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateMe,
};
