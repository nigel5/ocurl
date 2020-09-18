const settings = require('../main').settings;

/**
 * Possible characters to use when generating a string
 */
const ALL_CHAR = 'a0b1c2d3e4f5g6h7i8j9klmnopqrstuvwxyz';

/**
 * Get a (pseudo)random integer
 * @param {number} min min
 * @param {number} max max
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random string of given length
 * @param {number} len Length of url to be returned
 */
function rollStr(len) {
  let res = '';
  const min = 0;
  const max = ALL_CHAR.length - 1;

  for (var i = 0; i < len; i++) {
    res += ALL_CHAR[getRandomInt(min, max)];
  }

  return res;
}

module.exports.rollStr = rollStr;

/**
 * Return a URL for this deployment from a key
 * @param {string} key The letters at the end of the url
 */
function getUrlFromKey(key) {
  return `${settings.default_protocol}://${settings.base_url}/${key}`;
}

module.exports.getUrlFromKey = getUrlFromKey;
