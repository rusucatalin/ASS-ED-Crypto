export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
