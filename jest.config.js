module.exports = {
  preset: "jest-expo",
  testMatch: ["**/Tests/**/*.(test|spec).(ts|tsx|js|jsx)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|react-native|@react-navigation|expo(nent)?|expo-modules-core|@expo(nent)?/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)/)",
  ],
};
