const { Pool } = require('pg');
const d = require('debug')('middleware:api');

/**
 * Public API for One Click Shorten
 * @param {Client} cassandraClient Client to execute commands on
 *
 * Settings:
 *  GENERATED_PATH_LENGTH
 *  MAX_PATH_LENGTH
 *  BASE_URL
 *  CACHE_EXPIRE_TIME
 */
module.exports = function (pgPool, redisClient) {
  const router = require('express').Router();

  const responses = require('../util/responses');
  const rollStr = require('../util/generation').rollStr;
  const settings = require('../main').settings;
  const statements = require('../util/database/statements2');
  const shortUrlDecoder = require('../util/keyDecoder');
  const getUrlFromKey = require('../util/generation').getUrlFromKey;

  const defaultPathLength =
    process.env.GENERATED_PATH_LENGTH || settings.generated_path_length;
  const maxPathLength = process.env.MAX_PATH_LENGTH || settings.max_path_length;
  const baseURL = process.env.BASE_URL || settings.base_url;
  const cacheExpireTime =
    process.env.CACHE_EXPIRE_TIME || settings.cache_expire_time;

  // Health
  const { redisConnectionStatus, pgConnectionStatus } = require('../main');

  const url = require('url');

  d('Initialized middleware');

  /**
   * Get a short url
   *
   * Query parameters
   * q string The original url
   */
  router.get('/api/v1/url', async function (req, res, next) {
    // Dont generate new link if already exists
    if (req.existingMapping) {
      return res.status(200).send(
        responses.dataResponse({
          url: req.existingMapping.fromUrl,
        })
      );
    }

    const originalUrl = req.query.q;
    const pathLength = req.query.length || defaultPathLength;

    // Test if valid url
    try {
      new URL(originalUrl);
    } catch (e) {
      return res
        .status(400)
        .send(
          responses.errResponse(
            true,
            `Provided URL is invalid. Do you have the protocol prepended?`
          )
        );
    }

    if (pathLength < 1 || pathLength > maxPathLength) {
      return res
        .status(400)
        .send(
          responses.errResponse(
            true,
            `Provided path length must be between ${1} and ${maxPathLength}`
          )
        );
    }

    // Generate letters
    const letters = rollStr(pathLength);

    if (!originalUrl) {
      return res
        .status(400)
        .send(responses.errResponse(true, 'You must provide a url to shorten'));
    }

    const shortUrl = getUrlFromKey(letters);
    const requesterIp = req.ip;

    res.send(
      responses.dataResponse({
        url: shortUrl,
      })
    );

    // Save url in cache
    try {
      redisClient.set(letters, originalUrl, 'EX', cacheExpireTime);
    } catch (e) {
      d('Cache is offline');
      d(e);
    }

    // Save in perm database for long term
    try {
      pgPool.query(statements.INSERT_URL_MAPPING, [
        letters,
        originalUrl,
        requesterIp,
        new Date(),
      ]);
    } catch (e) {
      d('Database is down...');
    }
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
      return res.status(200).send(responses.dataResponse(req.existingMapping));
    }

    try {
      const result = await shortUrlDecoder(pgPool, q);

      if (!result) {
        return res
          .status(400)
          .send(responses.errResponse(true, 'The provided url does not exist'));
      } else {
        return res.send(responses.dataResponse(result));
      }
    } catch (e) {
      d("Error in router.get('/api/v1/decode...", e);
      return res.status(500).send(responses.internalErrResponse());
    }
  });

  /**
   * Health Check
   */
  router.all('/api/v1/health', async function (req, res) {
    // The overall service is still up as long as database is online.
    if (pgConnectionStatus()) {
      res.status(200).send('OK');
    } else {
      res.status(503).send('503 Service Unavailable');
    }
    /**
     * Test Cache
     */
    // if (redisClient) {
    //   redisClient.set('healthCheckZZZ', '_', 'EX', '1', async function (
    //     err,
    //     reply
    //   ) {
    //     // Test key
    //     if (reply) {
    //       /**
    //        * Test Database
    //        */
    //       try {
    //         await pgPool.query(statements.HEALTH_CHECK);
    //         return res.status(200).send('OK');
    //       } catch (e) {
    //         return res.status(503).send('503 Service Unavailable');
    //       }
    //     } else {
    //       return res.status(503).send('unavailable');
    //     }
    //   });
    // } else {
    //   res.status(503).send('503 Service Unavailable');
    // }
  });

  return router;
};
