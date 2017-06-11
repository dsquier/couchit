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
    "validate-schema": (util, doc) => {
      const schema = require('./schema.json');
      const data = require('./data.json');
      const valid = util.validate(schema, data);
      util.log(doc._id + ' is valid? ' + valid);
    }
  }
};
