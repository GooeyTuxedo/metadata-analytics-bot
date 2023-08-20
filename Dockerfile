FROM node:18-slim as ts-compiler
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN apt update \
  && apt install build-essential python3 -y
RUN npm install
COPY . ./
RUN npm run build

FROM node:18-slim as ts-remover
WORKDIR /usr/app
RUN apt update \
  && apt install build-essential python3 -y
COPY --from=ts-compiler /usr/app/package*.json ./
COPY --from=ts-compiler /usr/app/dist ./
RUN npm install --omit=dev

FROM node:18-slim as run-export
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
CMD node scripts/export-metadata-db.js

FROM node:18-slim
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
CMD node index.js