/**
 * Logs network activity
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
    });
    return next();
  });

  /**
   * Request
   */
  router.all('*', function (req, res, next) {
    n(`${req.method} ${req.ip} ${req.originalUrl}`);
    return next();
  });

  return router;
};
