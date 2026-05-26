require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const teamsRouter = require("./routes/teams");
const gamesRouter = require("./routes/games");
const externalRoutes = require("./routes/external");
const securityRoutes = require("./routes/security");
const newsRoutes = require("./routes/news");

const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

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
app.use("/teams", teamsRouter);
app.use("/games", gamesRouter);
app.use("/external", externalRoutes);
app.use("/security", securityRoutes);
app.use("/news", newsRoutes);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ZeroPlay API running",
  });
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});