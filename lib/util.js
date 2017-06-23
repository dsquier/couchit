const hasher = require('node-object-hash')({ coerce: false }).hash;
const Ajv = require('ajv');
const $RefParser = require('json-schema-ref-parser');

/**
 * Util is exposed to couchit.js task functions.
 */
function Util(stat, queue, nano, config) {
  this.stat = stat || {};
  this.queue = queue || [];
  this.nano = nano;
  this.config = config;
  this.auditItems = [];
  this.hasher = hasher;

  /**
   * User-defined "wait" counter to allow for additional interator flow control
   *
   * A wait represents a single outstanding asyncronous process. Waits can be
   * used by the developer inside the config.tasks file where desired to ensure
   * longer-running processes such as Util.validate() are able to complete.
   */
  this.waits = 0;
}

/**
 * Returns true if there are waits
 */
Util.prototype.doWaitsExist = function() {
  return this.waits > 0;
}

/**
 * Increment wait counter (use at the start of a process/function call)
 */
Util.prototype.incrementWaits = function() {
  this.waits += 1;
}

/**
 * Decrement wait counter (use at the process/function completion)
 */
Util.prototype.decrementWaits = function() {
  this.waits -= 1;
}

/**
 * Exposes nano document functions: https://github.com/dscape/nano#document-functions
 */
Util.prototype.nano = function() {
  return this.nano;
}

/**
 * Add an object to the audit array. Any non-object will be
 * converted as a value under the generic audit property
 *
 * @param {Object|String} doc: object to calculate hash for
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
 * Wrapper for console.log() which prevents output if config.quiet === true
 *
 * @param {String} message: the message to log
 */
Util.prototype.log = function(message) {
  if (!this.config.quiet) {
    console.log(message);
  }
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
  this.log('| Retrieving page (' + this.config.pageSize + ' docs)');
  return this.queue;
};

/**
 * Empty the queue.
 */
Util.prototype.resetQueue = function() {
  this.queue = [];
};

/**
 * Validate based on json-schema
 *
 * Returns a promise.
 */
Util.prototype.validate = function(schema, data) {
  this.count('__validate');
  const ajv = new Ajv({ allErrors: true }); // options can be passed, e.g. {allErrors: true}
  const valid = ajv.validate(schema, data);

  if (valid) {
    return Promise.resolve();
  }

  // If the schema does not validate, return a promise rejection with the reason
  return Promise.reject(ajv.errorsText());
}

/**
 * De-reference a json-schema reference file.
 *
 * Typically used with util.validate() to reference other json-schema
 * files to allow re-use and avoid duplicating common schemas.
 */
Util.prototype.dereference = function(file) {
  this.count('__dereference');
  return $RefParser.dereference(file);
}

/**
 * Generate a report from the stat object
 */
Util.prototype.createReport = function(stat) {
  const elapsed = Math.trunc(stat.__elapsed / 1000) || 0;
  const docsPerSecond = Math.trunc(stat.__docs / elapsed) || 0;
  const savePerSecond = Math.trunc(stat.__save / elapsed) || 0;
  let report = '' +
    '----------------------------------------\n' +
    '| Couchit Summary\n' +
    '----------------------------------------\n' +
    'Docs retrieved        : ' + stat.__docs + '\n' +
    'Docs saved            : ' + stat.__save + '\n' +
    'Docs removed          : ' + stat.__remove + '\n' +
    'Pages retrieved       : ' + stat.__pages + '\n' +
    'Hashes computed       : ' + stat.__hash + '\n' +
    'Schemas validated     : ' + stat.__validate + '\n' +
    'Schemas dereferenced  : ' + stat.__dereference + '\n' +
    'Objects audited       : ' + stat.__audit + '\n' +
    'docs-per-sec          : ' + docsPerSecond + '\n' +
    'save-per-sec          : ' + savePerSecond + '\n' +
    'elapsed-sec           : ' + elapsed + '\n';

  Object.keys(stat).forEach(prop => {
    if (!prop.match(/^__.+/)) {
      report += '\ncount - ' + prop + ': ' + stat[prop];
    }
  });

  report = '\n' + report;
  return report;
};

module.exports = Util;
