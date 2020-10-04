/***
 * Stackdriver logger.
 *
 * Exports logger and transport null if not configured.
 * Configure by exporting the environment variable to GCP credentials.
 *
 * Required permission is writing to stackdriver logs.
 *
 * Settings
 *  Environmental variable GOOGLE_APPLICATION_CREDENTIALS
 */

const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

// const { settings } = require('../main');

const { version } = require('../package.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  module.exports.loggingWinston = null;
  module.exports.logger = null;
} else {
  const loggingWinston = new LoggingWinston({
    serviceContext: {
      service: 'ocurl',
      version,
    },
  });

  module.exports.loggingWinston = loggingWinston;

  const logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console(), loggingWinston],
  });

  module.exports.logger = logger;
}
