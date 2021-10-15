const { RedisClient } = require('redis');
const { errResponse } = require('../util/responses');
const d = require('debug')('middleware:xratelim');

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

  // TODO The X-Rate-Lim header may be utilized

  const router = require('express').Router();
  const settings = require('../main').settings;

  const rateLimit = process.env.RATE_LIMIT || settings.rate_limit;
  const rateLimitResetTime =
    process.env.RATE_LIMIT_RESET_TIME || settings.rate_limit_expire_time;
  const redisConnectionStatus = require('../main').redisConnectionStatus;

  d('Initialized middleware');

  router.get('/api/v1/*', function (req, res, next) {
    // Rate lim is disabled
    if (redisConnectionStatus() === 0) {
      d('Rate limiter bypassed');
      return next();
    }

    const currentIpKey = `xRateLim::${req.ip}`;

    redisClient.llen(currentIpKey, function (err, reply) {
      if (err) {
        d('Error in rate limiter. Rate limiter has been bypassed', e);
        if (req.log)
        req.log.error(err);
        else
          d(err);
        return next();
      } else if (reply != null && reply > rateLimit) {
        d(
          `Rate limit reached for this client ${res.statusCode} ${req.ip} ${req.originalUrl}`
        );
        if (req.log)
          req.log.info(
            `Rate limit reached for this client ${res.statusCode} ${req.ip} ${req.originalUrl}`
          );
        return res.status(429).send(errResponse(true, 'Too many requests'));
      } else {
        redisClient.exists(currentIpKey, function (err, exists) {
          if (err) {
            if (req.log)
              req.log.error(err);
            else
              d(err);
          } else if (!exists) {
            redisClient
              .multi([
                ['rpush', currentIpKey, currentIpKey],
                ['expire', currentIpKey, rateLimitResetTime],
              ])
              .exec(function (e, reply) {
                if (e) {
                  d('Error in rate limiter. Rate limiter has been bypassed', e);
                  if(req.log) req.log.error(e);
                  else d(e);
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
