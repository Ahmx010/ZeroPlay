const { supabase, hasSupabaseConfig } = require("./supabaseClient");

const TEAMS_TABLE = "teams";

function assertSupabaseReady() {
  if (!hasSupabaseConfig || !supabase) {
    const error = new Error("Supabase is not configured. Check backend/server/.env.");
    error.statusCode = 500;
    throw error;
  }
}

function handleSupabaseError(error, fallbackMessage) {
  if (!error) {
    return;
  }

  const nextError = new Error(error.message || fallbackMessage);
  nextError.statusCode = 500;
  nextError.code = error.code;
  nextError.details = error.details;
  throw nextError;
}

async function getAllTeams() {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select("*")
    .order("id", { ascending: true });

  handleSupabaseError(error, "Could not load teams from Supabase.");

  return data || [];
}

async function getTeamById(id) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  handleSupabaseError(error, "Could not load team from Supabase.");

  return data;
}

module.exports = {
  getAllTeams,
  getTeamById,
};
