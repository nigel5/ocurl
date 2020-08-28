FROM node:14

ENV DOCKER true

WORKDIR /usr/src/ocurl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "main.js" ]
