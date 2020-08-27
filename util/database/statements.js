/**
 * Insert a mapped url
 */
module.exports.INSERT_URL = "INSERT INTO url_mapping (from_url, to_url, created_on, original_creator_ip) VALUES (?, ?, ?, ?)";

/**
 * Retrieve a mapped url
 */
module.exports.SELECT_URL = "SELECT from_url, to_url FROM url_mapping WHERE from_url = ?";
