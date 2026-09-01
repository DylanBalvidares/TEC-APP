FROM node:alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-usuarios ./

COPY ./backend-tecApp/db ./db

EXPOSE 3310

CMD ["node","main.js"]
