#
# {{baseline}}
#
FROM node:alpine AS baseline
WORKDIR /opt/app

COPY package.json yarn.loc[k] ./
RUN yarn install

#
# {{test-and-build}}
#
FROM baseline AS build
COPY tsconfig.json tsconfig.base.json tsconfig.transpile.json .babelrc.json ./
COPY jest.config.js ./
COPY .babelrc.json ./
COPY spec ./spec
COPY src ./src
RUN yarn build

#
# {{deploy}}
#
FROM node:alpine AS deploy
ENV HOME=/opt/app
WORKDIR /opt/app

COPY --from=build /opt/app/dist ./
COPY .npmrc README.md LICENSE.md package.json yarn.loc[k] ./
RUN npm publish --access public
