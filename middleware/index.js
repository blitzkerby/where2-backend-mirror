const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compress = require("compression");
const hpp = require("hpp");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

module.exports = (app) => {
  // Security middleware
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
  app.use(cors());
  app.use(mongoSanitize());
  app.use(xss());
  app.use(
    hpp({
      whitelist: ["role", "active", "phoneNumber", "address"],
    })
  );

  // Performance middleware
  app.use(compress());

  // Logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  if (process.env.NODE_ENV === "production") {
    app.use(morgan("common"));

    // Rate limiting
    const limiter = rateLimit({
      max: 100,
      windowMs: 60 * 60 * 1000,
      message: "Too many requests from this IP, please try again in an hour!",
    });
    app.use("/api", limiter);
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
};
