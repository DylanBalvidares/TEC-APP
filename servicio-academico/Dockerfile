#usa la imagen oficial de node
FROM node:20-alpine

#se crea una carpeta(/app/servicio-academico/) dentro del contenedor,y se coloca dentro de ella
WORKDIR /app

#copia las dependencias al contenedor
COPY ./servicio-academico/package*.json ./

#instala librerias dentro del contenedor
RUN npm install 

#crea carpeta db en raiz

#copiar carpeta db en el contenedor
COPY ./db ./db

#copia todo el codigo de la carpeta actual la carpeta actual del contenedor(/app)
COPY ./servicio-academico ./

#define el puerto en el que se escuchan conexiones
EXPOSE 3307

CMD [ "node","server.js" ]