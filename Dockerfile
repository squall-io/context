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
ARG CODECOV_TOKEN
ARG BRANCH_NAME
ARG COMMIT_SHA
ARG NPM_TOKEN

COPY --from=build /opt/app/dist ./
COPY --from=build /opt/app/.coverage ./.coverage
COPY .npmrc README.md LICENSE.md package.json yarn.loc[k] ./
RUN echo "//registry.npmjs.org/:_authToken=\"$NPM_TOKEN\"" >> .npmrc

RUN apk --no-cache add curl
RUN test 'main' = "$BRANCH_NAME" && npm publish --access public || echo 'Not published.'
RUN curl -OLs https://uploader.codecov.io/latest/alpine/codecov && chmod +x codecov
RUN ./codecov \
    --nonZero \
    --rootDir . \
    --dir .coverage \
    --slug squall-io/context \
    --token "$CODECOV_TOKEN" \
    --branch "$BRANCH_NAME" \
    --sha "$COMMIT_SHA"
