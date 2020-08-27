module.exports = function () {
  const router = require("express").Router();
  const rollStr = require('../util/generation').rollStr;
  const settings = require('../ocshorten.conf.json');

  const numberOfCharacters = process.env.GENERATED_URL_LENGTH ? process.env.GENERATED_URL_LENGTH : settings.generated_url_length;
  const baseURL = process.env.BASE_URL ? process.env.BASE_URL : settings.base_url;

  /**
   * Get a short url
   * 
   * Query parameters
   * q string The original url
   */
  router.get('/api/v1/url', async function (req, res, next) {
    // Generate letters
    const letters = rollStr(numberOfCharacters);
    res.send(`${baseURL}/${letters}`);

    // Save url in cache

    // Save in perm database for long term
  });

  /**
   * Decodes a short url
   * 
   * Query parameters
   * q string The shortened url
   */
  router.get('/api/v1/decode', async function (req, res, next) {

  });

  return router;
}
