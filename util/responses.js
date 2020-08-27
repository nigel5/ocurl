/**
 * Create a successful response payload
 * @param {object} data The data to include in the response
 */
module.exports.dataResponse = function (data) {
  return {
    "data": data
  };
}

/**
 * Create a error resposne payload
 * @param {object} err The error object to include in the response
 * @param {*} message The error message to include in the response
 */
module.exports.errResponse = function (err, message) {
  return {
    "err": err,
    "message": message
  };
}
