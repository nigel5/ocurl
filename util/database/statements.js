/**
 * Initialize URL mapping table
 */
module.exports.INIT_URL_MAPPING =
  'CREATE TABLE IF NOT EXISTS url_mapping (from_key varchar, to_url varchar, created_on date, original_creator_ip varchar, PRIMARY KEY (from_key))';

/**
 * Initialize keyspace
 */
module.exports.INIT_KEYSPACE =
  "CREATE KEYSPACE IF NOT EXISTS ocurl WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 2 }";

/**
 * Insert a mapped url
 */
module.exports.INSERT_URL_MAPPING =
  'INSERT INTO url_mapping (from_key, to_url, created_on, original_creator_ip) VALUES (?, ?, ?, ?)';

/**
 * Retrieve a mapped url via to_url
 */
module.exports.SELECT_URL_MAPPING_FROM_DEST_URL =
  'SELECT from_key, to_url FROM url_mapping WHERE to_url = ?';

/**
 * Retrieve a mapped url via from_key
 */
module.exports.SELECT_URL_MAPPING_FROM_KEY =
  'SELECT from_key, to_url FROM url_mapping WHERE from_key = ?';
