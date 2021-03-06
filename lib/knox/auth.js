
/*!
 * knox - auth
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var crypto = require('crypto');

/**
 * Return an "Authorization" header value with the given `options`
 * in the form of "AWS <key>:<signature>"
 *
 * @param {Object} options
 * @return {String}
 * @api private
 */

exports.authorization = function(options){
  return 'AWS ' + options.key + ':' + exports.sign(options);
};

/**
 * Create a base64 sha1 HMAC for `options`. 
 *
 * @param {Object} options
 * @return {String}
 * @api private
 */

exports.sign = function(options){
  var str = exports.stringToSign(options);
  return crypto.createHmac('sha1', options.secret).update(str).digest('base64');
};

/**
 * Return a string for sign() with the given `options`.
 *
 * Spec:
 * 
 *    <verb>\n
 *    <md5>\n
 *    <content-type>\n
 *    <date>\n
 *    [headers\n]
 *    <resource>
 *
 * @param {Object} options
 * @return {String}
 * @api private
 */

exports.stringToSign = function(options){
  var headers = options.amazonHeaders || '';
  if (headers) headers += '\n';
  return [
      options.verb
    , options.md5
    , options.contentType
    , options.date instanceof Date ? options.date.toUTCString() : options.date
    , headers + options.resource
  ].join('\n');
};

/**
 * Perform the following:
 *
 *  - ignore non-amazon headers
 *  - lowercase fields
 *  - sort lexicographically
 *  - trim whitespace between ":"
 *  - join with newline
 *
 * @param {Object} headers
 * @return {String}
 * @api private
 */

exports.canonicalizeHeaders = function(headers){
  var buf = []
    , fields = Array.isArray(headers) ? headers : Object.keys(headers)
    , uniqueHeaders = {};
  for (var i = 0, len = fields.length; i < len; ++i) {
    var field = Array.isArray(fields[i]) ? fields[i][0] : fields[i]
      , val = Array.isArray(fields[i]) ? fields[i][1] : headers[field]
      , field = field.toLowerCase();
    if (0 !== field.indexOf('x-amz')) continue;
    if (field in uniqueHeaders) {
      buf[uniqueHeaders[field]] += ','+val;
    }
    else {
      uniqueHeaders[field] = buf.length;
      buf.push(field + ':' + val);
    }
  }
  return buf.sort().join('\n');
};