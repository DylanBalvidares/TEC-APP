FROM node:20-alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-comunidad ./

COPY ./backend-tecApp/db ./db

EXPOSE 3305

CMD ["node","main.js"]
