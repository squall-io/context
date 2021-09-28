#
# {{baseline}}
#
FROM node:alpine AS baseline
WORKDIR /opt/app

COPY package.json yarn.loc[k] ./
RUN yarn install

COPY . .

#
# {{test}}
#
FROM baseline AS test
RUN yarn test

#
# {{build}}
#
FROM test AS build
RUN apk add --no-cache jq
RUN yarn build && yarn declare
RUN cp README.md LICENSE.md yarn.lock ./dist
RUN jq 'del(.devDependencies,.scripts)' package.json > dist/package.json

#
# {{deploy}}
#
FROM node:alpine AS deploy
WORKDIR /opt/app

COPY --from=build /opt/app/dist .
COPY .npmrc .

RUN npm publish --access public
