module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
      // Airbnb style guide 적용
      "airbnb-base",
      // TypeScript ESLint recommanded style 적용
      "plugin:@typescript-eslint/eslint-recommended"
    ],
    rules: {
      "no-console":"off",
      "import/no-unresolved": "off",
      "import/extensions": "off",
      "linebreak-style": "off",
      "no-use-before-define": "off",
    }
  };