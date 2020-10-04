/**
 * Logs network activity
 *
 * @param {import('express').Application} app The express Application to hook onto
 */
module.exports = function (app) {
  const router = require('express').Router();
  const d = require('debug')('middleware:log');
  const n = require('debug')('app:network');
  const lw = require('@google-cloud/logging-winston');

  const { logger, loggingWinston } = require('../util/logger');

  d('Initialized middleware');

  let gcpLogger;

  if (logger && loggingWinston) {
    lw.express.makeMiddleware(logger, loggingWinston).then((middleware) => {
      gcpLogger = middleware;
    });
    d('Initialized Stackdriver logging');
  }

  /**
   * Response
   */
  app.use(function (req, res, next) {
    res.on('finish', function () {
      n(`${res.statusCode} ${req.ip} ${req.originalUrl}`);

      // Log to stackdriver if configured
      if (gcpLogger) {
        gcpLogger(req, res, next);
      }
    });
    return next();
  });

  return router;
};
