/**
 * Middleware to redirect urls with short url param
 *
 * Settings
 * DEFAULT_REDIRECT_URL
 */
module.exports = function () {
  const router = require('express').Router();
  const a = require('debug')('middleware:redirects');

  const defaultRedirectUrl =
    process.env.DEFAULT_REDIRECT_URL ||
    require('../main').settings.default_redirect_url;

  /**
   * Redirect user to decoded url
   */
  router.get('/:key', async function (req, res, next) {
    if (req.existingMapping) {
      a(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${req.existingMapping.toUrl}`
      );
      return res.redirect(req.existingMapping.toUrl);
    } else {
      a(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${defaultRedirectUrl}`
      );
      return res.redirect(defaultRedirectUrl);
    }
  });

  return router;
};
