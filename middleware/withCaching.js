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

  router.get('/:key', async function (req, res, next) {
    // Attempt to retrieve value from cache
    // Refresh the expiry time if the key is found

    if (!redisClient || redisStatus() === 0) {
      d('Cache is offline');
      return next();
    }

    redisClient.get(req.params.key, function (err, reply) {
      if (reply === null || err) {
        d('Cache is offline');
        req.existingMapping = false;
      } else {
        const fromUrl = `${settings.base_url}/${req.params.key}`;

        d('Using cached mapping', fromUrl, '->', reply);
        req.existingMapping = {
          fromUrl,
          toUrl: reply,
        };

        redisClient.expire(req.params.key, cacheExpireTime);
      }
      next();
    });
  });

  return router;
};
