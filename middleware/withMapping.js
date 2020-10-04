const { Pool } = require('pg');
const { RedisClient } = require('redis');
const d = require('debug')('middleware:mapping');

/**
 * Inject from_url and to_url to headers
 * @param {Pool} pgPool Client to execute commands on
 * @param {RedisClient} redisClient Client to execute cache commands on
 *
 * Settings
 *  BASE_URL
 *  CACHE_EXPIRE_TIME
 */
module.exports.withMapping = function (pgPool, redisClient) {
  const router = require('express').Router();
  const statements = require('../util/database/statements2');
  const settings = require('../main').settings;
  const getUrlFromKey = require('../util/generation').getUrlFromKey;

  const baseUrl = process.env.BASE_URL || settings.base_url;
  const cacheExpireTime =
    process.env.CACHE_EXPIRE_TIME || settings.cache_expire_time;

  d('Initialized middleware');

  /**
   * Return the key if it already exists for this destination. Throws error if database connection is down.
   * @param {string} fromUrl The short url
   */
  async function getExistingMappingKey(toUrl) {
    let result = await pgPool.query(
      statements.SELECT_URL_MAPPING_FROM_DEST_URL,
      [toUrl]
    );

    if (result.rows.length < 1) {
      return false;
    }

    result = result.rows[0];
    return result.from_key;
  }

  router.get('/api/v1/url', async function (req, res, next) {
    // Cached
    if (req.existingMapping) {
      // TODO Not implemented
      return next();
    }

    // TODO if not cached then add to ache
    const originalUrl = req.query.q;

    if (originalUrl) {
      try {
        var a = await getExistingMappingKey(originalUrl);
      } catch (e) {
        d('Error in /api/v1/url', e);

        return res.status(503).send('503 Service Unavailable'); // Don't invoke next middleware to stop creation of new urls if the database is down.
      }

      if (a) {
        req.existingMapping = {
          fromUrl: getUrlFromKey(a),
          toUrl: originalUrl,
        };
      } else {
        req.existingMapping = false;
      }
    }

    next();
  });

  router.get('/:key', async function (req, res, next) {
    const letters = req.params.key;

    // Cached
    if (req.existingMapping) {
      return next();
    }

    try {
      let result = await pgPool.query(statements.SELECT_URL_MAPPING_FROM_KEY, [
        letters,
      ]);

      if (result.rows.length < 1) {
        req.existingMapping = false;
        return next();
      }

      result = result.rows[0];

      req.existingMapping = {
        fromUrl: result.from_url,
        toUrl: result.to_url,
      };

      // Add to cache / extend time
      try {
        redisClient.set(letters, result.to_url, 'EX', cacheExpireTime);
      } catch (e) {
        d('Cache is offline');
        d(e);
      }
    } catch (e) {
      d('Error in withMapping, /*', e);
      req.existingMapping = false;
      return next();
    }

    next();
  });

  return router;
};
