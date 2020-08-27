module.exports = function () {
  const router = require("express").Router();

  /**
   * Redirect user to decoded url
   */
  router.get('/*', async function (req, res, next) {
    res.redirect('https://www.google.com/');
  });

  return router;
}
