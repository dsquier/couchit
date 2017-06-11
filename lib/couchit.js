const Db = require('./db');
const Util = require('./util');

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
  const stat = { __docs: 0, __pages: 0, __save: 0, __remove: 0, __audit: 0, __hash: 0, __validate: 0 };
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
      console.log('Updating %d doc%s', queuedDocs.length, queuedDocs.length > 1 ? 's' : '');

      db.update(queuedDocs, function(err, result) {
        if (err) {
          console.error(err.message);
        } else {
          if (!config.quiet) {
            console.log('Bulk update %d doc%s done', result.length, result.length > 1 ? 's' : '');
          }
        }
      });
      util.resetQueue();
    }
  }

  function _endCb(err, result) {

    function _report(err, result) {
      const audit = util.getAudit();
      const stat = util.getStat();

      // Add elapsed time to stat object
      stat.__elapsed = new Date() - start;

      if (!config.quiet) {
        console.log(util.createReport(stat));
      }

      // return a callback response object containing the stat object and audit array
      cb(err, { stat, audit });
    }

    const queue = util.getQueue();

    if (queue.length > 0) {
      // update the remaining queued documents
      db.update(queue, function(err, result) {
        function _wait() {
          if (db.done()) {
            _report(err, result);
          } else {
            setImmediate(_wait);
          }
        }
        _wait();
      });
      // if queue is empty, then just report regardless there's an error or not
    } else {
      _report(err, result);
    }
  }

  db.paginate(config.interval, config.startKey, config.endKey, config.pageSize, config.numPages, _pageCb, _endCb);
};

module.exports = Couchit;
