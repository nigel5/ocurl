const { Client } = require('cassandra-driver');

/**
 * Public API for One Click Shorten
 * @param {Client} cassandraClient Client to execute commands on
 */
module.exports = function (cassandraClient, redisClient) {
  const router = require('express').Router();
  const LocalDate = require('cassandra-driver').types.LocalDate;

  const responses = require('../util/responses');
  const rollStr = require('../util/generation').rollStr;
  const settings = require('../main').settings;
  const statements = require('../util/database/statements');
  const shortUrlDecoder = require('../util/keyDecoder');

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
    // Dont generate new link if already exists
    if (req.existingMapping) {
      return res.send(
        responses.dataResponse({
          url: req.existingMapping.fromUrl,
        })
      );
    }

    // Generate letters
    const letters = rollStr(numberOfCharacters);

    const originalUrl = req.query.q;

    if (!originalUrl) {
      return res
        .status(400)
        .send(responses.errResponse(true, 'You must provide a url to shorten'));
    }

    const shortUrl = `${baseURL}/${letters}`;
    const requesterIp = req.ip;

    res.send(
      responses.dataResponse({
        url: shortUrl,
      })
    );

    // Save url in cache
    try {
      redisClient.set(letters, originalUrl, 'EX', settings.redis.expireTime);
    } catch (e) {
      console.warn('Cache is offline');
      console.error(e);
    }

    // Save in perm database for long term
    cassandraClient.execute(statements.INSERT_URL_MAPPING, [
      letters,
      originalUrl,
      LocalDate.now(),
      requesterIp,
    ]);
  });

  /**
   * Decodes a short url
   *
   * Query parameters
   * q string The shortened url or key
   */
  router.get('/api/v1/decode', async function (req, res, next) {
    let q = req.query.q;

    if (!q) {
      return res
        .status(400)
        .send(
          responses.errResponse(
            true,
            'You must provide a shortened url to decode'
          )
        );
    }

    q = q.split('/').pop();

    if (req.existingMapping) {
      return res.send(responses.dataResponse(req.existingMapping));
    }

    try {
      const result = await shortUrlDecoder(cassandraClient, q);

      if (!result) {
        return res
          .status(400)
          .send(responses.errResponse(true, 'The provided url does not exist'));
      } else {
        return res.send(responses.dataResponse(result));
      }
    } catch (e) {
      console.log("Error in router.get('/api/v1/decode...", e);
      return res.status(500).send(responses.internalErrResponse());
    }
  });

  /**
   * Health Check
   */
  router.all('/api/v1/health', function (req, res) {
    const cassandraState = cassandraClient.getState();
    /**
     * Cache
     */
    if (redisClient) {
      redisClient.set('healthCheckZZZ', '_', 'EX', '1', function (err, reply) {
        if (reply) {
          /**
           * Database
           */
          if (
            cassandraState._openConnections &&
            Object.keys(cassandraState._openConnections).length > 0
          ) {
            res.status(200).send('ok');
          }
        } else {
          return res.status(503).send('unavailable');
        }
      });
    } else {
      res.status(503).send('unavailable');
    }
  });

  return router;
};
