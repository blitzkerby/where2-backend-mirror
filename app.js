/**
 * dependencies
 * 
 * please arrange it by color and length
 */
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const compress = require("compression");
const cookieParser = require("cookie-parser");

const xss = require("xss-clean");
const dotenv = require("dotenv");
const helmet = require("helmet");
const logger = require("./utils/logger.js");
const slowDown = require("express-slow-down");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const globalErrorHandler = require("./controllers/errorController");

// ROUTERS FOR ROUTES

/**
 * models
 * 
 * please arrange it by length
 */
const { User } = require("./model");
const AppError = require("./utils/appError");

// ROUTERS FOR ROUTES
// const paymentRouter = require("./routes/paymentRouter.js");


const aiRoute = require("./routes/openAIRoute.js");
const jobRouter = require("./routes/jobRoutes.js");
const listRouter = require("./routes/listRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const photoRouter = require("./routes/photoRouter.js");
const healthRouter = require("./routes/healthRouter.js");
const profileRouter = require("./routes/profileRoute.js");
const paymentRouter = require("./routes/paymentRouter.js");
const companyRouter = require("./routes/companyRoutes.js");
const favoriteRouter = require("./routes/favoriteRoutes.js");
const communityRouter = require("./routes/communityRouter.js");
const dashboardRouter = require("./routes/dashboardRouter.js");
const visitorRouter = require("./routes/visitorCountRoutes.js");
const universitiesRouter = require("./routes/universityRoute.js");
const scholarshipsRouter = require("./routes/scholarshipsRouter.js");
const accommodationRouter = require("./routes/accommodationRoutes.js");
const developerOnlyRouter = require("./routes/developerOnlyRoutes.js");

// LOAD ENVIRONMENT VARIABLES BASED ON ENVIRONMENTS
// SPLITTED .ENV FILE INTO THREE SEPARATE FILES (.ENV.DEVELOPMENT; .ENV.TEST; .ENV.PRODUCTION)
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";

dotenv.config({ path: envFile });

console.log(envFile);

const app = express();

// MIDDLEWARE FOR SECURING COOKIES
app.use(cookieParser());
app.use((req, res, next) => {
  res.cookie("yourCookieName", "yourCookieValue", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  next();
});

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-scripts.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL], // WILL BE ADDED THE FRONTEND URL LATER (IN THE .ENV FILE)
      frameSrc: ["'none'"],
    },
  })
);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Enforce HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Performance middleware
app.use(compress());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV === "production") {
  app.use(morgan("common"));
  app.use(morgan("dev"));
}

if (process.env.NODE_ENV === "production") {
  app.use(morgan("common"));
}

// Rate limiting and DDoS protection
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: "Too many requests, please try again later.",
    },
  });

  app.use("/api", limiter); // Apply rate limiting only in production

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // Allow 100 requests before slowing down
    delayMs: 500, // 500ms delay per request after 100
  });
}

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(`${__dirname}/public`));

// Custom middleware to log request time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes

/**
 * FOR THE LOVE OF CHRIST DO NOT LET CHATGPT ARRANGE IT 
 */

app.use("/api/ai", aiRoute);
app.use("/api", paymentRouter);
app.use("/api/jobs", jobRouter);
app.use("/api", communityRouter);
app.use("/api/list", listRouter);
app.use("/api/user", photoRouter);
app.use("/api/users", userRouter);
app.use("/api/health", healthRouter);
app.use("/api/users", profileRouter);
app.use("/api/visitors", visitorRouter);
app.use("/api/companies", companyRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/developer", developerOnlyRouter);
app.use("/api/university", universitiesRouter);
app.use("/api/scholarships", scholarshipsRouter);
app.use("/api/accommodation", accommodationRouter);
app.use("/api/detail/university", universitiesRouter);
app.use("/api/detail/scholarship", scholarshipsRouter);

// app.use('/api/list/university', universitiesRouter);

// Undefined route handler
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Disable Express "X-Powered-By" header
app.disable("x-powered-by");

module.exports = app;
