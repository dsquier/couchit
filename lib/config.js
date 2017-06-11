module.exports = {
  dbEndpoint: process.env.COUCHDB_ENDPOINT || 'localhost:5984',
  dbName: process.env.COUCHDB_DATABASE || 'db',
  dbUser: process.env.COUCHDB_USERNAME || 'couchdb',
  dbPass: process.env.COUCHDB_PASSWORD || 'couchdb',
  interval: process.env.OPTS_INTERVAL || 100,
  startKey: process.env.OPTS_START_KEY || null,
  endKey: process.env.OPTS_END_KEY || null,
  pageSize: process.env.OPTS_PAGE_SIZE || 1000,
  numPages: process.env.OPTS_NUM_PAGES || undefined,
  batchSize: process.env.OPTS_BATCH_SIZE || 1000,
  quiet: process.env.OPTS_QUIET || false,
  tasks: process.env.OPTS_TASKS || {
    "count-docs": (util, doc) => util.count('total_docs'),
    // "audit-bad-docs": (util, doc) => {
    //   if (doc.status && doc.status === 'bad') {
    //     const object = { bad_doc_id: doc._id, status: doc.status }
    //     util.audit(object);
    //   }
    // },
    // "hash-doc-contents": (util, doc) => {
    //   const hash = util.hash(doc);
    //   util.log('SHA256 hash of doc: ' + hash);
    // },
    // "validate-schema": (util, doc) => {
    //   const schema = require('./test/schema.json');
    //   const data = require('./test/data.json');
    //   const valid = util.validate(schema, data);
    //   util.log(doc._id + ' is valid? ' + valid);
    // },
    // "dependent-updates": (util, doc) => {
    //   if (doc.childKeys) {
    //     const keys = doc.childKeys;

    //     // Do a bulk get for all childKeys
    //     util.nano.fetch(keys, (err, result) => {
    //       if (err) {
    //         console.log(err);
    //       } else {
    //         const newChildKeys = [];
    //         const rows = result.rows;
    //         const hasMissingChildKeys = false;

    //         // Only add docs to the newChildKeys that were found in the db
    //         rows.forEach(row => {
    //           if (row.doc) {
    //             newChildKeys.push(row.id);
    //           } else {
    //             hasOrphans = true;
    //             util.log('Missing child doc: ' + row.id);
    //           }
    //         });

    //         if (hasMissingChildKeys) {
    //           doc.childKeys = newChildKeys;
    //           util.nano.insert(doc, (err, result) => {
    //             console.log(result);
    //           });
    //         }
    //       }
    //     });
    //   }
    // }

  }
};
