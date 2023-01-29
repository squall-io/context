/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: false,
  verbose: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: '.coverage',
  setupFilesAfterEnv: [
    './spec/.jest/setup',
  ],
  reporters: [
      './spec/.jest/reporter',
  ],
  detectOpenHandles: true,
};
