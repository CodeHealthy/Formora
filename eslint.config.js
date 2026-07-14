import { baseConfig } from "@formora/eslint-config/base";
import { reactConfig } from "@formora/eslint-config/react";

export default [
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
