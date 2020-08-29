require('dotenv').config();

const path = require('path');

const express = require('express');
const redis = require('redis');
const cassandra = require('cassandra-driver');

const withApi = require('./middleware/withApi');
const withRedirects = require('./middleware/withRedirects');
const withCaching = require('./middleware/withCaching');
const withLogging = require('./middleware/withLogging');

/**
 * Global application settings are exported here
 */
let settings;
if (process.env.DOCKER) {
  console.log('(DOCKER)');
  settings = require('./ocurl.conf.docker.json');
} else if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
  console.log('(PRODUCTION)');
  settings = require('./ocurl.conf.prod.json');
} else {
  console.log('(DEVELOPMENT)');
  settings = require('./ocurl.conf.dev.json');
}
module.exports.settings = settings;

const { withMapping } = require('./middleware/withMapping');
const {
  INIT_KEYSPACE,
  INIT_URL_MAPPING,
  INIT_INDEX,
} = require('./util/database/statements');
const helmet = require('helmet');

/**
 * Database connection
 */
const cassandraClient = new cassandra.Client({
  policies: {
    reconnection: new cassandra.policies.reconnection.ConstantReconnectionPolicy(
      5
    ),
  },
  ...settings.cassandra,
});
cassandraClient.connect(async function (err) {
  if (err) {
    console.log(`Error occured when connecting to database ${err}`);
    process.exit(1);
  } else {
    await cassandraClient.execute(INIT_KEYSPACE, []);
    await cassandraClient.execute('USE ocurl');
    await cassandraClient.execute(INIT_URL_MAPPING, []);
    await cassandraClient.execute(INIT_INDEX, []);
    console.log(
      `Connected to Cassandra db at ${settings.cassandra.contactPoints}`
    );
  }
});

/**
 * Cache connection
 */
const redisClient = redis.createClient(
  settings.redis.port,
  settings.redis.hostname
);
redisClient.on('error', function (err) {
  console.error('Redis Error occured', err);
  console.info('Attempting to reconnect Redis');
});

redisClient.on('connect', function () {
  console.info(
    `Connected to Redis at ${settings.redis.hostname}:${settings.redis.post}`
  );
});

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(withCaching(redisClient));
app.use(withMapping(cassandraClient, redisClient));
app.use(withLogging);
app.use(withApi(cassandraClient, redisClient));
app.use(withRedirects());

app.listen(port, settings.hostname, () => {
  console.log(`One Click URL (ocurl) server started on port ${port}`);
});
