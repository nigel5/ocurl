const { RedisClient } = require('redis');
const redis = require('redis');

/**
 * Redis cache layer
 * @param {RedisClient} redisClient The Redis client instance to execute commands on
 */
module.exports = function (redisClient) {
  const router = require('express').Router();
  const settings = require('../main').settings;

  router.get('/:key', async function (req, res, next) {
    // Attempt to retrieve value from cache
    // Refresh the expiry time if the key is found

    if (!redisClient) {
      console.warn('Cache is offline');
      return next();
    }

    redisClient.get(req.params.key, function (err, reply) {
      if (reply === null || err) {
        console.warn('Cache is offline');
        req.existingMapping = false;
      } else {
        req.existingMapping = {
          fromUrl: `${settings.base_url}/${req.params.key}`,
          toUrl: reply,
        };

        redisClient.expire(req.params.key, settings.redis.expireTime);
      }
      next();
    });
  });

  return router;
};
