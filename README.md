<h1><b>1</b> <b>C</b>lick <b>U</b>RL</h1>
<p align="center">
  <img align="center" src="extension/chrome/icon128.png">
</P>

> URL shortening service API and Chrome Extension

## Features

- Public REST api for developers
- Uses a cache
- Unobtrusive one click Chrome extension to shorten current page URLs and copy to clipboad
- Ready to be scaled horizontally
- Configurable server settings

## Public API

| Method | Endpoint       | Query parameters?              |
| ------ | -------------- | ------------------------------ |
| GET    | /api/v1/url    | q {string} The destination url |
| GET    | /api/v1/decode | q {string} The short url       |

## Requirements

- Node.js v12.18.3 LTS
- Redis 6
- Cassandra 3

## Docker Setup

1 Click URL is available as a Docker service.

## Configuration

Configuration options can be set in `ocurl.conf.dev.json`.
