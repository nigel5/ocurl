require('dotenv').config();

const path = require('path');

const express = require('express');
const redis = require('redis');
const { Pool } = require('pg');

const withApi = require('./middleware/withApi');
const withRedirects = require('./middleware/withRedirects');
const withCaching = require('./middleware/withCaching');
const withLogging = require('./middleware/withLogging');
const withRateLimiter = require('./middleware/withRateLimiter');

const lw = require('@google-cloud/logging-winston');
const { logger, loggingWinston } = require('./util/logger');

const d = require('debug')('app:main');

/**
 * Global application settings are exported here
 */
let settings;
if (process.env.DOCKER) {
  d('(DOCKER)');
  settings = require('./ocurl.conf.docker.json');
} else if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
  d('(PRODUCTION)');
  settings = require('./ocurl.conf.prod.json');
} else {
  d('(DEVELOPMENT)');
  settings = require('./ocurl.conf.dev.json');
}
module.exports.settings = settings;
global.__PROJECT_PATH_ROOT = path.resolve(__dirname);

const { withMapping } = require('./middleware/withMapping');
const {
  INIT_URL_MAPPING,
  HEALTH_CHECK,
} = require('./util/database/statements2');
const helmet = require('helmet');

/**
 * Database connection
 */
const pgPool = new Pool();

// Run an intial query to test the pool
pgPool.query(HEALTH_CHECK);

var pgConnectionStatus = 0;
pgPool.on('connect', (client) => {
  d('Connection established to postgresql');
  client.query(INIT_URL_MAPPING);
  pgConnectionStatus = 1;
});

pgPool.on('error', (err) => {
  d('Connection to postgresql lost', err);
  pgConnectionStatus = 0;
});

module.exports.pgConnectionStatus = () => pgConnectionStatus;

/**
 * Cache connection
 */
//#region cache
const redisClient = redis.createClient(
  settings.redis.port,
  settings.redis.hostname
);
// 0 : Not connected
// 1 : Connected

var redisConnectionStatus = 0;

redisClient.on('error', function (err) {
  redisConnectionStatus = 0;
  d('Redis Error occured', err);
});

redisClient.on('connect', function () {
  redisConnectionStatus = 1;
  d(`Connected to Redis at ${settings.redis.hostname}:${settings.redis.post}`);
});

redisClient.on('ready', function () {
  redisConnectionStatus = 1;
  d(`Redis is ready ${settings.redis.hostname}:${settings.redis.post}`);
});

redisClient.on('end', function () {
  redisConnectionStatus = 0;
  d(`Redis connected ended ${settings.redis.hostname}:${settings.redis.post}`);
});

module.exports.redisConnectionStatus = () => redisConnectionStatus;
//#endregion

const app = express();
const port = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          '*.bootstrapcdn.com',
          '*.googletagmanager.com',
          '*.jsdelivr.net',
          'code.jquery.com',
          'https://www.google-analytics.com',
          'www.googletagmanager.com',
        ],
        styleSrc: ["'self'", '*.bootstrapcdn.com'],
        imgSrc: [
          "'self'",
          'https://www.google-analytics.com',
          'www.googletagmanager.com',
        ],
      },
    },
  })
);

if (logger && loggingWinston) {
  lw.express
    .makeMiddleware(logger, loggingWinston)
    .then((middleware) => {
      gcpLogger = middleware;
      app.use(gcpLogger);
      d('Initialized Stackdriver logging');
    })
    .finally(() => {
      app.use(express.static(path.join(__dirname, 'public')));
      app.use(withLogging(app));
      app.use(withRateLimiter(redisClient));
      app.use(withCaching(redisClient));
      app.use(withMapping(pgPool, redisClient));
      app.use(withApi(pgPool, redisClient));
      app.use(withRedirects());
    });
}

app.enable('trust proxy', settings.trust_proxy);

app.listen(port, settings.hostname, () => {
  d(`One Click URL (ocurl) server started on port ${port}`);
});

process.on('exit', () => {
  pgPool.end();
});

/**
 * Singleton access point for middlewares
 */
module.exports.app = app;
