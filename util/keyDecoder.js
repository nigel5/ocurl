const { Pool } = require('pg');
const statements = require('./database/statements2');
const getUrlFromKey = require('./generation').getUrlFromKey;
const settings = require('../main').settings;

/**
 * @typedef {Object} Result A url mapping result
 * @property {toUrl} string  Destination url
 * @property {fromUrl} string Short url
 */

/**
 * Retrieve information about a key
 * @param {Pool} pgPool Client to execute commands on
 * @param {string} key The key to decode
 *
 * @returns {Result} result
 */
module.exports = async function (pgPool, key) {
  const settings = require('../main').settings;

  let result = await pgPool.query(statements.SELECT_URL_MAPPING_FROM_KEY, [
    key,
  ]);

  if (result.rows.length < 1) {
    return false;
  }

  result = result.rows[0];

  return {
    fromUrl: getUrlFromKey(result.from_key),
    toUrl: result.to_url,
  };
};
