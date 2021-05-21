// const compiler = require("vue-template-compiler");
const { parse } = require("@byted-lynx/parser-ttml");

import jsxElementGenerator from "./jsxElementGenerator";
import logger from "./utils/logUtil";
import { Template } from "./utils/types";

export default function templateIterator(template: string): Template {
  const { root, errors } = parse(template);

  // const { ast, errors, tips } = compiler.compile(template, {
  //   whitespace: "condense",
  // });



  if (errors.length > 0) {
    console.log(JSON.stringify(errors,null,2))
    return errors.forEach((error: string) => {
      logger.log(`${error} ---vue-template-compiler: compile`, "error");
    });
  }

  // if (tips.length > 0) {
  //   tips.forEach((tip: string) => {
  //     logger.log(`${tip} ---vue-template-compiler: compile`, "info");
  //   });
  // }

  return jsxElementGenerator(root, undefined, new Set(), new Set());
}
