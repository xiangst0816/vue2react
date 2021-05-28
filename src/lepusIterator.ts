import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { anyObject, Lepus } from "./utils/types";
import * as t  from "@babel/types";

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

        const lepusCode = lepusCodeMap.get(lepusName) || "";

        const lepusAst = parser.parse(lepusCode, { sourceType: "module" });
        traverse(lepusAst, {
          ExportNamedDeclaration(path) {
            if (
              t.isFunctionDeclaration(path.node.declaration) &&
              path.node?.declaration?.id?.name
            ) {
              const name = path.node.declaration.id.name;
              lepusSpecifiers.push([name, name]);
            } else if (path.node.specifiers.length > 0) {
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
