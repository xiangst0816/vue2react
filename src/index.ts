import fs from "fs";
import path from "path";
import generate from "@babel/generator";

import lepusIterator from "./lepusIterator";
import scriptIterator from "./scriptIterator";
import templateIterator from "./templateIterator";
import reactIterator from "./reactIterator";
import reactTemplateBuilder from "./reactTemplateBuilder";
import formatCode from "./utils/formatCode";
import { anyObject } from "./utils/types";

export interface ICode {
  templateCode: string;
  scriptCode: string;
  config: anyObject;
  lepusCodeMap: Map<string, string>;
  styleCode?: string;
}

export function readCode(name: string, baseDir: string): ICode {
  const scriptPath = path.resolve(baseDir, `${name}.js`);
  const stylePath = path.resolve(baseDir, `${name}.ttss`);
  const templatePath = path.resolve(baseDir, `${name}.ttml`);
  const configPath = path.resolve(baseDir, `${name}.json`);

  function getCode(codePath: string) {
    return fs.readFileSync(codePath, "utf8");
  }

  const configCode = getCode(configPath);
  const lepusCodeMap = new Map();
  let configObject: anyObject = {};

  try {
    configObject = JSON.parse(configCode);
    if (
      "usingTemplateAPI" in configObject &&
      "templateFunctions" in configObject.usingTemplateAPI
    ) {
      const templateFunctions =
        (configObject.usingTemplateAPI || []).templateFunctions || [];
      for (let i = 0; templateFunctions.length > i; i++) {
        if (templateFunctions[i]) {
          const lepusPath = templateFunctions[i].path;
          const lepusName = templateFunctions[i].name;
          if (lepusPath && lepusName) {
            const filepath = path.resolve(baseDir, lepusPath);
            lepusCodeMap.set(lepusName, getCode(filepath));
          }
        }
      }
    }
  } catch (e) {
    // empty
  }

  return {
    templateCode: getCode(templatePath),
    scriptCode: getCode(scriptPath),
    config: configObject,
    lepusCodeMap: lepusCodeMap,
    styleCode: getCode(stylePath),
  };
}

export function transformCode(
  code: ICode,
  componentName: string,
  options: anyObject // TODO: 增加内置参数控制，各类默认行为给一个可控入口
) {
  // script
  const script = scriptIterator(code.scriptCode);
  script.name = componentName;

  const template = templateIterator(code.templateCode);
  const lepus = lepusIterator(code.config, code.lepusCodeMap);
  const app = {
    script,
    template,
    lepus,
    config: code.config,
  };

  const rast = reactTemplateBuilder(app);
  const hasStyle = Boolean(code.styleCode);

  // collect-data + react-template => react-ast
  const targetAst = reactIterator(rast, app, hasStyle);
  const targetCode = generate(targetAst).code;

  // const reactCode = targetCode
  const reactCode = formatCode(targetCode, "react");
  return reactCode;
}

export interface ITransformParams {
  baseDir: string; // eg: xx/xx/components/button.ttml -> xx/xx/components/
  filename: string; // eg: xx/xx/components/button.ttml -> button
  componentName?: string; // 转为组件的话，组件名称；eg: arco-button / ArcoButton
  options?: anyObject; // 其他编译参数
}

export function transform(params: ITransformParams): string | undefined {
  const baseDir = params.baseDir;
  const filename = params.filename;
  const componentName = params.componentName || params.filename;
  const code = readCode(filename, baseDir);
  return transformCode(code, componentName, params.options || {});
}

export interface ITransformFileParams extends ITransformParams {
  distDir: string; // 结果文件夹
}

export function transformFile(params: ITransformFileParams): void {
  const script = transform({
    baseDir: params.baseDir,
    filename: params.filename,
    componentName: params.componentName,
    options: params.options,
  });

  const dist = path.resolve(params.distDir);
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
  }

  // write react js file
  fs.writeFileSync(path.resolve(dist, `${params.filename}.jsx`), script);
}
