require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRouter = require("./routes/auth");
const teamsRouter = require("./routes/teams");
const gamesRouter = require("./routes/games");
const favoritesRouter = require("./routes/favorites");
const externalRoutes = require("./routes/external");
const securityRoutes = require("./routes/security");
const newsRoutes = require("./routes/news");
const {
  runTeamSyncJob,
  startTeamSyncJob,
} = require("./jobs/teamSyncJob");

const errorHandler = require("./middleware/errorHandler");
const {
  supabase,
  supabaseUrl,
  supabaseKeyType,
  hasSupabaseConfig,
  getSupabaseRestHeaders,
} = require("./services/supabaseClient");

const app = express();

const PORT = process.env.PORT || 5000;
const fetchJson = (...args) => {
  const fetcher = global.fetch || ((...fetchArgs) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...fetchArgs)));

  return fetcher(...args);
};
const apiRoutes = [
  "/",
  "/hello",
  "/health",
  "/auth",
  "/teams",
  "/games",
  "/favorites",
  "/external",
  "/security",
  "/news",
  "/admin/sync-teams",
  "/supabase-test",
];

// RATE LIMITER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// GLOBAL MIDDLEWARE
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(limiter);

// ROUTES
app.use("/auth", authRouter);
app.use("/teams", teamsRouter);
app.use("/games", gamesRouter);
app.use("/favorites", favoritesRouter);
app.use("/external", externalRoutes);
app.use("/security", securityRoutes);
app.use("/news", newsRoutes);

app.get("/admin/sync-teams", async (req, res) => {
  try {
    const result = await runTeamSyncJob();

    return res.json({
      success: result.success,
      message: result.skipped ? result.message : "Team sync completed.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Team sync failed.",
      error: error.message,
    });
  }
});

// ROOT ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ZeroPlay API running",
    routes: apiRoutes,
  });
});

// TEST ROUTE
app.get("/hello", (req, res) => {
  res.json({
    success: true,
    message: "Hello route works",
    service: "ZeroPlay API",
  });
});

// HEALTH ROUTE
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ZeroPlay API",
    supabaseConfigured: hasSupabaseConfig,
    supabaseKeyType,
    routes: apiRoutes,
  });
});

// SUPABASE TEST ROUTE
app.get("/supabase-test", async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({
      success: false,
      message: "Supabase is not configured. Check SUPABASE_URL and SUPABASE_KEY in backend/server/.env.",
    });
  }

  try {
    const tableName = req.query.table;

    if (tableName) {
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({
          success: false,
          message: "Table names can only contain letters, numbers, and underscores.",
        });
      }

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(5);

      if (error) {
        return res.status(500).json({
          success: false,
          message: `Supabase connected, but the ${tableName} table query failed.`,
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }

      return res.json({
        success: true,
        message: `Supabase connected and the ${tableName} table is readable.`,
        data,
      });
    }

    const response = await fetchJson(`${supabaseUrl}/auth/v1/settings`, {
      headers: getSupabaseRestHeaders(),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Supabase project responded, but the connection check failed.",
        status: response.status,
        statusText: response.statusText,
      });
    }

    res.json({
      success: true,
      message: "Supabase connection is live.",
      projectUrl: supabaseUrl,
      keyType: supabaseKeyType,
      tableCheck: "Use /supabase-test?table=your_table_name to test a specific database table.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Supabase test failed.",
      error: error.message,
    });
  }
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

// START SERVER
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

if (process.env.TEAM_SYNC_AUTO_START !== "false") {
  startTeamSyncJob();
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or use another PORT.`);
  } else {
    console.error("Server failed to start:", error);
  }

  process.exitCode = 1;
});

module.exports = {
  app,
  server,
};
