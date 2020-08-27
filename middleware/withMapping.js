const { Client } = require('cassandra-driver');

/**
 * Inject from_url and to_url to headers
 * @param {Client} cassandraClient Client to execute commands on
 */
module.exports.withMapping = function (cassandraClient) {
  const router = require('express').Router();
  const statements = require('../util/database/statements');

  /**
   * Return the short url if it already exists for this destination
   * @param {string} fromUrl The short url
   */
  async function getExistingShortUrl(toUrl) {
    try {
      let result = await cassandraClient.execute(statements.SELECT_URL_1, [
        toUrl,
      ]);

      if (result.rowLength < 1) {
        return false;
      }

      result = result.first();
      return result.from_url;
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
      const a = await getExistingShortUrl(originalUrl);

      if (a) {
        req.existingMapping = {
          fromUrl: a,
          toUrl: originalUrl,
        };
      } else {
        req.existingMapping = false;
      }
    }

    next();
  });

  return router;
};
