require('dotenv').config();

const express = require('express');
const redis = require('redis');
const cassandra = require('cassandra-driver');

const api = require('./middleware/api');
const redirects = require('./middleware/redirects');
const caching = require('./middleware/caching');
const logging = require('./middleware/logging');

const settings = require('./ocshorten.conf.json');

/**
 * Database connection
 */
const cassandraClient = new cassandra.Client(settings.cassandra);
cassandraClient.connect(function (err) {
  if (err) {
    console.log(`Error occured when connecting to database ${err}`);
    process.exit(1);
  } else {
    console.log(`Connected to Cassandra db at ${settings.cassandra.contactPoints}`);
  }
});

/**
* Cache connection
*/


const app = express();
const port = 3000;

app.use(caching());
app.use(logging);
app.use(api(cassandraClient));
app.use(redirects());

app.listen(port, () => {
  console.log(`One Click Shorten (ocshorten) server started on port ${port}`);
});
