import * as t from "@babel/types";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import _ from "lodash";

// Life-cycle methods relations mapping
export const cycle: { [name: string]: any } = {
  // Component 部分
  created: "componentCreated", // * TODO 需要在 constructor 写明 this.componentCreated()
  attached: "componentAttached", // * TODO 需要在 constructor 写明 this.componentAttached()，created 之后调用
  ready: "componentDidMount",
  detached: "componentWillUnmount",
  error: "componentDidCatch",
  moved: "componentMoved", // 没有对等实现
  // Card 部分
  // TODO: 处理 Card 的映射关系

  // created: 'componentWillMount',
  // mounted: 'componentDidMount',
  // updated: 'componentDidUpdate',
  // beforeDestroy: 'componentWillUnmount',
  // errorCaptured: 'componentDidCatch'
};

function getFormatPropType(type: string) {
  return type === "boolean" ? "bool" : type;
}

export function genPropTypes(props: { [name: string]: any }) {
  const properties: t.ObjectProperty[] = [];

  for (const name in props) {
    if (props.hasOwnProperty(name)) {
      const obj = props[name];
      let val;

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
          t.identifier(getFormatPropType(obj.typeValue))
        );
        if (obj.required) {
          val = t.memberExpression(val, t.identifier("isRequired"));
        }
      }

      properties.push(t.objectProperty(t.identifier(name), val));
    }
  }
  // babel not support generate static class property now.
  return t.classProperty(
    t.identifier("static propTypes"),
    t.objectExpression(properties)
  );
}

export function genDefaultProps(props: { [name: string]: any }) {
  const properties: t.ObjectProperty[] = [];

  for (const name in props) {
    if (props.hasOwnProperty(name)) {
      const obj = props[name];
      let val;
      if (obj.defaultValue !== undefined) {
        // igonre "type === 'typesOfArray'" condition,
        // because the defaultValue is undefined when type is typesOfArray
        switch (obj.type) {
          case "string":
            val = t.stringLiteral(obj.defaultValue);
            break;
          case "boolean":
            val = t.booleanLiteral(obj.defaultValue);
            break;
          case "number":
            val = t.numericLiteral(Number(obj.defaultValue));
            break;
          case "array":
            val = t.arrayExpression(obj.defaultValue.elements);
            break;
          case "object":
            val = t.objectExpression(obj.defaultValue.properties);
            break;
          default:
            break;
        }
        properties.push(t.objectProperty(t.identifier(name), val));
      }
    }
  }
  // babel not support generate static class property now.
  return t.classProperty(
    t.identifier("static defaultProps"),
    t.objectExpression(properties)
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
  let expression: t.Expression = t.identifier(text);
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
          debugger;
        }
      }
    },
  });
  if (t.isExpressionStatement(ast.program.body[0])) {
    expression = ast.program.body[0].expression;
  }
  console.log("text->", text, "identifiers->", identifiers);
  return { identifiers, expression };
}
