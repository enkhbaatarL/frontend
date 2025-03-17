# build stage
FROM node:22.14 AS build-stage

RUN npm install typescript -g

WORKDIR /app

COPY . .

RUN npm install && npm run build

# production stage
FROM nginx:stable-alpine AS production-stage

RUN apk add --no-cache tzdata

ENV LANG=ko_KR.UTF-8
ENV LANGUAGE=ko_KR:en
ENV LC_ALL=ko_KR.UTF-8

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/"$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN mkdir /logs && chmod 777 /logs

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
