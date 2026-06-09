require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

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
  hasSupabaseConfig,
  getSupabaseRestHeaders,
} = require("./services/supabaseClient");

const app = express();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const adminSyncToken = process.env.ADMIN_SYNC_TOKEN;
const enableSupabaseDiagnostics =
  process.env.ENABLE_SUPABASE_DIAGNOSTICS === "true" && !isProduction;
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
  ...(adminSyncToken ? ["/admin/sync-teams"] : []),
  ...(enableSupabaseDiagnostics ? ["/supabase-test"] : []),
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

function getAdminSyncToken(req) {
  const headerToken = req.get("x-admin-token");

  if (headerToken) {
    return headerToken;
  }

  const authorization = req.get("authorization") || "";
  const [scheme, token, ...extraParts] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() === "bearer" && token && extraParts.length === 0) {
    return token;
  }

  return null;
}

function isValidAdminSyncToken(token) {
  if (!adminSyncToken || !token) {
    return false;
  }

  const expected = Buffer.from(adminSyncToken);
  const received = Buffer.from(token);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

function requireAdminSyncToken(req, res, next) {
  if (!adminSyncToken) {
    return res.status(503).json({
      success: false,
      message: "Manual team sync is disabled.",
    });
  }

  if (!isValidAdminSyncToken(getAdminSyncToken(req))) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid admin sync token.",
    });
  }

  return next();
}

async function handleTeamSync(req, res) {
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
}

app.get("/admin/sync-teams", requireAdminSyncToken, handleTeamSync);
app.post("/admin/sync-teams", requireAdminSyncToken, handleTeamSync);

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
    routes: apiRoutes,
  });
});

// Local-only Supabase diagnostics. Keep disabled in production and public demos.
if (enableSupabaseDiagnostics) {
  app.get("/supabase-test", async (req, res) => {
    if (!hasSupabaseConfig || !supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase is not configured. Check the backend Supabase environment variables.",
      });
    }

    try {
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

      return res.json({
        success: true,
        message: "Supabase connection is live.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase test failed.",
        error: error.message,
      });
    }
  });
}

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
