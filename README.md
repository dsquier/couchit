Couchit
=======

Couchit is a database iterator that includes a set of tools to help manage documents in a CouchDB database.

Couchit runs a set of user-defined JavaScript functions against all documents in a CouchDB database or view, or only some of them by specifying a start and/or an end key(s). Couchit comes with a built-in set of Utility Functions to perform helpful operations such as generating hashes to storing objects during iteration for use in post-processing, auditing, or monitoring.

Installation
------------

### Using via the Command Line Interface (CLI)

Couchit can run as a stand-alone application, just install via npm:

    npm install -g couchit

Then, set any configuration parameters (see Configuration below), and run Couchit:

    couchit

Optionally, you can specify your own `config.js` with specific settings:

    couchit -c ./config.js

### Using as a module

You can also include couchit as a module in another program. First, add couchit to your projects `package.json`

    npm install --save couchit

Then, include couchit in your program:

    // Include Couchit
    const Couchit = require('couchit');

    // Load configuration
    const config = require('./config.js');

    // Run Couchit
    new Couchit().iterate(config, console.log);

Configuration
-------------

Couchit is controlled entirely by the [config file](./lib/config.js). This includes the tasks written in JavaScript which are run against documents retrieved.

All configuration settings can be defined in two ways:

### 1) Via environment variables

The environment variable is the first place Couchit will look to determine what setting to use. This is a useful way to implement Couchit without having to store sensitive information such as the CouchDB username and password.

If no value is found, it will use the default listed below:

| Env Variable     | Default Setting  |
| ---------------- | ---------------- |
| COUCHDB_ENDPOINT | 'localhost:5984' |
| COUCHDB_DATABASE | 'master' |
| COUCHDB_USERNAME | 'couchdb' |
| COUCHDB_PASSWORD | 'couchdb' |
| OPTS_INTERVAL | 100 |
| OPTS_START_KEY | null |
| OPTS_END_KEY | null |
| OPTS_PAGE_SIZE | 5000 |
| OPTS_NUM_PAGES | undefined |
| OPTS_BATCH_SIZE | 5000 |
| OPTS_QUIET | false |
| OPTS_TASKS | { "count-docs": (util, doc) => { util.count('doc') } } |

#### Set in Windows

    $env:COUCHDB_USERNAME="couchdb"

#### Set in UNIX

    export COUCHDB_USERNAME="couchdb"

### 2) Via a custom config file

Additionally, you can specify your own config file when running Couchit from the command line.

    couchit -c config.js

The `config.js` file should be a relative path from whereever Couchit is being executed from.

Utility Functions
-----------------

On each document iteration, the following functions are available via the `Util()` object:

| Function | Description   |
| -------- | ------------- |
| audit    | Add an object to the audit array, which is returned in the # callback |
| count    | Increment a counter associated with a particular key |
| log      | Alias for console.log |
| hash     | Get a SHA256 hash for a given document, object, or string |
| remove   | Delete the document from the database |
| save     | Save the document back to the database |

Credits
-------

- Couchit is based on Couchtato; thanks to Cliffano Subagio for his work.
