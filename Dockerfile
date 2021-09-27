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
RUN cp README.md LICENSE yarn.lock ./dist
RUN jq 'del(.devDependencies,.scripts)' package.json > dist/package.json

#
# {{deploy}}
#
FROM build AS deploy
COPY --from=build /opt/app/dist .
RUN npm publish
