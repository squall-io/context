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
FROM baseline AS test-and-build
COPY tsconfig.json .babelrc.json ./
COPY spec ./spec
COPY src ./src
RUN yarn build

#
# {{deploy}}
#
FROM node:alpine AS deploy
WORKDIR /opt/app

COPY --from=test-and-build /opt/app/dist ./
COPY .npmrc README.md LICENSE.md package.json yarn.loc[k] ./
RUN ls -al
RUN npm publish --access public
