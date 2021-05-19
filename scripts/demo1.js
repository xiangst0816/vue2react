const path = require("path");
const fs = require("fs");
const { transformFile2 } = require("../dist/index");

const srcPath = path.resolve(__dirname, "../example/demo1/cool.vue");
const targetName = "cool.js";
const distDir = path.resolve(__dirname, "../example/demo1/out");

transformFile2(srcPath, targetName, distDir);
