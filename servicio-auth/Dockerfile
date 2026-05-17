FROM node:alpine

WORKDIR /app

COPY ./db ./db

COPY ./servicio-auth/package*.json ./

RUN npm install

COPY ./servicio-auth ./

EXPOSE 3308

CMD ["node","main.js"]