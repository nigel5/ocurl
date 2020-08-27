require('dotenv').config();

const path = require('path');

const express = require('express');
const redis = require('redis');
const cassandra = require('cassandra-driver');

const withApi = require('./middleware/withApi');
const withRedirects = require('./middleware/withRedirects');
const withCaching = require('./middleware/withCaching');
const withLogging = require('./middleware/withLogging');

const settings = require('./ocshorten.conf.json');
const { withMapping } = require('./middleware/withMapping');
const { INIT_URL_MAPPING } = require('./util/database/statements');
const helmet = require('helmet');

/**
 * Database connection
 */
const cassandraClient = new cassandra.Client(settings.cassandra);
cassandraClient.connect(function (err) {
  if (err) {
    console.log(`Error occured when connecting to database ${err}`);
    process.exit(1);
  } else {
    console.log(
      `Connected to Cassandra db at ${settings.cassandra.contactPoints}`
    );

    cassandraClient.execute(INIT_URL_MAPPING);
  }
});

/**
 * Cache connection
 */
const redisClient = redis.createClient();
redisClient.on('error', function (err) {
  console.log('Redis Error occured', err);
});

redisClient.on('connect', function () {
  console.log('Connected to Redis');
});

const app = express();
const port = 3000;

app.use(helmet());
app.use(withCaching(redisClient));
app.use(withMapping(cassandraClient, redisClient));
app.use(withLogging);
app.use(withApi(cassandraClient, redisClient));
app.use(withRedirects());

app.listen(port, () => {
  console.log(`One Click Shorten (ocshorten) server started on port ${port}`);
});
