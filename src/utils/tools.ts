import * as t from "@babel/types";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import _ from "lodash";

// Life-cycle methods relations mapping
export const cycle: { [name: string]: any } = {
  // Component 部分
  created: "componentCreated", // * 需要在 constructor 写明 this.componentCreated()
  attached: "componentAttached", // * 需要在 constructor 写明 this.componentAttached()，created 之后调用
  ready: "componentDidMount",
  detached: "componentWillUnmount",
  error: "componentDidCatch",
  moved: "componentMoved", // 没有对等实现
  // Card 部分
  // TODO: 待定

  // created: 'componentWillMount',
  // mounted: 'componentDidMount',
  // updated: 'componentDidUpdate',
  // beforeDestroy: 'componentWillUnmount',
  // errorCaptured: 'componentDidCatch'
};

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
          t.memberExpression(t.identifier("PropTypes"), t.identifier(type))
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
          t.identifier(obj.typeValue)
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
  return name
    ? name
        .split("-")
        .map((item) => item[0].toUpperCase() + item.substr(1))
        .join("")
    : "ReactComponent";
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

//  <template name="xxx"> -> this.renderXxxTemplateComponent
export function getTemplateComponentName (text:string) {
  return _.camelCase(
      `render-${text}-template-component`
  )
}