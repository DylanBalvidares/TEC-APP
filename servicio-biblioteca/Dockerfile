FROM node:alpine

WORKDIR /app

COPY ./servicio-biblioteca/package*.json ./

RUN npm install

COPY ./servicio-biblioteca ./

EXPOSE 3310

CMD ["node","main.js"]