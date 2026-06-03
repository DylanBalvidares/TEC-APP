FROM node:20-alpine

WORKDIR /servicio-comunidad

COPY ./servicio-comunidad/package*.json ./

RUN npm install 

COPY ./db ./db

COPY ./servicio-comunidad ./

EXPOSE 3005

CMD ["npm", "start"]
