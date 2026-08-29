FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/image-quality-inspector/package.json artifacts/image-quality-inspector/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ARG PORT=4173
ARG BASE_PATH=/
ENV PORT=$PORT
ENV BASE_PATH=$BASE_PATH
RUN pnpm --filter @workspace/image-quality-inspector run build

FROM nginx:alpine
COPY --from=build /app/artifacts/image-quality-inspector/dist/public /usr/share/nginx/html
EXPOSE 80