/**
 * Insert a mapped url
 */
module.exports.INSERT_URL =
  'INSERT INTO url_mapping (from_url, to_url, created_on, original_creator_ip) VALUES (?, ?, ?, ?)';

/**
 * Retrieve a mapped url via to_url
 */
module.exports.SELECT_URL_1 =
  'SELECT from_url, to_url FROM url_mapping WHERE to_url = ?';

/**
 * Retrieve a mapped url via from_url
 */
module.exports.SELECT_URL_2 =
  'SELECT from_url, to_url FROM url_mapping WHERE from_url = ?';
