FROM node:alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-biblioteca ./

COPY ./backend-tecApp/db ./db

EXPOSE 3309

CMD ["node","main.js"]
