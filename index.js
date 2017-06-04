const program = require('commander');
const Couchit = require('./lib/couchit');

// Default config file
let configFile = './lib/config';

const version = require('./package.json').version;

program
  .version(version)
  .option('-c, --config [file]', 'Relative path to config.js')
  .parse(process.argv);

// If custom config is provided, assume path is relative
if (program.config) {
  configFile = process.cwd() + '/' + program.config;
}

const config = require(configFile);

console.log('----------------------------------------');
console.log('| Couchit ' + version);
console.log('----------------------------------------');
console.log('configFile : ' + configFile);
console.log('dbEndpoint : ' + config.dbEndpoint);
console.log('dbName     : ' + config.dbName);
console.log('dbUser     : ' + config.dbUser);
console.log('dbPass     : ' + config.dbPass);
console.log('interval   : ' + config.interval);
console.log('startKey   : ' + config.startKey);
console.log('endKey     : ' + config.endKey);
console.log('pageSize   : ' + config.pageSize);
console.log('numPages   : ' + config.numPages);
console.log('batchSize  : ' + config.batchSize);
console.log('quiet      : ' + config.quiet);
console.log('tasks      : ' + JSON.stringify(config.tasks));
console.log('----------------------------------------');
console.log('| Iterating..')
console.log('----------------------------------------');

new Couchit().iterate(config, results => {
  console.log('Couchit complete');
});
