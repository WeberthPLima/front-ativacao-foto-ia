FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=
ARG VITE_PUBLIC_APP_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PUBLIC_APP_URL=$VITE_PUBLIC_APP_URL
RUN npm run build

FROM nginx:stable-alpine
ENV PORT=8080
ENV API_UPSTREAM=http://api:3333
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
