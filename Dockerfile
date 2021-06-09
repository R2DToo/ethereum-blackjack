FROM node:14.17-alpine

WORKDIR /blackjack

COPY build ./build

COPY server.js ./server.js

RUN npm install express

EXPOSE 3011

CMD [ "node", "server.js" ]