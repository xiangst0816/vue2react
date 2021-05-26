import scriptIterator from "../src/scriptIterator";
import templateIterator from "../src/templateIterator";
import lepusIterator from "../src/lepusIterator";
import configIterator from "../src/configIterator";
import reactIterator from "../src/reactIterator";
import reactTemplateBuilder from "../src/reactTemplateBuilder";
import formatCode from "../src/utils/formatCode";

import generate from "@babel/generator";
import path from "path";
import fs from "fs";

export function readCode(name: string, baseDir: string) {
  const scriptPath = path.resolve(baseDir, `${name}.js`);
  const stylePath = path.resolve(baseDir, `${name}.ttss`);
  const templatePath = path.resolve(baseDir, `${name}.ttml`);
  const configPath = path.resolve(baseDir, `${name}.json`);

  function getCode(codePath: string) {
    return fs.readFileSync(codePath, "utf8");
  }

  return {
    templateCode: getCode(templatePath),
    scriptCode: getCode(scriptPath),
    styleCode: getCode(stylePath),
    configCode: getCode(configPath),
  };
}

// xx/xx/components/button.ttml
export function transform(
  name: string, // eg: xx/xx/components/button.ttml -> button
  baseDir: string // eg: xx/xx/components/button.ttml -> xx/xx/components/
): string {
  const code = readCode(name, baseDir);

  // script
  const script = scriptIterator(code.scriptCode);
  script.name = name;

  // template
  const template = templateIterator(code.templateCode);
  // console.log(template);
  const lepus = lepusIterator(code.configCode, baseDir);
  const config = configIterator(code.configCode);
  const app = {
    script,
    template,
    lepus,
    config,
  };

  const rast = reactTemplateBuilder(app);
  const hasStyle = Boolean(code.styleCode);

  // collect-data + react-template => react-ast
  const targetAst = reactIterator(rast, app, hasStyle);

  const targetCode = generate(targetAst).code;

  // const reactCode = targetCode
  const reactCode = formatCode(targetCode, "react");

  // console.log("reactCode");
  // console.log(reactCode);
  return reactCode;
}
