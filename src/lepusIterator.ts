import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { anyObject, Lepus } from "./utils/types";
import * as t from "@babel/types";

export default function lepusIterator(
  config: anyObject,
  lepusCodeMap: Map<string, string>
): Lepus[] {
  const list: Lepus[] = [];
  if (
    "usingTemplateAPI" in config &&
    "templateFunctions" in config.usingTemplateAPI
  ) {
    const templateFunctions =
      (config.usingTemplateAPI || []).templateFunctions || [];

    for (let i = 0; templateFunctions.length > i; i++) {
      if (templateFunctions[i]) {
        const lepusPath = templateFunctions[i].path;
        const lepusName = templateFunctions[i].name;
        const lepusSpecifiers: string[][] = [];
        const lepusFunctionDeclarations = new Map<
          string,
          t.FunctionDeclaration
        >();
        const lepusCode = lepusCodeMap.get(lepusName) || "";
        const lepusAst = parser.parse(lepusCode, { sourceType: "module" });
        // get all export functions specifier
        traverse(lepusAst, {
          ExportNamedDeclaration(path) {
            if (
              t.isFunctionDeclaration(path.node.declaration) &&
              path.node?.declaration?.id?.name
            ) {
              // export function statusClass(name, animate, loaded) {}
              const name = path.node.declaration.id.name;
              lepusSpecifiers.push([name, name]);
            } else if (path.node.specifiers.length > 0) {
              // export { statusErrorClass }
              const specifiers = path.node.specifiers;
              specifiers.forEach((specifier) => {
                if (t.isExportSpecifier(specifier)) {
                  lepusSpecifiers.push([
                    specifier.local.name,
                    t.isIdentifier(specifier.exported)
                      ? specifier.exported.name
                      : specifier.exported.value,
                  ]);
                }
              });
            }
          },
        });

        // get all export function declarations
        traverse(lepusAst, {
          FunctionDeclaration(path) {
            if (t.isIdentifier(path.node.id)) {
              const name = path.node.id.name;
              if (lepusSpecifiers.find((i) => i[0] === name)) {
                lepusFunctionDeclarations.set(name, path.node);
              }
            }
          },
        });

        list.push({
          path: lepusPath,
          name: lepusName,
          specifiers: lepusSpecifiers, // 导出的对象
          functionDeclarations: lepusFunctionDeclarations,
        });
      }
    }
  }
  return list;
}
