FROM node:10-alpine as build-stage

ENV TZ Asia/Shanghai
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cnpm install
RUN npm run build:prod

# production stage
FROM nginx:stable-alpine as production-stage
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
