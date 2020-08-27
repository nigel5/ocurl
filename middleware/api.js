const { Client } = require('cassandra-driver');

/**
 * Public API for One Click Shorten
 * @param {Client} cassandraClient Client to execute commands on
 */
module.exports = function (cassandraClient) {
  const router = require('express').Router();
  const LocalDate = require('cassandra-driver').types.LocalDate;

  const responses = require('../util/responses');
  const rollStr = require('../util/generation').rollStr;
  const settings = require('../ocshorten.conf.json');
  const statements = require('../util/database/statements');

  const numberOfCharacters = process.env.GENERATED_URL_LENGTH
    ? process.env.GENERATED_URL_LENGTH
    : settings.generated_url_length;
  const baseURL = process.env.BASE_URL
    ? process.env.BASE_URL
    : settings.base_url;

  /**
   * Get a short url
   *
   * Query parameters
   * q string The original url
   */
  router.get('/api/v1/url', async function (req, res, next) {
    // TODO dont generate if already exists
    // Generate letters
    const letters = rollStr(numberOfCharacters);

    const originalUrl = req.query.q;

    if (!originalUrl) {
      return res.send(
        responses.errResponse(false, 'You must provide a url to shorten')
      );
    }

    const shortUrl = `${baseURL}/${letters}`;
    const requesterIp = req.ip;

    res.send(
      responses.dataResponse({
        url: shortUrl,
      })
    );

    // Save url in cache

    // Save in perm database for long term
    cassandraClient.execute(statements.INSERT_URL, [
      originalUrl,
      shortUrl,
      LocalDate.now(),
      requesterIp,
    ]);
  });

  /**
   * Decodes a short url
   *
   * Query parameters
   * q string The shortened url
   */
  router.get('/api/v1/decode', async function (req, res, next) {
    const shortenedUrl = req.query.q;

    if (!shortenedUrl) {
      return res.send(
        responses.errResponse(
          false,
          'You must provide a shortened url to decode'
        )
      );
    }

    try {
      let result = await cassandraClient.execute(statements.SELECT_URL_2, [
        shortenedUrl,
      ]);

      if (result.rowLength < 1) {
        return res.send(
          responses.errResponse(false, `${shortenedUrl} does not exist`)
        );
      }

      result = result.first();

      return res.send(
        responses.dataResponse({
          fromUrl: result.from_url,
          toUrl: result.to_url,
        })
      );
    } catch (e) {
      console.log(e);
    }
  });

  return router;
};
