FROM node:20-alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-academico ./

COPY ./backend-tecApp/db ./db

EXPOSE 3307

CMD [ "node","main.js" ]
