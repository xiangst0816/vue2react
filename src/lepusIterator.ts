import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { Lepus } from "./utils/types";
import * as t from "@babel/types";

export default function lepusIterator(config: string, root: string): Lepus[] {
  const configObject = JSON.parse(config);
  const list: Lepus[] = [];
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
        const lepusSpecifiers: string[][] = [];
        const filepath = path.resolve(root, lepusPath);
        const lepusCode = fs.readFileSync(filepath, "utf8");

        const lepusAst = parser.parse(lepusCode, { sourceType: "module" });
        traverse(lepusAst, {
          ExportNamedDeclaration(path) {
            if (
              t.isFunctionDeclaration(path.node.declaration) &&
              path.node.declaration.id.name
            ) {
              const name = path.node.declaration.id.name;
              lepusSpecifiers.push([name, name]);
            } else if (path.node.specifiers.length > 0) {
              const specifiers = path.node.specifiers;
              specifiers.forEach((specifier) => {
                lepusSpecifiers.push([
                  specifier.local.name,
                  specifier.exported.name,
                ]);
              });
            }
          },
        });

        list.push({
          path: lepusPath,
          name: lepusName,
          specifiers: lepusSpecifiers,
        });
      }
    }
  }
  return list;
}
