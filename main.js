require('dotenv').config();

const express = require('express');
const redis = require('redis');
const cassandra = require('cassandra-driver');

const api = require('./middleware/api');
const redirects = require('./middleware/redirects');
const caching = require('./middleware/caching');
const logging = require('./middleware/logging');

const app = express();
const port = 3000;

app.use(caching());
app.use(logging);
app.use(api());
app.use(redirects());

app.listen(port, () => {
  console.log(`One Click Shorten (ocshorten) server started on port ${port}`);
});
