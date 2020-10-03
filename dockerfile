FROM node:14

ENV DOCKER true

ENV DEBUG=middleware:*,app:*

WORKDIR /usr/src/ocurl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl --fail http://localhost:3000/api/v1/health || false" ]

CMD [ "node", "main.js" ]
