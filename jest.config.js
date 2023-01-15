/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: false,
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: '.coverage',
  setupFiles: [
    './spec/.jest/setup',
  ],
  reporters: [
      './spec/.jest/reporter',
  ],
  detectOpenHandles: true,
};