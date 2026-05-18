FROM node:alpine

WORKDIR /app

COPY ./db ./db

COPY ./servicio-usuarios/package*.json ./

RUN npm install

COPY ./servicio-usuarios ./

EXPOSE 3309

CMD ["node","main.js"]