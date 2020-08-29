const { RedisClient } = require('redis');
const d = require('debug')('middleware:cache');

/**
 * Redis cache layer
 * @param {RedisClient} redisClient The Redis client instance to execute commands on
 *
 * Settings
 *  CACHE_EXPIRE_TIME
 */
module.exports = function (redisClient) {
  const router = require('express').Router();
  const settings = require('../main').settings;
  const redisStatus = require('../main').redisConnectionStatus;

  const cacheExpireTime =
    process.env.CACHE_EXPIRE_TIME || settings.cache_expire_time;

  d('Initialized middleware');

  /**
   * Retrieve and refresh a key in the cache
   * @param {string} key The key
   */
  async function retrieveCachedKey(key) {
    // Attempt to retrieve value from cache
    // Refresh the expiry time if the key is found
    return new Promise((resolve) => {
      if (!redisClient || redisStatus() === 0) {
        d('Cache is offline');
        resolve(false);
      }

      redisClient.get(key, function (err, reply) {
        if (err) {
          d('Cache is offline', err);
          resolve(false);
        } else if (reply === null) {
          resolve(false);
        } else {
          const fromUrl = `${settings.base_url}/${key}`;

          redisClient.expire(key, cacheExpireTime);
          resolve({
            fromUrl,
            toUrl: reply,
          });
        }
      });
    });
  }

  /**
   * API: Decode URL already in cache
   */
  router.get('/api/v1/decode', async function (req, res, next) {
    if (!req.query.q) return next();

    const cachedResult = await retrieveCachedKey(req.query.q);

    if (cachedResult) {
      d('Using cached mapping', cachedResult.fromUrl, '->', cachedResult.toUrl);
      req.existingMapping = cachedResult;
    }

    next();
  });

  /**
   * Redirects
   */
  router.get('/:key', async function (req, res, next) {
    if (!req.params.key) return next();

    const cachedResult = await retrieveCachedKey(req.params.key);

    if (cachedResult) {
      d('Using cached mapping', cachedResult.fromUrl, '->', cachedResult.toUrl);
      req.existingMapping = cachedResult;
    }

    next();
  });

  return router;
};
