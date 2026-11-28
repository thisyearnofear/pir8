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
    // Include .js: uuid ships ESM-only (dist-node) via @solana/web3.js and
    // must be compiled to CJS like everything else.
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  // uuid is ESM-only; transform it instead of choking on `export`.
  // The (?:.*/)? handles pnpm's nested layout:
  // node_modules/.pnpm/uuid@x/node_modules/uuid/...
  transformIgnorePatterns: ["/node_modules/(?!(?:.*/)?uuid/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "packages/core/src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  verbose: true,
};
