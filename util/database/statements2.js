/**
 * Postgresql statements
 */

/**
 * Initialize URL mapping table
 */
module.exports.INIT_URL_MAPPING =
  'CREATE TABLE IF NOT EXISTS url_mapping (from_key VARCHAR PRIMARY KEY, to_url VARCHAR NOT NULL, original_creator_ip VARCHAR NOT NULL, created_on TIMESTAMP DEFAULT NOW() NOT NULL)';

/**
 * Insert a mapped url
 */
module.exports.INSERT_URL_MAPPING =
  'INSERT INTO url_mapping (from_key, to_url, original_creator_ip, created_on) VALUES($1, $2, $3, $4) RETURNING *';

/**
 * Retrieve a mapped url via to_url
 */
module.exports.SELECT_URL_MAPPING_FROM_DEST_URL =
  'SELECT from_key, to_url FROM url_mapping WHERE to_url = $1';

/**
 * Retrieve a mapped url via from_key
 */
module.exports.SELECT_URL_MAPPING_FROM_KEY =
  'SELECT from_key, to_url FROM url_mapping WHERE from_key = $1';

/**
 * Check the health of the database
 */
module.exports.HEALTH_CHECK = 'SELECT NOW()';
