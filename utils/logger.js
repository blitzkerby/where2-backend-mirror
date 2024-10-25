const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
const dotenv = require("dotenv");
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
                 process.env.NODE_ENV === 'test' ? '.env.test' :
                 '.env.development';
dotenv.config({ path: envFile });

const logDir = process.env.LOG_DIR || path.join(__dirname, 'logs', process.env.NODE_ENV);

const transport = new DailyRotateFile({
  filename: `${logDir}/app-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: process.env.LOG_LEVEL || 'info',
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
    }),
    transport,
  ],
});

// Error handling for logging
logger.on('error', (err) => {
  console.error('Logging error:', err);
});

module.exports = logger;
