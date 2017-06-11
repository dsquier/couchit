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
    "hash-doc-contents": (util, doc) => {
      const hash = util.hash(doc);
      util.log('SHA256 hash of doc: ' + hash);
    }
  }
};
