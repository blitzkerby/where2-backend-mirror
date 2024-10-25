const logger = require("./utils/logger.js");

const dotenv = require("dotenv");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";
dotenv.config({ path: envFile });


const port = process.env.PORT || 5000;
const app = require("./app.js");

// If THERE IS ERROR, STOP
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

if (process.env.NODE_ENV === "development") {
  Object.keys(require.cache).forEach(function(key) {
    delete require.cache[key];
  });
}

// RUNS ON LOCAL PORT 4000 FOR BACKEND
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// IF THERE IS REJECTION ERROR, STOP
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
