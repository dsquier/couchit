const Db = require('./db');
const Util = require('./util');
const async = require('async');

/**
 * class Couchit
 */
function Couchit() {}

/**
 * Iterate documents in the database or view, and apply task functions to each document.
 */
Couchit.prototype.iterate = function(config, cb) {
  const tasks = config.tasks;
  const url = 'http://' + config.dbUser + ':' + config.dbPass + '@' + config.dbEndpoint + '/' + config.dbName;
  const stat = { __docs: 0, __pages: 0, __save: 0, __remove: 0, __audit: 0, __hash: 0, __validate: 0, __dereference: 0 };
  const start = new Date();
  const db = new Db(url);
  const util = new Util(stat, [], db.db, config);

  function _pageCb(rows) {
    const docsCount = (rows.length === config.pageSize + 1) ? config.pageSize : rows.length;
    util.increment('__docs', docsCount);
    util.increment('__pages', 1);

    // apply each task to each document
    Object.keys(tasks).forEach(function(task) {
      for (var i = 0; i < docsCount; i += 1) {
        tasks[task](util, rows[i].doc);
      }
    });

    // bulk update queued documents
    const queuedDocs = util.getQueue().slice(0); // a copy of the queue

    if (queuedDocs.length >= config.batchSize) {
      util.log('Updating %d doc%s', queuedDocs.length, queuedDocs.length > 1 ? 's' : '');

      db.update(queuedDocs, function(err, result) {
        if (err) {
          console.error(err.message);
        } else {
          util.log('Bulk update %d doc%s done', result.length, result.length > 1 ? 's' : '');
        }
      });
      util.resetQueue();
    }
  }

  function _endCb(err, result) {
    const queue = util.getQueue();

    // update the remaining queued documents
    if (queue.length > 0) {
      db.update(queue, function(err, result) {
        function _wait() {
          if (db.done()) {
            finalize(err, result);
          } else {
            setImmediate(_wait);
          }
        }
        _wait();
      });
      // if queue is empty, then just report regardless there's an error or not
    } else {
      finalize(err, result);
    }

    /**
     * To allow long-running asyncronous processes to complete before returning the
     * callback that reflects the results of all procerssing, ensure there are no
     * outstanding waits.
     */
    function finalize(err, result) {
      async.whilst(
        function() {
          return util.doWaitsExist();
        },
        function(callback) {
          setTimeout(callback, 100);
        },
        function(err, result) {
          const audit = util.getAudit();
          const stat = util.getStat();
          stat.__elapsed = new Date() - start;
          util.log(util.createReport(stat));

          // return a callback response object containing the stat object and audit array
          cb(err, { stat, audit });
        }
      );
    }

  }

  db.paginate(config.interval, config.startKey, config.endKey, config.pageSize, config.numPages, _pageCb, _endCb);
};

module.exports = Couchit;
