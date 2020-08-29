/**
 * Logs network activity
 *
 * @param {import('express').Application} app The express Application to hook onto
 */
module.exports = function (app) {
  const router = require('express').Router();

  /**
   * Response
   */
  app.use(function (req, res, next) {
    res.on('finish', function () {
      console.log(`${res.statusCode} ${req.originalUrl} ${req.ip}`);
    });
    return next();
  });

  /**
   * Request
   */
  router.all('*', function (req, res, next) {
    console.log(`${req.method} ${req.originalUrl} ${req.ip}`);
    return next();
  });

  return router;
};
