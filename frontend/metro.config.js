// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { FileStore } = require("metro-cache");

const config = getDefaultConfig(__dirname);

const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, ".metro-cache");
config.cacheStores = [new FileStore({ root: path.join(root, "cache") })];
config.maxWorkers = 2;

if (!config.resolver.assetExts.includes("onnx")) {
  config.resolver.assetExts.push("onnx");
}

module.exports = config;
