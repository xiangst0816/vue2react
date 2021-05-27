const { transformFile } = require("../dist");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const names = [
  "avatar",
  "avatar-group",
  "badge",
  "button",
  "cell",
  "cells",
  "checker",
  "count-down",
  "demo-header",
  "divider",
  "drag-sort",
  "error-page",
  "footer",
  "icon",
  "loading",
  "marquee",
  "navbar",
  "notice-bar",
  "pagination",
  "result",
  "segment",
  "skeleton",
  "skeleton-base",
  "switch",
  "tabbar",
  "tabs",
  "tag",
];

names.forEach((name) => {
  console.log("------------------");
  console.log(name);
  const baseDir = `/Users/xiangst/bytedance/lynx-mono/packages/lynx-ui/components/${name}`;
  const distDir = path.resolve(
    __dirname,
    `./arco/${_.upperFirst(_.camelCase(name))}`
  );
  transformFile({
    baseDir: baseDir,
    filename: name,
    componentName: `arco-${name}`,
    distDir: distDir,
    distName: `index.jsx`,
  });

  // ttss
  const ttssSrcFilePath = path.resolve(baseDir, `${name}.ttss`);
  const ttssDistDirFilePath = path.resolve(distDir, `index.scss`);
  if (fs.existsSync(ttssSrcFilePath)) {
    fs.createReadStream(ttssSrcFilePath).pipe(
      fs.createWriteStream(ttssDistDirFilePath)
    );
  }

  // lepus
  const lepusSrcFilePath = path.resolve(baseDir, `${name}.lepus`);
  const lepusDistDirFilePath = path.resolve(distDir, `${name}.lepus.js`);
  if (fs.existsSync(lepusSrcFilePath)) {
    fs.createReadStream(lepusSrcFilePath).pipe(
      fs.createWriteStream(lepusDistDirFilePath)
    );
  }
});
