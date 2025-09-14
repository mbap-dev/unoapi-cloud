/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    '^.+\\.(js|jsx)$': ['ts-jest', { useESM: true }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@whiskeysockets/baileys|baileys|@adiwajshing/keyed-db|pino|pino-pretty)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};