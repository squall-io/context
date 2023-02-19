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
ARG BRANCH_NAME

COPY --from=build /opt/app/dist ./
COPY --from=build /opt/app/.coverage ./.coverage
COPY .npmrc README.md LICENSE.md package.json yarn.loc[k] ./
RUN test 'main' = "$BRANCH_NAME" && npm publish --access public || echo 1

RUN curl -OLs https://uploader.codecov.io/latest/alpine/codecov
RUN chmod +x codecov
RUN source .codecovrc && ./codecov --dir .coverage
