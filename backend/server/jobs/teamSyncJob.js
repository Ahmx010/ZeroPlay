const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const { syncTeams } = require("../services/teamSyncService");
const {
  supabaseKeySource,
  supabaseKeyType,
} = require("../services/supabaseClient");

const DEFAULT_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

let syncTimer = null;
let syncRunning = false;

function getSyncIntervalMs() {
  const value = Number(process.env.TEAM_SYNC_INTERVAL_MS);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return DEFAULT_SYNC_INTERVAL_MS;
}

async function runTeamSyncJob() {
  if (syncRunning) {
    const result = {
      success: true,
      skipped: true,
      message: "Team sync is already running.",
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      failures: [],
    };

    console.info("[team-sync-job] sync skipped because a run is already in progress.");
    return result;
  }

  syncRunning = true;
  console.info("[team-sync-job] starting team sync.");
  console.info(`[team-sync-job] Supabase key type: ${supabaseKeyType}`);
  console.info(`[team-sync-job] Supabase key source: ${supabaseKeySource}`);

  try {
    const result = await syncTeams();
    console.info("[team-sync-job] team sync finished.");
    return result;
  } catch (error) {
    console.error("[team-sync-job] team sync failed:", error);
    throw error;
  } finally {
    syncRunning = false;
  }
}

function startTeamSyncJob(options = {}) {
  const intervalMs = options.intervalMs || getSyncIntervalMs();
  const runImmediately = options.runImmediately !== false;

  if (syncTimer) {
    return syncTimer;
  }

  if (runImmediately) {
    runTeamSyncJob().catch(() => {});
  }

  syncTimer = setInterval(() => {
    runTeamSyncJob().catch(() => {});
  }, intervalMs);

  return syncTimer;
}

function stopTeamSyncJob() {
  if (!syncTimer) {
    return;
  }

  clearInterval(syncTimer);
  syncTimer = null;
}

if (require.main === module) {
  runTeamSyncJob()
    .then(() => {
      process.exitCode = 0;
    })
    .catch(() => {
      process.exitCode = 1;
    });
}

module.exports = {
  runTeamSyncJob,
  startTeamSyncJob,
  stopTeamSyncJob,
};
