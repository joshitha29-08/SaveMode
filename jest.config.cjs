module.exports = {
  testEnvironment: "node",

  testMatch: [
    "<rootDir>/src/**/*.test.ts"
  ],

  transform: {
    "^.+\\.ts$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                node: "current"
              }
            }
          ],
          "@babel/preset-typescript"
        ]
      }
    ]
  },

  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "!src/lib/**/*.test.ts"
  ],

  clearMocks: true
};