FROM alpine:latest

RUN apk add --update npm nodejs-current

RUN addgroup -S node && adduser -S node -G node

RUN mkdir /srv/chat && chown node:node /srv/chat

USER node

WORKDIR /srv/chat

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

CMD ["node", "chat.js"]