/**
 * Logs network activity to debug console, and IP addresses to Stackdriver.
 *
 * @param {import('express').Application} app The express Application to hook onto
 */
module.exports = function (app) {
  const router = require('express').Router();
  const d = require('debug')('middleware:log');
  const n = require('debug')('app:network');

  d('Initialized middleware');

  /**
   * Response
   */
  app.use(function (req, res, next) {
    res.on('finish', function () {
      n(`${res.statusCode} ${req.ip} ${req.originalUrl}`);
      req.log.info(req.ip);
    });

    return next();
  });

  return router;
};
