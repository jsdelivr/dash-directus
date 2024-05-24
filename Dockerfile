# Build hooks/jsd-purge-tokens
FROM node:18-alpine AS builder-01
WORKDIR /builder/src/extensions/hooks/jsd-purge-tokens
ADD ./src/extensions/hooks/jsd-purge-tokens/package.json ./src/extensions/hooks/jsd-purge-tokens/package-lock.json ./
RUN npm ci
COPY ./src/extensions/hooks/jsd-purge-tokens .
RUN npm run build

# Build hooks/sign-up
FROM node:18-alpine AS builder-02
WORKDIR /builder/src/extensions/hooks/sign-up
ADD ./src/extensions/hooks/sign-up/package.json ./src/extensions/hooks/sign-up/package-lock.json ./
RUN npm ci
COPY ./src/extensions/hooks/sign-up .
RUN npm run build

# Build interfaces/token
FROM node:18-alpine AS builder-03
WORKDIR /builder/src/extensions/interfaces/token
ADD ./src/extensions/interfaces/token/package.json ./src/extensions/interfaces/token/package-lock.json ./
RUN npm ci
COPY ./src/extensions/interfaces/token .
RUN npm run build

# Build token-value
FROM node:18-alpine AS builder-04
WORKDIR /builder/src/extensions/token-value
ADD ./src/extensions/token-value/package.json ./src/extensions/token-value/package-lock.json ./
RUN npm ci
COPY ./src/extensions/token-value .
RUN npm run build

# Build operations/remove-banned-users-cron-handler
FROM node:18-alpine AS builder-05
WORKDIR /builder/src/extensions/operations/remove-banned-users-cron-handler
ADD ./src/extensions/operations/remove-banned-users-cron-handler/package.json ./src/extensions/operations/remove-banned-users-cron-handler/package-lock.json ./
RUN npm ci
COPY ./src/extensions/operations/remove-banned-users-cron-handler .
RUN npm run build

FROM directus/directus:10.9.3

COPY --from=builder-01 /builder/src/extensions/hooks/jsd-purge-tokens/dist/* /directus/extensions/hooks/jsd-purge-tokens/
COPY --from=builder-02 /builder/src/extensions/hooks/sign-up/dist/* /directus/extensions/hooks/sign-up/
COPY --from=builder-03 /builder/src/extensions/interfaces/token/dist/* /directus/extensions/interfaces/token/
COPY --from=builder-04 /builder/src/extensions/token-value/dist/* /directus/extensions/directus-extension-token-value/dist/
COPY --from=builder-04 /builder/src/extensions/token-value/package.json /directus/extensions/directus-extension-token-value/
COPY --from=builder-05 /builder/src/extensions/operations/remove-banned-users-cron-handler/dist/* /directus/extensions/operations/remove-banned-users-cron-handler/
