FROM node:20-alpine

WORKDIR /app

COPY backend-tecApp/package*.json ./

# Dev: instala también devDependencies (ej. sequelize-cli) para poder correr migraciones
RUN npm install

COPY backend-tecApp/. .

EXPOSE 9000

CMD ["npm", "start"]
