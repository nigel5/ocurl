const { Client } = require('cassandra-driver');
const { RedisClient } = require('redis');

/**
 * Inject from_url and to_url to headers
 * @param {Client} cassandraClient Client to execute commands on
 * @param {RedisClient} redisClient Client to execute cache commands on
 *
 * Settings
 *  BASE_URL
 *  CACHE_EXPIRE_TIME
 */
module.exports.withMapping = function (cassandraClient, redisClient) {
  const router = require('express').Router();
  const statements = require('../util/database/statements');
  const settings = require('../main').settings;

  const baseUrl = process.env.BASE_URL || settings.base_url;
  const cacheExpireTime =
    process.env.CACHE_EXPIRE_TIME || settings.cache_expire_time;

  /**
   * Return the key if it already exists for this destination
   * @param {string} fromUrl The short url
   */
  async function getExistingMappingKey(toUrl) {
    try {
      let result = await cassandraClient.execute(
        statements.SELECT_URL_MAPPING_FROM_DEST_URL,
        [toUrl]
      );

      if (result.rowLength < 1) {
        return false;
      }

      result = result.first();
      return result.from_key;
    } catch (e) {
      console.log('Error in getExistingShortUrl', e);
      return false;
    }
  }

  router.get('/api/v1/url', async function (req, res, next) {
    // Cached
    if (req.existingMapping) {
      return next();
    }

    // TODO if not cached then add to ache
    const originalUrl = req.query.q;

    if (originalUrl) {
      const a = await getExistingMappingKey(originalUrl);

      if (a) {
        req.existingMapping = {
          fromUrl: `${baseUrl}/${a}`,
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
      let result = await cassandraClient.execute(
        statements.SELECT_URL_MAPPING_FROM_KEY,
        [letters]
      );

      if (result.rowLength < 1) {
        req.existingMapping = false;
        return next();
      }

      result = result.first();

      req.existingMapping = {
        fromUrl: result.from_url,
        toUrl: result.to_url,
      };

      // Add to cache / extend time
      try {
        redisClient.set(letters, result.to_url, 'EX', cacheExpireTime);
      } catch (e) {
        console.warn('Cache is offline');
        console.error(e);
      }
    } catch (e) {
      console.log('Error in withMapping, /*', e);
      req.existingMapping = false;
      return next();
    }

    next();
  });

  return router;
};
