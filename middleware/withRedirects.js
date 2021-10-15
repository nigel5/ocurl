/**
 * Middleware to redirect urls with short url param
 *
 * Settings
 * DEFAULT_REDIRECT_URL
 */
module.exports = function () {
  const router = require('express').Router();
  const a = require('debug')('middleware:redirects');
  const path = require('path');

  const defaultRedirectUrl =
    process.env.DEFAULT_REDIRECT_URL ||
    require('../main').settings.default_redirect_url;

  /**
   * Redirect user to decoded url
   */
  router.get('/:key', async function (req, res, next) {
    // Confused with static files?
    if (!req.existingMapping && req.path === '/privacy-policy') {
      res
        .status(200)
        .sendFile(
          path.join(__PROJECT_PATH_ROOT, 'public', 'privacy-policy.html')
        );

      return next();
    }

    if (req.existingMapping) {
      a(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${req.existingMapping.toUrl}`
      );
      if (req.log) req.log.info(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${req.existingMapping.toUrl}`
      );
      res.redirect(req.existingMapping.toUrl);
    } else {
      a(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${defaultRedirectUrl}`
      );
      if (req.log) req.log.info(
        `Redirecting client ${req.ip} ${req.originalUrl} -> ${defaultRedirectUrl}`
      );
      res.redirect(defaultRedirectUrl);
    }

    return next();
  });

  return router;
};
