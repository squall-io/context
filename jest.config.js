/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: false,
  verbose: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: '.coverage',
  setupFilesAfterEnv: [
    './spec/.jest/setup',
  ],
  reporters: [
    'default',
    // './spec/.jest/reporter',
  ],
  detectOpenHandles: true,
};
