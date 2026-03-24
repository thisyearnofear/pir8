/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@pir8/core$": "<rootDir>/packages/core/src/index.ts",
    "^@pir8/core/(.*)$": "<rootDir>/packages/core/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "packages/core/src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  verbose: true,
};
