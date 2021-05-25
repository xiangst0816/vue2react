const generate = require("@babel/generator").default;
const path = require("path");
const fs = require("fs");
const {
  configIterator,
  lepusIterator,
  scriptIterator,
  templateIterator,
  reactTemplateBuilder,
  reactIterator,
  formatCode,
} = require("../dist/index");

const name = "button";
const distDir = path.resolve(__dirname, name);

// const baseDir = path.resolve(__dirname, `../ttml/${name}`);
const baseDir = `/Users/xiangst/bytedance/lynx-mono/packages/lynx-ui/components/${name}`;

const scriptPath = path.resolve(baseDir, `${name}.js`);
const stylePath = path.resolve(baseDir, `${name}.ttss`);
const templatePath = path.resolve(baseDir, `${name}.ttml`);
const configPath = path.resolve(baseDir, `${name}.json`);

function getCode(codePath) {
  return fs.readFileSync(codePath, "utf8");
}

function transformCode(templateCode, scriptCode, styleCode, configCode) {
  // script
  const script = scriptIterator(scriptCode);
  script.name = `arco-${name}`;
  // console.log(script);

  // template
  const template = templateIterator(templateCode);
  // console.log(template);
  const lepus = lepusIterator(configCode, baseDir);
  const config = configIterator(configCode);
  const app = {
    script,
    template,
    lepus,
    config,
  };

  // react 模板相关
  const rast = reactTemplateBuilder(app);
  const hasStyle = true;

  // collect-data + react-template => react-ast
  const targetAst = reactIterator(rast, app, hasStyle);

  const targetCode = generate(targetAst).code;

  // const reactCode = targetCode
  const reactCode = formatCode(targetCode, "react");

  // console.log("reactCode");
  // console.log(reactCode);

  const styles = [];
  return [reactCode, styles];
}

const [script, styles] = transformCode(
  getCode(templatePath),
  getCode(scriptPath),
  getCode(stylePath),
  getCode(configPath)
);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

fs.writeFileSync(path.resolve(distDir, `${name}.js`), script);

// const srcPath = path.resolve(__dirname, "../example/demo1/cool.vue");
// const targetName = "cool.js";
// const distDir = path.resolve(__dirname, "../example/demo1/out");
//
// transformFile2(srcPath, targetName, distDir);
