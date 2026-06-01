const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKeyCandidate = [
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ["SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY],
  ["SUPABASE_KEY", process.env.SUPABASE_KEY],
  ["SUPABASE_PUBLISHABLE_KEY", process.env.SUPABASE_PUBLISHABLE_KEY],
  ["SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY],
].find(([, value]) => Boolean(value));
const supabaseKeySource = supabaseKeyCandidate?.[0] || "missing";
const supabaseKey = supabaseKeyCandidate?.[1];

function decodeJwtPayload(key) {
  const [, payload] = String(key || "").split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalizedPayload, "base64").toString("utf8");

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getSupabaseKeyType(key, source) {
  if (!key) {
    return "missing";
  }

  if (source === "SUPABASE_SERVICE_ROLE_KEY" || source === "SUPABASE_SECRET_KEY") {
    return "secret";
  }

  if (key.startsWith("sb_secret_")) {
    return "secret";
  }

  if (source === "SUPABASE_PUBLISHABLE_KEY" || key.startsWith("sb_publishable_")) {
    return "publishable";
  }

  if (source === "SUPABASE_ANON_KEY") {
    return "anon";
  }

  const jwtPayload = decodeJwtPayload(key);

  if (jwtPayload?.role === "service_role") {
    return "secret";
  }

  if (jwtPayload?.role === "anon") {
    return "anon";
  }

  return "legacy-jwt";
}

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const isOpaqueSupabaseKey = supabaseKey?.startsWith("sb_");
const supabaseKeyType = getSupabaseKeyType(supabaseKey, supabaseKeySource);

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

function createSupabaseClient(accessToken) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const options = {
    ...serverAuthOptions,
  };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
}

const supabase = createSupabaseClient();

function createSupabaseUserClient(accessToken) {
  return createSupabaseClient(accessToken);
}

const getSupabaseRestHeaders = () => {
  const headers = {
    apikey: supabaseKey,
  };

  if (!isOpaqueSupabaseKey) {
    headers.Authorization = `Bearer ${supabaseKey}`;
  }

  return headers;
};

module.exports = {
  supabase,
  supabaseUrl,
  supabaseKeyType,
  supabaseKeySource,
  hasSupabaseConfig,
  createSupabaseUserClient,
  getSupabaseRestHeaders,
};
