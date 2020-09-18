FROM node:12-alpine as build

RUN apk add python make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG nodeEnv=production
ENV NODE_ENV $nodeEnv
RUN npm run build && if [[ "$nodeEnv" == "production" ]]; then rm -rf node_modules && npm install --no-optional; fi

# Used just for tests
ENTRYPOINT [ "npm", "run" ]

FROM node:12-alpine
ENV NODE_ENV production
RUN adduser app -h /app -D
USER app
WORKDIR /app
COPY --from=build --chown=app /app /app
CMD ["node", "."]
