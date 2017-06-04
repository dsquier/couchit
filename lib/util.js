const hasher = require('node-object-hash')({ coerce: false }).hash;

/**
 * Util is exposed to couchit.js task functions.
 */
function Util(stat, queue, driver, config) {
  this.stat = stat || {};
  this.queue = queue || [];
  this.driver = driver;
  this.config = config;
  this.auditItems = [];
  this.hasher = hasher;
}

/**
 * Add an object to the audit array. Any non-object will be
 * converted as a value under the generic audit property
 */
Util.prototype.audit = function(doc) {
  this.count('__audit');
  if (typeof doc !== 'object') {
    this.auditItems.push({ audit: doc });
  } else {
    this.auditItems.push(doc);
  }
};

/**
 * Calculate hash using: https://github.com/SkeLLLa/node-object-hash
 *
 * @param {Object} doc: object to calculate hash for
 */
Util.prototype.hash = function(doc) {
  this.count('__hash');
  return this.hasher(doc);
};

/**
 * Increment stat count for existing key.
 * For new key, stat count will be set to increment value.
 *
 * @param {String} key: stat key
 * @param {Number} increment: increment value
 */
Util.prototype.increment = function(key, increment) {
  if (this.stat[key]) {
    this.stat[key] += increment;
  } else {
    this.stat[key] = increment;
  }
};

/**
 * Increment stat count by 1.
 *
 * @param {String} key: stat key
 */
Util.prototype.count = function(key) {
  this.increment(key, 1);
};

/**
 * Queue document for saving, increment save counter.
 *
 * @param {Object} doc: CouchDB document
 */
Util.prototype.save = function(doc) {
  this.count('__save');
  this.queue.push(doc);
};

/**
 * Mark and queue document for deletion, increment delete counter.
 *
 * @param {Object} doc: CouchDB document
 */
Util.prototype.remove = function(doc) {
  this.count('__remove');
  doc._deleted = true;
  this.queue.push(doc);
};

/**
 * Log message.
 *
 * @param {String} message: the message to log
 */
Util.prototype.log = function(message) {
  console.log(message);
};

/**
 * Get stat object containing counts.
 *
 * @return stat object
 */
Util.prototype.getStat = function() {
  return this.stat;
};

/**
 * Get stat object containing counts.
 *
 * @return stat object
 */
Util.prototype.getAudit = function() {
  return this.auditItems;
};

/**
 * Get queue containing docs to be updated.
 *
 * @return queue
 */
Util.prototype.getQueue = function() {
  console.log('Retrieving page (' + this.config.pageSize + ' docs)');
  return this.queue;
};

/**
 * Empty the queue.
 */
Util.prototype.resetQueue = function() {
  this.queue = [];
};

/**
 * Generate a report from the stat object
 */
Util.prototype.createReport = function(stat) {
  const elapsed = Math.trunc(stat.__elapsed / 1000);
  const docsPerSecond = Math.trunc(stat.__docs / elapsed);
  const savePerSecond = Math.trunc(stat.__save / elapsed);

  let report = '' +
    '----------------------------------------\n' +
    '| Summary\n' +
    '----------------------------------------\n' +
    'Docs retrieved  : ' + stat.__docs + '\n' +
    'Docs saved      : ' + stat.__save + '\n' +
    'Docs removed    : ' + stat.__remove + '\n' +
    'Pages retrieved : ' + stat.__pages + '\n' +
    'Hashes computed : ' + stat.__hash + '\n' +
    'Objects audited : ' + stat.__audit + '\n' +
    'docs-per-second : ' + docsPerSecond + '\n' +
    'save-per-second : ' + savePerSecond + '\n' +
    'Elapsed time    : ' + elapsed + 's\n';

  Object.keys(stat).forEach(function(prop) {
    if (!prop.match(/^__.+/)) {
      report += 'stat: ' + prop + ': ' + stat[prop] + '\n';
    }
  });

  return report;
};

module.exports = Util;
