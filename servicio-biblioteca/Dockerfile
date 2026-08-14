FROM node:alpine

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY ./backend-tecApp/servicio-biblioteca ./

EXPOSE 3309

CMD ["node","main.js"]
