const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Keep the generated stylesheet virtual so Metro can bundle web exports
  // without hashing a generated file inside node_modules.
  forceWriteFileSystem: false,
});
