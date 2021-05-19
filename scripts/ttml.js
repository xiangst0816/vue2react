const generate = require("@babel/generator").default;
const path = require("path");
const fs = require("fs");
const {
  scriptIterator,
  templateIterator,
  reactTemplateBuilder,
  reactIterator,
  formatCode,
} = require("../dist/index");

const name = "avatar";
const distDir = path.resolve(__dirname, name);
const baseDir = path.resolve(__dirname, `../ttml/${name}`);
const scriptPath = path.resolve(baseDir, `${name}.js`);
const stylePath = path.resolve(baseDir, `${name}.ttss`);
const templatePath = path.resolve(baseDir, `${name}.ttml`);
const lepusPath = path.resolve(baseDir, `${name}.lepus`);
const configPath = path.resolve(baseDir, `${name}.json`);

function getCode(codePath) {
  return fs.readFileSync(codePath, "utf8");
}

function transformCode(
  templateCode,
  scriptCode,
  styleCode,
  lepusCode,
  configCode
) {
  // script
  const script = scriptIterator(scriptCode);
  script.name = "avatar";
  // console.log(script);

  // template
  const template = templateIterator(templateCode);
  // console.log(template);

  const app = {
    script,
    template,
  };

  const rast = reactTemplateBuilder(app);
  const hasStyle = false;
  const targetAst = reactIterator(rast, app, hasStyle);
  const targetCode = generate(targetAst).code;

  const reactCode = targetCode
  // const reactCode = formatCode(targetCode, "react");

  console.log("reactCode");
  console.log(reactCode);

  const styles = [];
  return [reactCode, styles];
}

const [script, styles] = transformCode(
  getCode(templatePath),
  getCode(scriptPath),
  getCode(stylePath),
  getCode(lepusPath),
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
