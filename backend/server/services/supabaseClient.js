const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const isOpaqueSupabaseKey = supabaseKey?.startsWith("sb_");
const supabaseKeyType = supabaseKey?.startsWith("sb_publishable_")
  ? "publishable"
  : supabaseKey?.startsWith("sb_secret_")
    ? "secret"
    : supabaseKey
      ? "legacy-jwt"
      : "missing";

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
  hasSupabaseConfig,
  getSupabaseRestHeaders,
};
