FROM node:alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-auth ./

COPY ./backend-tecApp/db ./db

EXPOSE 3308

CMD ["node","main.js"]
