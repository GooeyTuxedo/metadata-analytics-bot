FROM node:18-alpine3.17 as ts-compiler
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN apk update \
  && apk add --no-cache build-base python3 sqlite-dev sqlite
RUN npm install --build-from-source --sqlite=/usr/bin
COPY . ./
RUN npm run build

FROM node:18-alpine3.17 as ts-remover
WORKDIR /usr/app
COPY --from=ts-compiler /usr/app/package*.json ./
COPY --from=ts-compiler /usr/app/dist ./
RUN apk update \
  && apk add --no-cache build-base python3 sqlite-dev sqlite
RUN npm install --build-from-source --sqlite=/usr/bin --omit=dev

FROM node:18-alpine3.17
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
COPY .env ./
USER root
RUN apk update \
  && apk add --no-cache sqlite-dev sqlite
CMD node index.js