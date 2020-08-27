module.exports = function () {
  const router = require('express').Router();
  const responses = require('../util/responses');

  /**
   * Redirect user to decoded url
   */
  router.get('/*', async function (req, res, next) {
    if (req.existingMapping) {
      res.redirect(req.existingMapping.toUrl);
    } else {
      res.status(400).send(responses.errResponse(true, 'Invalid url')); // TODO this needs to be a pretty page
    }
  });

  return router;
};
