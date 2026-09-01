FROM node:alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/api-gateway ./

EXPOSE 9000

CMD ["node", "gateway.js"]
