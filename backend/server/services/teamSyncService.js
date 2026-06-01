const { getSoccerLeagues } = require("./apiService");
const { supabase, hasSupabaseConfig } = require("./supabaseClient");

const TEAMS_TABLE = "teams";
const ESPN_SOCCER_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer";

function getFetch() {
  return global.fetch || ((...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args)));
}

function assertSupabaseReady() {
  if (!hasSupabaseConfig || !supabase) {
    const error = new Error("Supabase is not configured. Check backend/server/.env.");
    error.statusCode = 500;
    throw error;
  }
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getTeamKey(team) {
  return `${normalizeText(team.name).toLowerCase()}::${normalizeText(team.league).toLowerCase()}`;
}

function createFailure(stage, message, details = {}) {
  return {
    stage,
    message,
    ...details,
  };
}

async function fetchJson(url) {
  const response = await getFetch()(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ZeroPlay/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function extractTeamsEndpointEntries(data) {
  const directTeams = Array.isArray(data.teams) ? data.teams : [];
  const nestedTeams = (data.sports || [])
    .flatMap((sport) => sport.leagues || [])
    .flatMap((league) => league.teams || []);

  return [...directTeams, ...nestedTeams]
    .map((entry) => entry.team || entry)
    .filter(Boolean);
}

function extractScoreboardEntries(data) {
  return (data.events || [])
    .flatMap((event) => event.competitions || [])
    .flatMap((competition) => competition.competitors || [])
    .map((competitor) => competitor.team)
    .filter(Boolean);
}

function normalizeApiTeam(team, league) {
  const name = normalizeText(
    team.displayName ||
      team.name ||
      team.shortDisplayName ||
      team.location
  );

  if (!name) {
    return null;
  }

  return {
    name,
    league: league.name,
    country: league.country,
    updated_at: new Date().toISOString(),
  };
}

async function fetchTeamsForLeague(league) {
  const failures = [];
  let teamsEndpointFailure = null;
  const teamsUrl = `${ESPN_SOCCER_BASE_URL}/${league.code}/teams`;

  try {
    const data = await fetchJson(teamsUrl);
    const teams = extractTeamsEndpointEntries(data)
      .map((team) => normalizeApiTeam(team, league))
      .filter(Boolean);

    if (teams.length > 0) {
      return {
        teams,
        failures,
      };
    }

    teamsEndpointFailure = createFailure("fetch", "ESPN teams endpoint returned no teams.", {
      league: league.name,
      source: teamsUrl,
    });
  } catch (error) {
    teamsEndpointFailure = createFailure("fetch", error.message, {
      league: league.name,
      source: teamsUrl,
    });
  }

  const scoreboardUrl = `${ESPN_SOCCER_BASE_URL}/${league.code}/scoreboard?dates=20250801-20260630&limit=1000`;

  try {
    const data = await fetchJson(scoreboardUrl);
    const teams = extractScoreboardEntries(data)
      .map((team) => normalizeApiTeam(team, league))
      .filter(Boolean);

    if (teams.length === 0) {
      if (teamsEndpointFailure) {
        failures.push(teamsEndpointFailure);
      }

      failures.push(createFailure("fetch", "ESPN scoreboard endpoint returned no teams.", {
        league: league.name,
        source: scoreboardUrl,
      }));
    }

    return {
      teams,
      failures,
    };
  } catch (error) {
    if (teamsEndpointFailure) {
      failures.push(teamsEndpointFailure);
    }

    failures.push(createFailure("fetch", error.message, {
      league: league.name,
      source: scoreboardUrl,
    }));

    return {
      teams: [],
      failures,
    };
  }
}

function dedupeTeams(teams) {
  const byKey = new Map();
  let duplicatesSkipped = 0;

  teams.forEach((team) => {
    const key = getTeamKey(team);

    if (byKey.has(key)) {
      duplicatesSkipped += 1;
    }

    byKey.set(key, team);
  });

  return {
    teams: Array.from(byKey.values()),
    duplicatesSkipped,
  };
}

async function getExistingTeamIndex() {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select("id,name,league");

  if (error) {
    throw new Error(error.message || "Could not load existing teams.");
  }

  const index = new Map();
  let duplicateExistingRecords = 0;

  (data || []).forEach((team) => {
    const key = getTeamKey(team);

    if (index.has(key)) {
      duplicateExistingRecords += 1;
      return;
    }

    index.set(key, team);
  });

  return {
    index,
    duplicateExistingRecords,
  };
}

async function insertTeam(team) {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .insert(team)
    .select("id,name,league")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateTeam(id, team) {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .update(team)
    .eq("id", id)
    .select("id,name,league")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function findExistingTeam(team) {
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select("id,name,league")
    .eq("name", team.name)
    .eq("league", team.league)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function persistTeams(teams) {
  const { index, duplicateExistingRecords } = await getExistingTeamIndex();
  const failures = [];
  let inserted = 0;
  let updated = 0;

  for (const team of teams) {
    const key = getTeamKey(team);
    const existingTeam = index.get(key);

    try {
      if (existingTeam) {
        const updatedTeam = await updateTeam(existingTeam.id, team);
        index.set(key, updatedTeam);
        updated += 1;
        continue;
      }

      const insertedTeam = await insertTeam(team);
      index.set(key, insertedTeam);
      inserted += 1;
    } catch (error) {
      if (error.code === "23505") {
        try {
          const duplicate = await findExistingTeam(team);

          if (duplicate) {
            const updatedTeam = await updateTeam(duplicate.id, team);
            index.set(key, updatedTeam);
            updated += 1;
            continue;
          }
        } catch (lookupError) {
          failures.push(createFailure("upsert", lookupError.message, {
            team: team.name,
            league: team.league,
            code: lookupError.code,
          }));
          continue;
        }
      }

      failures.push(createFailure("upsert", error.message, {
        team: team.name,
        league: team.league,
        code: error.code,
        details: error.details,
      }));
    }
  }

  return {
    inserted,
    updated,
    duplicateExistingRecords,
    failures,
  };
}

function logTeamSyncResult(result) {
  console.info(`[team-sync] records fetched: ${result.recordsFetched}`);
  console.info(`[team-sync] records inserted: ${result.recordsInserted}`);
  console.info(`[team-sync] records updated: ${result.recordsUpdated}`);
  console.info(`[team-sync] duplicates skipped: ${result.duplicatesSkipped}`);
  console.info(`[team-sync] failures: ${result.failures.length}`);

  if (result.failures.length > 0) {
    console.error("[team-sync] failure details:", result.failures);
  }
}

async function fetchTeams() {
  const leagueResults = await Promise.all(
    getSoccerLeagues().map((league) => fetchTeamsForLeague(league))
  );

  const teams = leagueResults.flatMap((result) => result.teams);
  const failures = leagueResults.flatMap((result) => result.failures);

  return {
    teams,
    failures,
  };
}

async function syncTeams() {
  assertSupabaseReady();

  const startedAt = new Date().toISOString();
  const fetched = await fetchTeams();
  const deduped = dedupeTeams(fetched.teams);
  const persisted = await persistTeams(deduped.teams);
  const failures = [...fetched.failures, ...persisted.failures];

  const result = {
    success: failures.length === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    recordsFetched: fetched.teams.length,
    recordsInserted: persisted.inserted,
    recordsUpdated: persisted.updated,
    duplicatesSkipped: deduped.duplicatesSkipped,
    duplicateExistingRecords: persisted.duplicateExistingRecords,
    failures,
  };

  logTeamSyncResult(result);

  return result;
}

module.exports = {
  syncTeams,
  fetchTeams,
};
