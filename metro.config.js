const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude the functions directory from Metro bundler
config.resolver.blockList = [
  /functions\/.*/
];

module.exports = config;
