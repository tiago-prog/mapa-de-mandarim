/** @type {const} */
const tokens = require("./design-system/tokens.json");

const themeColors = {
  primary: { light: tokens.color.seal, dark: tokens.color.dark.seal },
  background: { light: tokens.color.paper, dark: tokens.color.dark.paper },
  surface: { light: tokens.color.surface, dark: tokens.color.dark.surface },
  foreground: { light: tokens.color.ink, dark: tokens.color.dark.ink },
  muted: { light: tokens.color.muted, dark: tokens.color.dark.muted },
  border: { light: tokens.color.border, dark: tokens.color.dark.border },
  success: { light: tokens.color.sage, dark: tokens.color.dark.sage },
  warning: { light: tokens.color.gold, dark: tokens.color.dark.gold },
  error: { light: tokens.color.error, dark: tokens.color.dark.error },
  sand: { light: tokens.color.sand, dark: tokens.color.dark.sand },
  gold: { light: tokens.color.gold, dark: tokens.color.dark.gold },
  sky: { light: tokens.color.sky, dark: tokens.color.dark.sky },
};

module.exports = { themeColors, tokens };
