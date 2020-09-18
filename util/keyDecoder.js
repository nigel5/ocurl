const { Client } = require('cassandra-driver');
const statements = require('./database/statements');
const getUrlFromKey = require('./generation').getUrlFromKey;
const settings = require('../main').settings;

/**
 * @typedef {Object} Result A url mapping result
 * @property {toUrl} string  Destination url
 * @property {fromUrl} string Short url
 */

/**
 * Retrieve information about a key
 * @param {Client} cassandraClient Client to execute commands on
 * @param {string} key The key to decode
 *
 * @returns {Result} result
 */
module.exports = async function (cassandraClient, key) {
  const settings = require('../main').settings;

  let result = await cassandraClient.execute(
    statements.SELECT_URL_MAPPING_FROM_KEY,
    [key]
  );

  if (result.rowLength < 1) {
    return false;
  }

  result = result.first();

  return {
    fromUrl: getUrlFromKey(result.from_key),
    toUrl: result.to_url,
  };
};
