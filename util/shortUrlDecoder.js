const { Client } = require('cassandra-driver');
const statements = require('./database/statements');

/**
 * @typedef {Object} Result A url mapping result
 * @property {toUrl} string  Destination url
 * @property {fromUrl} string Short url
 */

/**
 * Retrieve information about a short url
 * @param {Client} cassandraClient Client to execute commands on
 * @param {string} shortenedUrl The short url to decode
 *
 * @returns {Result} result
 */
module.exports = async function (cassandraClient, shortenedUrl) {
  let result = await cassandraClient.execute(statements.SELECT_URL_2, [
    shortenedUrl,
  ]);

  if (result.rowLength < 1) {
    return false;
  }

  result = result.first();

  return {
    fromUrl: result.from_url,
    toUrl: result.to_url,
  };
};
