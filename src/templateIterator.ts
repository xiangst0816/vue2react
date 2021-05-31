const { parse } = require("@byted-lynx/parser-ttml");
import jsxElementGenerator from "./jsxElementGenerator";
import logger from "./utils/logUtil";
import { Template } from "./utils/types";

export default function templateIterator(template: string): Template {
  const { root, errors } = parse(template);

  if (errors.length > 0) {
    return errors.forEach((error: string) => {
      logger.log(`${error} ---compiler: compile`, "error");
    });
  }

  return jsxElementGenerator(
    root,
    undefined,
    new Set(),
    new Set(),
    new Map(),
    new Map(),
    new Set()
  );
}
