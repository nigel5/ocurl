/**
 * Middleware to redirect urls with short url param
 *
 * Settings
 * DEFAULT_REDIRECT_URL
 */
module.exports = function () {
  const router = require('express').Router();

  const defaultRedirectUrl =
    process.env.DEFAULT_REDIRECT_URL ||
    require('../main').settings.default_redirect_url;

  /**
   * Redirect user to decoded url
   */
  router.get('/:key', async function (req, res, next) {
    if (req.existingMapping) {
      return res.redirect(req.existingMapping.toUrl);
    } else {
      return res.redirect(defaultRedirectUrl);
    }
  });

  return router;
};
