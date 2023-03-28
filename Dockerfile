FROM node:18-slim as ts-compiler
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN apt update \
  && apt install build-essential python3 libsqlite3-dev -y
RUN npm install
COPY . ./
RUN npm run build

FROM node:18-slim as ts-remover
WORKDIR /usr/app
COPY --from=ts-compiler /usr/app/package*.json ./
COPY --from=ts-compiler /usr/app/dist ./
RUN apt update \
  && apt install build-essential python3 libsqlite3-dev sqlite3 -y
RUN npm install --build-from-source --sqlite=/usr/bin --omit=dev

FROM node:18-slim
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
COPY .env ./
RUN apt update \
  && apt install libsqlite3-dev sqlite3 -y
CMD node index.js