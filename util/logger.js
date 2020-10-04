/***
 * Stackdriver logger
 */

const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const { version } = require('../package.json');

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
