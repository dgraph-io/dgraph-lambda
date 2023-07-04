FROM node:20-alpine as build

RUN apk add python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG nodeEnv=production
ENV NODE_ENV $nodeEnv
RUN npm run build

# Used just for tests
ENTRYPOINT [ "npm", "run" ]

FROM node:20-alpine
ENV NODE_ENV production
RUN adduser app -h /app -D
USER app
WORKDIR /app
COPY --from=build --chown=app /app /app
CMD ["npm", "start"]
