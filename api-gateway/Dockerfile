FROM node:alpine

WORKDIR /app

COPY ./api-gateway/package*.json ./

RUN npm install

COPY ./api-gateway ./

EXPOSE 9000

CMD ["node", "gateway.js"]