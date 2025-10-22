import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage'
};

export default config;
