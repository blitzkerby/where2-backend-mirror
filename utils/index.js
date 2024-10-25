const AppError = require("./appError");
const globalErrorHandler = require("../controllers/errorController");

module.exports = (app) => {
  // Undefined route handler
  app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global error handler
  app.use(globalErrorHandler);
};
