<h1><b>O</b>ne <b>C</b>lick <b>U</b>RL</h1>
<p align="center">
  <img align="center" src="extension/chrome/icon128.png">
</P>

> OCUrl: URL shortening service API and Chrome Extension

## Features

- Public REST api for developers
- Cached by default (still works if cache is offline!)
- Unobtrusive one click Chrome extension to shorten current page URLs and copy to clipboad
- Ready to be scaled horizontally
- Simple configuration and deployment

## Public API

| Method | Endpoint       | Query parameters?                | Description                               |
| ------ | -------------- | -------------------------------- | ----------------------------------------- |
| GET    | /api/v1/url    | `q` {string} The destination url | Get a short url for destination `q`       |
| GET    | /api/v1/decode | `q` {string} The short url       | Get destination for short url or key `q`. |
| ANY    | /api/v1/health | none                             | Server health [ok 200,unavailable 500]    |

### Example

```javascript
fetch('https://onecurl.com/api/v1/url?q=https://github.com')
  .then((res) => res.json())
  .then((json) => console.log(json));

// Output:
// {
//   "data": {
//     "url": "localhost:3000/ou6p1"
//   }
// }
```

## Requirements

- Node.js v12.18.3 LTS
- Redis 6
- Cassandra 3

## Docker Setup

Ocurl is also available as a Docker application.

To run in Docker,

> docker-compose up --build

This will pull `node:14`, `cassandra:latest`, and `redis:latest`.

## Local Development Setup

First, start up Cassandra, and optionally, Redis if you want a cache. Modify the dev configuration file with the hostname and ports if required. Then,

```javascript
yarn install
yarn dev // Nodemon will watch for changes and automatically restart the server
```

## Configuration

Global application settings are exported in `main.js`. Ocurl provides configuration files for development, producation, and docker by default.

## License

**Private**
