import lepusIterator from "./lepusIterator";

const compiler = require("vue-template-compiler");

import fs from "fs";
import path from "path";
import generate from "@babel/generator";

import scriptIterator from "./scriptIterator";
import templateIterator from "./templateIterator";
import reactIterator from "./reactIterator";
import reactTemplateBuilder from "./reactTemplateBuilder";
import formatCode from "./utils/formatCode";
import logger from "./utils/logUtil";
import { anyObject } from "./utils/types";
import configIterator from "./configIterator";

export { default as configIterator } from "./configIterator";
export { default as lepusIterator } from "./lepusIterator";
export { default as reactIterator } from "./reactIterator";
export { default as scriptIterator } from "./scriptIterator";
export { default as templateIterator } from "./templateIterator";
export { default as reactTemplateBuilder } from "./reactTemplateBuilder";
export { default as formatCode } from "./utils/formatCode";

export function transformCode(sourceCode: string) {
  try {
    // clear log history
    logger.clearHistory();

    const result = compiler.parseComponent(formatCode(sourceCode, "vue"), {
      pad: "line",
    });

    if (result.errors.length > 0) {
      return result.errors.forEach((error: string) =>
        logger.log(`${error} ---vue-template-compiler: parseComponent`, "error")
      );
    }

    // 原始 js 代码
    let preScript = "export default {}";
    if (result.script && result.script.content) {
      preScript = result.script.content;
    }

    // template string
    const preTemplate = result.template.content;
    const styles = result.styles;

    const hasStyle = styles.length > 0;

    const preConfig = "";
    const root = ""; // 组件位置

    // iterator 搜集数据
    const script = scriptIterator(preScript);
    const template = templateIterator(preTemplate);
    const lepus = lepusIterator(preConfig, root);
    const config = configIterator(preConfig);

    const app = {
      script,
      template,
      lepus,
      config,
    };

    // react 模板相关
    const rast = reactTemplateBuilder(app);

    // collect-data + react-template => react-ast
    const targetAst = reactIterator(rast, app, hasStyle);
    const targetCode = generate(targetAst).code;

    const reactCode = formatCode(targetCode, "react");

    return [reactCode, styles, logger.logHistory];
  } catch (error) {
    logger.log(error.toString(), "error");
  }
}

// src: *.vue 的路径
// targetPath: 结果的路径
// dist: 结果的路径文件夹
export function transformFile(src: string, targetPath: string, dist: string) {
  const sourceCode = fs.readFileSync(path.resolve(__dirname, src), "utf8");

  const [script, styles] = transformCode(sourceCode);

  // write react js file
  fs.writeFileSync(targetPath, script);

  // write react css file, delete null line in the start and end
  if (styles.length > 0) {
    const styleContent = styles
      .map((style: anyObject) => style.content.replace(/^\s+|\s+$/g, ""))
      .join("\n");
    fs.writeFileSync(path.resolve(dist, "index.css"), styleContent);
  }
}

export function transformFile2(
  srcPath: string,
  targetName: string,
  distDir: string
) {
  const sourceCode = fs.readFileSync(srcPath, "utf8");

  const [script, styles] = transformCode(sourceCode);

  // write react js file
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  fs.writeFileSync(path.resolve(distDir, targetName), script);

  // write react css file, delete null line in the start and end
  if (styles.length > 0) {
    const styleContent = styles
      .map((style: anyObject) => style.content.replace(/^\s+|\s+$/g, ""))
      .join("\n");
    fs.writeFileSync(path.resolve(distDir, "index.css"), styleContent);
  }
}
