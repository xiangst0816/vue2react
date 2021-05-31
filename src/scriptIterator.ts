import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { LynxComponentCycle, LynxCardCycle } from "./common";
import ScriptVisitor from "./scriptVisitor";

export default function scriptIterator(script: string) {
  // AST for script in lynx
  const vast = parse(script, {
    sourceType: "module",
  });

  const visitor = new ScriptVisitor();

  // tt type -> Card/Component
  traverse(vast, {
    CallExpression(path) {
      if (
        t.isProgram(path.parentPath.parent) &&
        t.isIdentifier(path.node.callee) &&
        (path.node.callee.name === "Component" ||
          path.node.callee.name === "Card")
      ) {
        visitor.script.component = path.node.callee.name === "Component";
      }
    },
  });

  // Processing function notation
  // { onError: function () {} } -> { onError () {} }
  // { onError: () => {} } -> { onError () {} }
  traverse(vast, {
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const name = (path.node.key as t.Identifier).name;
      if (t.isFunctionExpression(path.node.value)) {
        const params = path.node.value.params;
        const body = path.node.value.body;

        path.replaceWith(
          t.objectMethod("method", t.identifier(name), params, body)
        );
      } else if (t.isArrowFunctionExpression(path.node.value)) {
        const params = path.node.value.params;
        const body = path.node.value.body;

        if (t.isBlockStatement(body)) {
          path.replaceWith(
            t.objectMethod("method", t.identifier(name), params, body)
          );
        }
      }
    },
  });

  // collect props and data key firstly
  traverse(vast, {
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        ((parent.callee as t.Identifier).name === "Component" ||
          (parent.callee as t.Identifier).name === "Card")
      ) {
        switch (name) {
          // opt.data
          case "data":
            const node = path.node.value;
            if (t.isObjectExpression(node)) {
              // Support following syntax:
              // data: {a: 1}
              visitor.dataHandler(node.properties, true);
            }
            break;
          // opt.props
          case "properties":
            visitor.propsHandler(path);
            break;
          default:
            break;
        }
      }
    },
  });

  // collect name, methods, computed, cycle...
  traverse(vast, {
    ObjectMethod(path: NodePath<t.ObjectMethod>) {
      // isTopLevelMethod -> Component({ m(){} })
      const isTopLevelMethod = Boolean(
        t.isProgram(path?.parentPath?.parentPath?.parentPath?.parent)
      );
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;

      if (parent && t.isCallExpression(parent) && isTopLevelMethod) {
        const lynxComponentCycleKeys = Object.keys(LynxComponentCycle);
        const lynxCardCycleKeys = Object.keys(LynxCardCycle);

        const isInComponent =
          (parent.callee as t.Identifier).name === "Component";
        const isInCard = (parent.callee as t.Identifier).name === "Card";

        if (isInComponent && lynxComponentCycleKeys.includes(name)) {
          visitor.componentCycleMethodHandler(path);
        } else if (isInCard && lynxCardCycleKeys.includes(name)) {
          visitor.cardCycleMethodHandler(path);
        } else {
          // Support following syntax:
          // treat as a normal method
          // { outerMethods () {} }
          visitor.objectMethodHandler(path);
        }
      } else if (parent && t.isObjectProperty(parent)) {
        const parentName = (parent.key as t.Identifier).name;
        switch (parentName) {
          case "methods":
            // Support following syntax:
            // methods: { handleClick() {...} }
            visitor.objectMethodHandler(path);
            break;
          case "computed":
            // Support following syntax:
            // computed: { reverseName() {...} }
            visitor.computedHandler(path);
            break;
          case "pageLifetimes":
            // Support following syntax:
            // pageLifetimes: { show() {...}, hide() {...} }
            // TODO: 待支持（函数写法转换，函数mapping）
            break;
          default:
            break;
        }
      }
    },

    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        ((parent.callee as t.Identifier).name === "Component" ||
          (parent.callee as t.Identifier).name === "Card")
      ) {
        switch (name) {
          case "name":
            visitor.nameHandler(path);
            break;
          default:
            break;
        }
      }
    },
  });

  // collect top import/variable/expression(not component/card)/function s
  vast.program.body.forEach((i) => {
    const isCardOrComponentStatement =
      t.isExpressionStatement(i) &&
      t.isCallExpression(i.expression) &&
      t.isIdentifier(i.expression.callee) &&
      (i.expression.callee.name === "Component" ||
        i.expression.callee.name === "Card");
    if (!isCardOrComponentStatement) {
      visitor.topModuleDeclarationsAndExpressionsHandler(i);
    }
  });

  return visitor.script;
}
