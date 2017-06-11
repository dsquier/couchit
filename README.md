Couchit
=======

Couchit is a database iterator with tools to validate and manage documents in a CouchDB database.

Couchit runs a set of user-defined JavaScript functions against all documents in a CouchDB database or view, or only some of them by specifying a start and/or an end key(s). Couchit comes with a built-in set of Utility Functions to perform helpful operations such as generating hashes, performing json-schema validation, and storing objects from iteration for post-processing.

Installation
------------

### Command Line Interface (CLI)

Couchit can run as a stand-alone application. Install it via npm:

    npm install -g couchit

Then, to run:

    couchit ./config.js

### As a module

Couchit can also run as a module in another program. First, add it to your projects `package.json`

    npm install --save couchit

Then, include it in your program:

    const Couchit = require('couchit');
    const config = require('./config.js');
    new Couchit().iterate(config, console.log);

Configuration
-------------

Couchit can be controlled by environment variables or a [config file](./lib/config.js).

The preferred way is through environment variables. This allows Couchit to run without storing sensititve information in code. It will be useful when setting Couchit to run as an AWS Lambda, for example.

### Configuration Settings

The following list all configuration settings. If no environment variables are set, the Default Value will be used.

| Setting          | Description | Default Value  |
| ---------------- |-------------| ---------------- |
| COUCHDB_ENDPOINT | URI and port of CouchDB server, (does not include http://) | 'localhost:5984' |
| COUCHDB_DATABASE | CouchDB database | 'master' |
| COUCHDB_USERNAME | CouchDB user | 'couchdb' |
| COUCHDB_PASSWORD | CouchDB password | 'couchdb' |
| OPTS_INTERVAL    | Number of ms to wait between page requests | 100 |
| OPTS_START_KEY   | View start key | null |
| OPTS_END_KEY     | View end key | null |
| OPTS_PAGE_SIZE   | Number of documents to retrieve per batch | 1000 |
| OPTS_NUM_PAGES   | Number of pages to retrieve | undefined |
| OPTS_BATCH_SIZE  | Batch update size | 100 |
| OPTS_QUIET       | Suppress report at end of run | false |
| OPTS_TASKS       | JavaScript functions with tasks to run | { "count-docs": (util, doc) => { util.count('total-docs') } } |

You can use a combination of environment variables and `config.js` Default Values to run Couchit. Just remember that environment variables *always override defaults*.

#### Setting an environment variable in Windows Powershell

    $env:COUCHDB_PASSWORD="couchdb"

#### Setting an environment variable in macOS/Linux bash

    export COUCHDB_PASSWORD="couchdb"

Tasks
-----

Tasks are how you validate and manage documents as they are iterated over. There are a number of built-in Utility Functions that can be used by calling their `util` method, for example, to get a document hash: `util.hash(doc)`. Additional document functionality is provided via `util.nano`, which exposes nano [document functions](https://github.com/dscape/nano#document-functions). See the `dependent-updates` task below for an example of how nano document functions can be used.

Utility Functions
-----------------

On each document iteration, the following functions are available via the `Util()` object:

| Function   | Description   |
| ---------- | ------------- |
| `audit`    | Add an object to the audit array, which is returned in the callback |
| `count`    | Increment a counter associated with a particular key |
| `log`      | Alias for console.log |
| `hash`     | Generate a SHA256 hash for a given document, object, or string |
| `nano`     | Exposes nano [document functions](https://github.com/dscape/nano#document-functions)
| `remove`   | Delete the document from the database |
| `save`     | Save the document back to the database |
| `validate` | Validate a document using [json-schema](http://json-schema.org/)

Example Tasks
-------------

You can define any number of named tasks to run, which will be run once per document. The following are examples of common tasks that may be useful to adopt for your needs.

### Count all documents:

This is a trivial example where a counter (`total-docs`) is incremented for each document retrieved.

```
{
    "count-docs": (util, doc) => util.count('total-docs'),
}
```

### Audit data for later user:

By using util.audit(), you can store any object for use after processing has completed. This is useful for initiating a post-processing step that is based on the output of Couchit run.

```
{
    "audit-bad-docs": (util, doc) => {
        if (doc.status && doc.status === 'bad') {
            const object = { bad_doc_id: doc._id, status: doc.status }
            util.audit(object);
        }
    }
}
```

### Calculate the hash of part of a document:

By using util.audit(), you can store any object for use after processing has completed. This is useful for initiating a post-processing step that is based on the output of Couchit run.

```
{
    "hash-doc-contents": (util, doc) => {
        const hash = util.hash(doc);
        util.log('SHA256 hash of doc: ' + hash);
    }
}
```

### Validate a schema:

Determine if a document is valid based on a json-schema specification. This task uses ajv for validation.

```
{
    "validate-schema": (util, doc) => {
        const schema = require('./test/schema.json');
        const data = require('./test/data.json');
        const valid = util.validate(schema, data);
        util.log(doc._id + ' is valid? ' + valid);
    }
}
```

### Update a parent document by checking for existence of child docs:

Note that nano functions are not queued and therefore may run after Couchit finishes iterating.

```
{
    "dependent-updates": (util, doc) => {
      if (doc.childKeys) {
        const keys = doc.childKeys;

        // Do a bulk get for all childKeys
        util.nano.fetch(keys, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            const newChildKeys = [];
            const rows = result.rows;
            const hasMissingChildKeys = false;

            // Only add docs to the newChildKeys that were found in the db
            rows.forEach(row => {
              if (row.doc) {
                newChildKeys.push(row.id);
              } else {
                hasOrphans = true;
                util.log('Missing child doc: ' + row.id);
              }
            });

            if (hasMissingChildKeys) {
              doc.childKeys = newChildKeys;
              util.nano.insert(doc, (err, result) => {
                console.log(result);
              });
            }
          }
        });
      }
    }
}
```

Credits
-------

- Couchit is based on Couchtato; thanks to Cliffano Subagio for his work.
