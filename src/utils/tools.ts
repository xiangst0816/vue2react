import * as t from "@babel/types";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
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

  return t.objectExpression([]);
}

export function getIdentifierFromTexts(attrs: string[]): string[] {
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

// typeClass -> lepusTypeClass
export function getLepusClassMethodName(lepusFunctionName: string) {
  return _.camelCase(`lepus-${lepusFunctionName}`);
}

// 'a.b(c) + cc' -> {identifiers:['a','cc'],expression:ast}
export function transformTextToExpression(text: string) {
  const ast = parser.parse(text);
  const identifiers: string[] = [];
  let expression: t.Expression = t.identifier(text); // default
  traverse(ast, {
    Identifier(path) {
      if (!identifiers.includes(path.node.name)) {
        if (t.isMemberExpression(path.parent)) {
          if (path.parent.object === path.node) {
            identifiers.push(path.node.name);
          }
        } else {
          identifiers.push(path.node.name);
        }
      }
    },
  });
  if (t.isExpressionStatement(ast.program.body[0])) {
    // Have valid data
    expression = ast.program.body[0].expression;
  }
  return { identifiers, expression };
}

// this.getJSModule("GlobalEventEmitter").addListener(eventName, this[thisFuncName])
export function getGlobalEventEmitterStatement(
  eventName: string,
  eventType: string,
  thisFuncName: string
) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.callExpression(
          t.memberExpression(t.thisExpression(), t.identifier("getJSModule")),
          [t.stringLiteral("GlobalEventEmitter")]
        ),
        t.identifier(eventType || "addListener")
      ),
      [
        t.stringLiteral(eventName),
        t.memberExpression(t.thisExpression(), t.identifier(thisFuncName)),
      ]
    )
  );
}

export function getClassMethodInClassBody(
  name: string,
  path: NodePath<t.ClassBody>
) {
  return (path.node.body.find((node) => {
    return (
      t.isClassMethod(node) &&
      t.isIdentifier(node.key) &&
      node.key.name === name
    );
  }) as any) as t.ClassMethod | undefined;
}

export function getOrCreatedClassMethodInClassBody(
  name: string,
  path: NodePath<t.ClassBody>,
  params: string[]
) {
  let node = getClassMethodInClassBody(name, path);

  // 1. create -> componentDidMount(){}
  if (!node) {
    node = t.classMethod(
      "method",
      t.identifier(name),
      params.map((i) => t.identifier(i)),
      t.blockStatement([])
    );
    path.node.body.push(node);
  }
  return node;
}

// [Literal('string'), Identifier(aa), BinaryExpression(left,right)]
// -> 'string' + aa + (left + right)
export function getCollectedProperty(
  list: t.Expression[],
  isProperty: boolean = false
): t.Expression {
  let element: t.Expression;

  // 变量的话，如果只有一个，作为属性需要加一个空字符串
  // [Identifier(aa)] -> '' + aa
  if (isProperty && list.length === 1 && t.isIdentifier(list[0])) {
    list.unshift(t.stringLiteral(""));
  }

  if (list.length === 1) {
    // [Literal('string')] -> Literal('string')
    element = list[0];
  } else {
    // [Literal('s1'),Literal('s2')] -> BinaryExpression('s1', 's2')
    let res: any = [...list];
    while (res.length > 1) {
      let left = res.shift();
      let right = res.shift();
      res.unshift(t.binaryExpression("+", left, right));
    }

    element = res[0];
  }
  return element;
}
