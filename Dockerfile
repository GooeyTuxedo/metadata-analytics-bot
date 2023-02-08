FROM node:18-alpine3.16 as ts-compiler
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM node:18-alpine3.16 as ts-remover
WORKDIR /usr/app
COPY --from=ts-compiler /usr/app/package*.json ./
COPY --from=ts-compiler /usr/app/dist ./
RUN apk update \
  && apk add --no-cache sqlite-dev
RUN npm install --omit=dev

FROM node:18-alpine3.16
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
COPY .env ./
VOLUME [ "/usr/app/db" ]
USER root
RUN apk update \
  && apk add --no-cache sqlite-dev sqlite
CMD node index.js