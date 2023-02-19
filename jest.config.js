/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  cache: false,
  verbose: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: '.coverage',
  coverageReporters: [
      'lcov',
      'text',
  ],
  setupFilesAfterEnv: [
    './spec/.jest/setup',
  ],
  reporters: [
    'default',
    // './spec/.jest/reporter',
  ],
  detectOpenHandles: true,
};
