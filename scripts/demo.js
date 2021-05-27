const { transformFile } = require("../dist");

transformFile({
  baseDir: "./demo",
  filename: "demo",
  componentName: "arco-demo",
  distDir: "./demo-dist",
});
