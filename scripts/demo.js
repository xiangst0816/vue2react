const { transformFile } = require("../dist");

transformFile({
  baseDir: "./demo",
  filename: "demo",
  componentName: "demo",
  distDir: "./demo-dist",
  options: {
    componentPathRewrite(name, path) {
      console.log(name, path);
      return path;
    },
  },
});
