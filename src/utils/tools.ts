import * as t from "@babel/types";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import _ from "lodash";
import { ScriptProps } from "./types";

function getFormatPropType(type: string) {
  return type === "boolean" ? "bool" : type;
}

export function genPropTypes(props: Map<string, ScriptProps>, name: string) {
  const properties: t.ObjectProperty[] = [];
  const componentName = formatComponentName(name);

  for (let [name, obj] of props) {
    let val: t.Expression;

    if (obj.type === "typesOfArray") {
      // Support following syntax:
      // static propType = {text: PropTypes.oneOfType([PropTypes.string, PropTypes.number])}
      const elements = (obj.typeValue as string[]).map((type) =>
        t.memberExpression(
          t.identifier("PropTypes"),
          t.identifier(getFormatPropType(type))
        )
      );

      val = t.callExpression(
        t.memberExpression(
          t.identifier("PropTypes"),
          t.identifier("oneOfType")
        ),
        [t.arrayExpression(elements)]
      );
    } else {
      // Support following syntax:
      // static propType = {title: PropTypes.string, list: PropTypes.array.isRequired}
      val = t.memberExpression(
        t.identifier("PropTypes"),
        t.identifier(getFormatPropType(obj.typeValue as string))
      );
      if (obj.required) {
        val = t.memberExpression(val, t.identifier("isRequired"));
      }
    }

    properties.push(t.objectProperty(t.identifier(name), val));
  }

  // babel not support generate static class property now.
  return t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(
        t.identifier(componentName),
        t.identifier("propTypes"),
        false
      ),
      t.objectExpression(properties)
    )
  );
}

export function genDefaultProps(props: Map<string, ScriptProps>, name: string) {
  const properties: t.ObjectProperty[] = [];
  const componentName = formatComponentName(name);
  for (let [name, obj] of props) {
    let val;
    // igonre "type === 'typesOfArray'" condition,
    // because the defaultValue is undefined when type is typesOfArray
    switch (obj.type) {
      case "string":
        val = t.stringLiteral(obj.defaultValue || "");
        break;
      case "boolean":
        val = t.booleanLiteral(Boolean(obj.defaultValue));
        break;
      case "number":
        val = t.numericLiteral(Number(obj.defaultValue));
        break;
      case "array":
        val = obj.defaultValue?.elements
          ? t.arrayExpression(obj.defaultValue.elements)
          : t.nullLiteral();
        break;
      case "object":
        val = obj.defaultValue?.properties
          ? t.objectExpression(obj.defaultValue?.properties)
          : t.nullLiteral();
        break;
      case "element":
        val = t.nullLiteral();
        break;
      case "func":
        val = t.nullLiteral();
        break;
      case "any":
        if (obj.defaultValue === null) {
          val = t.nullLiteral();
        } else {
          val = t.identifier("undefined");
        }
        break;
      default:
        val = t.nullLiteral();
        break;
    }

    properties.push(t.objectProperty(t.identifier(name), val));
  }

  // babel not support generate static class property now.
  return t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(
        t.identifier(componentName),
        t.identifier("defaultProps"),
        false
      ),
      t.objectExpression(properties)
    )
  );
}

export function formatComponentName(name: string): string {
  return name ? _.upperFirst(_.camelCase(name)) : "ReactComponent";
}

export function genObjectExpressionFromObject(
  obj: Record<any, any>
): t.ObjectExpression {
  const objAst = parser.parse(`var _=${JSON.stringify(obj)}`, {
    sourceType: "module",
  });

  if (
    t.isVariableDeclaration(objAst.program.body[0]) &&
    t.isVariableDeclarator(objAst.program.body[0].declarations[0]) &&
    t.isObjectExpression(objAst.program.body[0].declarations[0].init)
  ) {
    return objAst.program.body[0].declarations[0].init;
  }

  return t.objectExpression([t.objectProperty()]);
}

export function getIdentifierFromTexts(attrs: string[]): string[] {
  // console.log("！！！检查这里是否有未检出的 关键字");
  // console.log(attrs);
  const list: string[] = [];
  // Notice: '25 * index', 'value1 + value2' 这里的 attr 拆分出来真正的变量
  attrs.forEach((attr) => {
    const ast = parser.parse(attr);
    traverse(ast, {
      Identifier(path) {
        if (!list.includes(path.node.name)) {
          list.push(path.node.name);
        }
      },
    });
  });

  return list;
}

// <template name="xxx"> -> this.renderXxxTemplateComponent
export function getTemplateComponentName(text: string) {
  return _.camelCase(`render-${text}-template-component`);
}

// 'a.b(c) + cc' -> {identifiers:['a','cc'],expression:ast}
export function transformTextToExpression(text: string) {
  const ast = parser.parse(text);
  const identifiers: string[] = [];
  let expression: t.Expression = t.identifier(text); // default
  traverse(ast, {
    Identifier(path) {
      if (!identifiers.includes(path.node.name)) {
        if (
          t.isMemberExpression(path.parent) &&
          path.parent.object === path.node
        ) {
          // item.a, item.a.d -> [item]
          identifiers.push(path.node.name);
        } else if (
          // index -> [index]
          t.isExpressionStatement(path.parent) &&
          path.parent.expression === path.node
        ) {
          identifiers.push(path.node.name);
        } else if (
          // item+1 -> [item]
          t.isBinaryExpression(path.parent)
        ) {
          identifiers.push(path.node.name);
        } else if (
          // {...item} -> [item]
          t.isSpreadElement(path.parent)
        ) {
          identifiers.push(path.node.name);
        } else if (
          // {a||b} -> [a,b]
          t.isLogicalExpression(path.parent)
        ) {
          identifiers.push(path.node.name);
        } else if (
          // {a?b:1} -> [a,b]
          t.isConditionalExpression(path.parent)
        ) {
          identifiers.push(path.node.name);
        } else if (t.isCallExpression(path.parent)) {
          // sizeStyle(shape, src) -> [shape,src]
          path.parent.arguments.forEach((i) => {
            if (t.isIdentifier(i)) {
              identifiers.push(i.name);
            } else {
              // debugger;
            }
          });
        } else {
          // TODO
          console.log(
            `！！！！这个标识符未识别，不处理 -> ${path.node.name} <-`
          );
        }
      }
    },
  });
  if (t.isExpressionStatement(ast.program.body[0])) {
    // Have valid data
    expression = ast.program.body[0].expression;
  }
  console.log("text->", text, "identifiers->", identifiers);
  return { identifiers, expression };
}
