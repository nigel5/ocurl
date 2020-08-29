const { RedisClient } = require('redis');
const { errResponse } = require('../util/responses');

/**
 * API Rate Limiter
 *
 * @param {RedisClient} redisClient Client to execute cache commands on
 *
 * Settings
 *  RATE_LIMIT
 *  RATE_LIMIT_RESET_TIME
 */
module.exports = function (redisClient) {
  if (!redisClient) {
    throw 'Rate Limiter failed to initialize. No Redis client available';
  }

  const router = require('express').Router();
  const settings = require('../main').settings;

  const rateLimit = process.env.RATE_LIMIT || settings.rate_limit;
  const rateLimitResetTime =
    process.env.RATE_LIMIT_RESET_TIME || settings.rate_limit_expire_time;

  router.get('/api/v1/*', function (req, res, next) {
    const currentIpKey = `xRateLim::${req.ip}`;

    redisClient.llen(currentIpKey, function (err, reply) {
      if (err) {
        console.error('Error in rate limiter. Rate limiter is bypassed.', e);
        return next();
      } else if (reply != null && reply > rateLimit) {
        console.log('Rate limit reached for', req.ip, rateLimitResetTime);
        return res.status(429).send(errResponse(true, 'Too many requests'));
      } else {
        redisClient.exists(currentIpKey, function (err, exists) {
          if (!exists) {
            redisClient
              .multi([
                ['rpush', currentIpKey, currentIpKey],
                ['expire', currentIpKey, rateLimitResetTime],
              ])
              .exec(function (err, reply) {
                if (!err) {
                  console.error('Error in rate limiter.', err);
                }
              });
          } else {
            redisClient.rpushx(currentIpKey, currentIpKey);
          }
        });
      }

      next();
    });
  });

  return router;
};
