FROM node:20-alpine

WORKDIR /frontend

COPY frontend-tecApp/package*.json ./

RUN npm install

COPY frontend-tecApp/. .

EXPOSE 5173

CMD ["npm", "run", "dev"]
