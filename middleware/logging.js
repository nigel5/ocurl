/**
 * Logs all requests
 */
module.exports = function (req, res, next) {
  console.log(`${req.method} ${req.originalUrl} ${req.ip}`);
  return next();
}
