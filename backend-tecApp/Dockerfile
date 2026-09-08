FROM node:20-alpine

WORKDIR /app

COPY backend-tecApp/package*.json ./

RUN npm install --production

COPY backend-tecApp/. .

EXPOSE 9000

CMD ["npm", "start"]
